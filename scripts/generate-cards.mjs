/**
 * generate-cards.mjs — Automated OG/Twitter card PNG generator
 *
 * Reads card-content.json and the SVG template, replaces text by
 * inkscape:label, renders each page card via sharp (librsvg), and
 * writes card-mapping.json.
 *
 * Usage: node scripts/generate-cards.mjs
 * Run from WebUI/src/ (where package.json lives).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..", "src");
const SVG_SRC = `${ROOT}/wwwroot/assets/images/twitter-cards/vvg-online-home-twitter-card.svg`;
const OUTPUT_DIR = `${ROOT}/wwwroot/assets/images/twitter-cards`;
const CONTENT_FILE = resolve(import.meta.dirname, "card-content.json");
const MAPPING_FILE = `${OUTPUT_DIR}/card-mapping.json`;

/* ── Read inputs ───────────────────────────────────────── */
const svgTemplate = readFileSync(SVG_SRC, "utf-8");
const content = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

/* ── Text replacer ──────────────────────────────────────── */
function escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// SVG text elements use this pattern:
//   <text ... inkscape:label="LABEL"> ... <tspan ...>TEXT</tspan> [more tspans] ... </text>
// We find the label, then replace each <tspan>'s inner text.
function setText(svg, label, lines) {
    // Find the <text> block for this label
    const labelAttr = `inkscape:label="${label}"`;
    const textStart = svg.indexOf(labelAttr);
    if (textStart === -1) {
        console.warn(`  ⚠ Label "${label}" not found in SVG`);
        return svg;
    }

    // Walk back to find opening <text
    let openTagStart = svg.lastIndexOf("<text", textStart);
    // Walk forward to find </text>
    const textEnd = svg.indexOf("</text>", textStart);
    if (textEnd === -1) {
        console.warn(`  ⚠ Closing </text> not found for label "${label}"`);
        return svg;
    }

    const block = svg.slice(openTagStart, textEnd + 7); // include </text>
    const linesArr = Array.isArray(lines) ? lines : [lines];

    // Replace each <tspan>'s content IN ORDER
    let result = block;
    for (const line of linesArr) {
        const tspanMatch = result.match(/(<tspan[^>]*>)(.*?)(<\/tspan>)/);
        if (!tspanMatch) {
            console.warn(`  ⚠ Could not find enough <tspan> elements in label "${label}"`);
            break;
        }
        result = result.slice(0, tspanMatch.index + tspanMatch[1].length) +
                 line +
                 result.slice(tspanMatch.index + tspanMatch[1].length + tspanMatch[2].length);
    }

    return svg.slice(0, openTagStart) + result + svg.slice(textEnd + 7);
}

/* ── Generate cards ─────────────────────────────────────── */
const mapping = {};

for (const [slug, data] of Object.entries(content)) {
    console.log(`Generating ${slug}...`);

    let svg = svgTemplate;

    svg = setText(svg, "_punchline", escapeXml(data.punchline.trim()));
    svg = setText(svg, "_title", data.title.map(escapeXml));
    svg = setText(svg, "_description", data.description.map(escapeXml));

    // Write temp SVG for sharp to render
    const tempSvgPath = `${OUTPUT_DIR}/.tmp-${slug}.svg`;
    writeFileSync(tempSvgPath, svg, "utf-8");

    const pngPath = `${OUTPUT_DIR}/${slug}-twitter-card.png`;
    await sharp(tempSvgPath)
        .resize(800, 418)
        .png()
        .toFile(pngPath);

    // Cleanup temp file
    try { writeFileSync(tempSvgPath, ""); } catch {}
    if (existsSync(tempSvgPath)) try { writeFileSync(tempSvgPath, ""); } catch {}

    mapping[slug] = `${slug}-twitter-card.png`;
    console.log(`  ✓ ${slug}-twitter-card.png`);
}

/* ── Write card-mapping.json ────────────────────────────── */
// Merge with existing mapping to preserve entries not in card-content.json
let existing = {};
try { existing = JSON.parse(readFileSync(MAPPING_FILE, "utf-8")); } catch {}

const merged = { ...existing, ...mapping };

// Keep ordering: content entries first, then existing extras
const ordered = {};
for (const key of Object.keys(content)) ordered[key] = merged[key];
for (const key of Object.keys(existing)) {
    if (!(key in ordered)) ordered[key] = existing[key];
}

writeFileSync(MAPPING_FILE, JSON.stringify(ordered, null, 2) + "\n", "utf-8");
console.log("\n✓ card-mapping.json updated");
