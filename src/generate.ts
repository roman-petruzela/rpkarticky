import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchStats } from "./fetch.ts";
import { computeStats } from "./stats.ts";
import { cards } from "./render.ts";
import { getTheme, type Mode } from "./themes.ts";

const MODES: Mode[] = ["dark", "light"];

// Shared by cli.ts and action.ts, writes <card>-<mode>.svg and returns their paths
export async function generate(login: string, token: string, outDir: string, themeName: string) {
  const theme = getTheme(themeName);
  const stats = computeStats(await fetchStats(login, token), login);

  mkdirSync(outDir, { recursive: true });
  const paths: string[] = [];
  for (const [name, render] of Object.entries(cards)) {
    for (const mode of MODES) {
      const path = join(outDir, `${name}-${mode}.svg`);
      writeFileSync(path, render({ theme, p: theme[mode], stats }));
      paths.push(path);
    }
  }
  return paths;
}
