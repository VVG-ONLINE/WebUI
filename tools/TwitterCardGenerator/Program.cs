using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using SkiaSharp;
using Svg.Skia;

var svgNs = XNamespace.Get("http://www.w3.org/2000/svg");
var inkNs = XNamespace.Get("http://www.inkscape.org/namespaces/inkscape");
const double titleFontSize = 11.2889;
var descFontSize = titleFontSize / 1.618;

var projectRoot = FindProjectRoot();
var svgTemplatePath = Path.Combine(projectRoot, "src", "wwwroot", "assets", "images", "twitter-cards", "vvg-online-home-twitter-card.svg");
var outputDir = Path.Combine(projectRoot, "src", "wwwroot", "assets", "images", "twitter-cards");
var blogIndexPath = Path.Combine(projectRoot, "src", "wwwroot", "assets", "data", "json", "blog-index.json");
var mappingPath = Path.Combine(outputDir, "card-mapping.json");

if (!File.Exists(svgTemplatePath))
{
    Console.WriteLine($"ERROR: SVG template not found at {svgTemplatePath}");
    Environment.Exit(1);
}

var svgTemplate = File.ReadAllText(svgTemplatePath);
var pages = GetPageSpecs(projectRoot, blogIndexPath);
var mapping = new Dictionary<string, string>();

Console.WriteLine($"Generating {pages.Count} Twitter card images...");

for (var i = 0; i < pages.Count; i++)
{
    var page = pages[i];
    var fileName = $"{page.Slug}-twitter-card.png";
    var outputPath = Path.Combine(outputDir, fileName);

    Console.WriteLine($"  [{i + 1}/{pages.Count}] {page.Slug}");

    var modifiedSvg = ModifySvg(svgTemplate, page);
    var tempSvg = Path.Combine(Path.GetTempPath(), $"twitter-card-{page.Slug}.svg");
    File.WriteAllText(tempSvg, modifiedSvg, new UTF8Encoding(false));

    try
    {
        using var svg = new SKSvg();
        svg.Load(tempSvg);

        if (svg.Picture == null)
        {
            Console.WriteLine("    ERROR: Failed to parse SVG");
            continue;
        }

        var bounds = svg.Picture.CullRect;
        var width = (int)Math.Ceiling(bounds.Width);
        var height = (int)Math.Ceiling(bounds.Height);

        var info = new SKImageInfo(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var surface = SKSurface.Create(info);
        if (surface == null)
        {
            Console.WriteLine("    ERROR: Failed to create surface");
            continue;
        }

        surface.Canvas.Clear(SKColors.White);
        surface.Canvas.DrawPicture(svg.Picture);
        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        using var stream = File.OpenWrite(outputPath);
        data.SaveTo(stream);

        var sizeKb = new FileInfo(outputPath).Length / 1024;
        Console.WriteLine($"    -> {fileName} ({sizeKb}KB)");
        mapping[page.Slug] = fileName;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"    ERROR: {ex.Message}");
    }
    finally
    {
        if (File.Exists(tempSvg)) File.Delete(tempSvg);
    }
}

File.WriteAllText(mappingPath, JsonSerializer.Serialize(mapping, new JsonSerializerOptions { WriteIndented = true }));
Console.WriteLine($"\nDone! Generated {mapping.Count} cards.");
Console.WriteLine($"Mapping saved to: {mappingPath}");

string FindProjectRoot()
{
    var dir = Directory.GetCurrentDirectory();
    while (dir != null)
    {
        if (File.Exists(Path.Combine(dir, "src", "VVG.Web.csproj")))
            return dir;
        dir = Directory.GetParent(dir)?.FullName;
    }
    Console.WriteLine("ERROR: Could not find project root (src/VVG.Web.csproj)");
    Environment.Exit(1);
    return "";
}

