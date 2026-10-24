import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { designs } from "./designs/index.ts";
import { fetchViewerLogin } from "./fetch.ts";
import { loadStats, writeCards } from "./generate.ts";
import type { Stats } from "./stats.ts";

// Local preview gallery: npm run dev -- [login] [--design niri] [--cached]
// Writes preview/<design>/stats-{dark,light}.svg and preview/index.html
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    design: { type: "string" },
    // reuse preview/stats.json instead of calling the API, handy while tweaking designs
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

const names = values.design ? [values.design] : Object.keys(designs);
for (const name of names) {
  writeCards(stats, `preview/${name}`, name);
  console.log(`preview/${name}/`);
}

const sections = names
  .map((name) => {
    const snippet = `- uses: ./.rpkarticky
  with:
    design: ${name}`;
    return `<section>
  <header>
    <h2>${name}</h2>
    <p>${designs[name]!.description}</p>
  </header>
  <div class="readme">
    <picture class="only-dark"><img src="${name}/stats-dark.svg" alt="${name} dark"></picture>
    <picture class="only-light"><img src="${name}/stats-light.svg" alt="${name} light"></picture>
  </div>
  <details>
    <summary>Use this design</summary>
    <pre>${snippet}</pre>
  </details>
</section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en" data-mode="dark">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>rpkarticky designs</title>
<style>
  :root { color-scheme: dark; --bg: #0d1117; --panel: #010409; --fg: #e6edf3; --dim: #8d96a0; --line: #30363d; }
  [data-mode="light"] { color-scheme: light; --bg: #ffffff; --panel: #f6f8fa; --fg: #1f2328; --dim: #59636e; --line: #d1d9e0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--panel); color: var(--fg); font: 15px/1.5 -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 20px 80px; }
  .top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
  h1 { font-size: 24px; margin: 0; }
  .intro { color: var(--dim); margin: 0 0 32px; max-width: 64ch; }
  button { font: inherit; color: var(--fg); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 5px 12px; cursor: pointer; }
  button:focus-visible, summary:focus-visible { outline: 2px solid #4493f8; outline-offset: 2px; }
  section { margin-bottom: 48px; }
  section header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  h2 { font: 600 18px ui-monospace, SFMono-Regular, Menlo, monospace; margin: 0; }
  section header p { margin: 0; color: var(--dim); }
  /* same box as a profile README on github.com */
  .readme { background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 24px; }
  .readme img { display: block; max-width: 100%; height: auto; }
  [data-mode="dark"] .only-light, [data-mode="light"] .only-dark { display: none; }
  details { margin-top: 8px; color: var(--dim); }
  summary { cursor: pointer; width: fit-content; }
  pre { background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 12px 16px; color: var(--fg); overflow-x: auto; }
</style>
<main>
  <div class="top">
    <h1>${stats.login} stats designs</h1>
    <button id="mode" type="button" aria-pressed="false">Switch to light</button>
  </div>
  <p class="intro">Each design is one 840 px card shown at the width of a GitHub profile README. GitHub picks the dark or light file to match the viewer's theme.</p>
${sections}
</main>
<script>
  const btn = document.getElementById("mode");
  btn.addEventListener("click", () => {
    const light = document.documentElement.dataset.mode === "dark";
    document.documentElement.dataset.mode = light ? "light" : "dark";
    btn.textContent = light ? "Switch to dark" : "Switch to light";
    btn.setAttribute("aria-pressed", String(light));
  });
</script>
</html>
`;

writeFileSync("preview/index.html", html);
console.log("preview/index.html");
