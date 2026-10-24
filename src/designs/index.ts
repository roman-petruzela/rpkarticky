import { btop } from "./btop.ts";
import { fetch } from "./fetch.ts";
import { niri } from "./niri.ts";
import { pacman } from "./pacman.ts";
import type { Design } from "./shared.ts";

export { palettes, type Mode } from "./shared.ts";

export const designs: Record<string, Design> = { niri, btop, fetch, pacman };

export function getDesign(name: string): Design {
  const design = designs[name];
  if (!design) {
    throw new Error(`Unknown design '${name}', available: ${Object.keys(designs).join(", ")}`);
  }
  return design;
}