List<PageSpec> GetPageSpecs(string root, string indexPath)
{
    var list = new List<PageSpec>
    {
        new("home", "VVG ONLINE - Digital Business Consulting", "Transform your enterprise with cutting-edge digital business consulting. Decode complexity, design strategies, deliver results."),
        new("contact", "Contact Us - VVG ONLINE", "Ready to transform your business? Get in touch with VVG ONLINE today for expert digital consulting services."),
        new("services", "Services - VVG ONLINE", "Explore our comprehensive digital business consulting services designed to transform your enterprise through innovation."),
        new("about", "About VVG ONLINE", "We are a strategic partner in navigating the complexities of the digital age. Learn more about our mission and philosophy."),
        new("blog", "Blog - VVG Online", "Digital insights, expert analysis, and strategic perspectives on technology, innovation, and business transformation."),
        new("blog-archives", "Blog Archives - VVG Online", "Browse our complete collection of digital business insights, case studies, and thought leadership articles.")
    };

    if (File.Exists(indexPath))
    {
        var json = File.ReadAllText(indexPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var posts = JsonSerializer.Deserialize<List<BlogPost>>(json, options);
        if (posts != null)
        {
            foreach (var post in posts.Where(p => !p.Draft))
            {
                var slug = post.Slug ?? post.Filename?.ToLower().Replace(" ", "-").Replace("_", "-") ?? "unknown";
                list.Add(new PageSpec(slug, post.Title ?? "Untitled", post.Excerpt ?? ""));
            }
        }
    }

    return list;
}

string ModifySvg(string template, PageSpec page)
{
    var doc = XDocument.Parse(template);

    var punchlineText = doc.Descendants(svgNs + "text")
        .FirstOrDefault(e => e.Attribute(inkNs + "label")?.Value == "_punchline");
    var titleText = doc.Descendants(svgNs + "text")
        .FirstOrDefault(e => e.Attribute(inkNs + "label")?.Value == "_title");
    var descText = doc.Descendants(svgNs + "text")
        .FirstOrDefault(e => e.Attribute(inkNs + "label")?.Value == "_description");

    if (punchlineText != null)
    {
        var tspan = punchlineText.Element(svgNs + "tspan");
        if (tspan != null) tspan.Value = "// ACCESS THE FUTURE";
    }

    if (titleText != null)
    {
        var tspans = titleText.Elements(svgNs + "tspan").ToList();
        if (tspans.Count >= 1)
        {
            tspans[0].Value = TruncateTitle(page.Title);
            UpdateFontSize(tspans[0], titleFontSize);
        }
        for (var j = 1; j < tspans.Count; j++)
            tspans[j].Remove();
    }

    if (descText != null)
    {
        var tspans = descText.Elements(svgNs + "tspan").ToList();
        var (line1, line2) = SplitDescription(page.Description);

        if (tspans.Count >= 1)
        {
            tspans[0].Value = line1;
            UpdateFontSize(tspans[0], descFontSize);
        }
        if (tspans.Count >= 2)
        {
            if (!string.IsNullOrEmpty(line2))
            {
                tspans[1].Value = line2;
                UpdateFontSize(tspans[1], descFontSize);
            }
            else
            {
                tspans[1].Remove();
            }
        }

        UpdateFontSize(descText, descFontSize);
    }

    var ms = new MemoryStream();
    using (var xw = System.Xml.XmlWriter.Create(ms, new System.Xml.XmlWriterSettings
    {
        Encoding = new UTF8Encoding(false),
        OmitXmlDeclaration = false,
        Indent = false,
        NewLineHandling = System.Xml.NewLineHandling.None
    }))
    {
        doc.Save(xw);
    }
    return Encoding.UTF8.GetString(ms.ToArray());
}

void UpdateFontSize(XElement element, double fontSize)
{
    var styleAttr = element.Attribute("style");
    if (styleAttr == null) return;
    var style = styleAttr.Value;
    var newStyle = Regex.Replace(style, @"font-size:[\d.]+px", $"font-size:{fontSize:F4}px");
    styleAttr.Value = newStyle;
}

string TruncateTitle(string title)
{
    const int maxLen = 38;
    if (title.Length <= maxLen) return title;
    return title[..35] + "...";
}

(string line1, string line2) SplitDescription(string desc)
{
    const int maxLine = 48;
    if (string.IsNullOrEmpty(desc)) return ("", "");
    if (desc.Length <= maxLine) return (desc, "");

    var splitAt = desc.LastIndexOf(' ', maxLine);
    if (splitAt < 0) splitAt = maxLine;

    var line1 = desc[..splitAt].Trim();
    var remainder = desc[splitAt..].Trim();

    if (remainder.Length > maxLine)
        remainder = remainder[..(maxLine - 3)] + "...";

    return (line1, remainder);
}

record PageSpec(string Slug, string Title, string Description);

record BlogPost
{
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? Filename { get; set; }
    public string? Excerpt { get; set; }
    public bool Draft { get; set; }
}
