using System.Collections.Generic;

namespace VVG.Web.Models;

public class BlogIndex
{
    public BlogPost[]? Posts { get; set; }
    public Dictionary<string, int>? TagsSummary { get; set; }
    public Dictionary<string, int>? YearsSummary { get; set; }
}
