import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderCard } from "./card.ts";
import { fetchStats } from "./fetch.ts";
import { computeStats, type Stats } from "./stats.ts";
import { palettes, type Mode } from "./svg.ts";

const MODES: Mode[] = ["dark", "light"];

export async function loadStats(login: string, token: string) {
  return computeStats(await fetchStats(login, token), login);
}

// Writes stats-dark.svg and stats-light.svg, returns their paths
export function writeCards(stats: Stats, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  return MODES.map((mode) => {
    const path = join(outDir, `stats-${mode}.svg`);
    writeFileSync(path, renderCard({ stats, p: palettes[mode], mode }));
    return path;
  });
}
