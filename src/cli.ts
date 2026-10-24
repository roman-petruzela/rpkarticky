import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { basename } from "node:path";
import { parseArgs } from "node:util";
import { fetchViewerLogin } from "./fetch.ts";
import { generate } from "./generate.ts";
import { themes } from "./themes.ts";

// Local preview: npm run dev -- [login] [--theme terminal]
// Writes SVGs for every theme into preview/<theme>/ plus preview/index.html
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { theme: { type: "string" } },
});

const token = process.env.RPK_TOKEN ?? execSync("gh auth token").toString().trim();
const login = positionals[0] ?? (await fetchViewerLogin(token));
const names = values.theme ? [values.theme] : Object.keys(themes);

let html = `<!doctype html><meta charset="utf-8"><title>rpkarticky preview</title>
<style>
  body { margin: 0; font-family: sans-serif; }
  section { padding: 24px; display: flex; flex-wrap: wrap; gap: 12px; }
  .dark { background: #0d1117; color: #e6edf3; }
  .light { background: #ffffff; color: #1f2328; }
  h2 { width: 100%; margin: 0; font-size: 14px; }
</style>`;

for (const name of names) {
  const paths = await generate(login, token, `preview/${name}`, name);
  for (const mode of ["dark", "light"]) {
    const imgs = paths
      .filter((p) => p.endsWith(`-${mode}.svg`))
      .map((p) => `<img src="${name}/${basename(p)}">`)
      .join("");
    html += `<section class="${mode}"><h2>${name} / ${mode}</h2>${imgs}</section>`;
  }
  console.log(`preview/${name}/`);
}

writeFileSync("preview/index.html", html);
console.log("preview/index.html");
