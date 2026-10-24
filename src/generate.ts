import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchStats } from "./fetch.ts";
import { computeStats, type Stats } from "./stats.ts";
import { getDesign, palettes, type Mode } from "./designs/index.ts";

const MODES: Mode[] = ["dark", "light"];

export async function loadStats(login: string, token: string) {
  return computeStats(await fetchStats(login, token), login);
}

// Writes <file>-dark.svg and <file>-light.svg, returns their paths
export function writeCards(stats: Stats, outDir: string, designName: string, file = "stats") {
  const design = getDesign(designName);
  mkdirSync(outDir, { recursive: true });
  return MODES.map((mode) => {
    const path = join(outDir, `${file}-${mode}.svg`);
    writeFileSync(path, design.render({ stats, p: palettes[mode], mode }));
    return path;
  });
}
