import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { fetchViewerLogin } from "./fetch.ts";
import { loadStats, writeCards } from "./generate.ts";
import type { Stats } from "./stats.ts";

// Local preview: npm run dev -- [login] [--cached]
// Writes preview/stats-{dark,light}.svg and preview/index.html
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    // reuse preview/stats.json instead of calling the API, handy while tweaking the card
    cached: { type: "boolean", default: false },
  },
});

const CACHE = "preview/stats.json";
mkdirSync("preview", { recursive: true });

let stats: Stats;
if (values.cached && existsSync(CACHE)) {
  stats = JSON.parse(readFileSync(CACHE, "utf8"));
} else {
  const token = process.env.RPK_TOKEN ?? execSync("gh auth token").toString().trim();
  const login = positionals[0] ?? (await fetchViewerLogin(token));
  stats = await loadStats(login, token);
  writeFileSync(CACHE, JSON.stringify(stats));
}

const [dark, light] = writeCards(stats, "preview");

// Inline the SVGs so the preview is one self-contained file. Sandboxed browsers
// (Flatpak, Snap) only get access to the opened HTML file, not the files next to it.
const inline = (path: string) =>
  `data:image/svg+xml;base64,${readFileSync(path).toString("base64")}`;

// Both variants on GitHub's own page colors, at the width of a profile README
const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>rpkarticky preview</title>
<style>
  body { margin: 0; font: 14px/1.5 -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
  section { padding: 32px 20px; }
  .dark { background: #0d1117; color: #8d96a0; }
  .light { background: #ffffff; color: #59636e; }
  .readme { max-width: 880px; margin: 0 auto; }
  p { margin: 0 0 12px; }
  img { display: block; max-width: 100%; height: auto; }
</style>
<section class="dark"><div class="readme"><p>Dark</p><img src="${inline(dark!)}" alt="Dark variant"></div></section>
<section class="light"><div class="readme"><p>Light</p><img src="${inline(light!)}" alt="Light variant"></div></section>
</html>
`;

writeFileSync("preview/index.html", html);
console.log("preview/index.html");
