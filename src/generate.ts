import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchStats } from "./fetch.ts";
import { computeStats } from "./stats.ts";
import { renderLangs, renderStats } from "./render.ts";

// Shared by cli.ts and action.ts, returns paths of written files
export async function generate(login: string, token: string, outDir: string) {
  const stats = computeStats(await fetchStats(login, token), login);

  mkdirSync(outDir, { recursive: true });
  const files = {
    "stats.svg": renderStats(stats),
    "langs.svg": renderLangs(stats),
  };

  return Object.entries(files).map(([name, svg]) => {
    const path = join(outDir, name);
    writeFileSync(path, svg);
    return path;
  });
}
