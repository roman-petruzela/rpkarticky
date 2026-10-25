import { bold, regular } from "./fonts.ts";
import type { Stats } from "./stats.ts";

export type Mode = "dark" | "light";

// Tokyo Night (night / day), https://github.com/folke/tokyonight.nvim
export type Palette = {
  bg: string;
  surface: string; // slightly offset panels
  line: string; // borders, grid
  fg: string;
  dim: string; // secondary text
  faint: string; // tertiary text, empty cells
  blue: string;
  cyan: string;
  green: string;
  yellow: string;
  orange: string;
  red: string;
  magenta: string;
};

export const palettes: Record<Mode, Palette> = {
  dark: {
    bg: "#1a1b26",
    surface: "#16161e",
    line: "#2f344d",
    fg: "#c0caf5",
    dim: "#7982a9",
    faint: "#3b4261",
    blue: "#7aa2f7",
    cyan: "#7dcfff",
    green: "#9ece6a",
    yellow: "#e0af68",
    orange: "#ff9e64",
    red: "#f7768e",
    magenta: "#bb9af7",
  },
  light: {
    bg: "#e1e2e7",
    surface: "#d5d6db",
    line: "#b4b8cc",
    fg: "#3760bf",
    dim: "#6172b0",
    faint: "#a8aecb",
    blue: "#2e7de9",
    cyan: "#007197",
    green: "#587539",
    yellow: "#8c6c3e",
    orange: "#b15c00",
    red: "#c64343",
    magenta: "#9854f1",
  },
};

export type Ctx = { stats: Stats; p: Palette; mode: Mode };

// JetBrains Mono advance width is 600/1000 em, which makes column layout exact
export const charW = (size: number) => size * 0.6;

const FONT = "rpk, 'JetBrainsMono Nerd Font Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const fmt = (n: number) => n.toLocaleString("en-US");

export const plural = (n: number, word: string) => `${fmt(n)} ${word}${n === 1 ? "" : "s"}`;

export const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

// Mix a hex color with another, t = 0 -> a, t = 1 -> b
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

// Heatmap level 0..4 like GitHub, relative to the busiest day
export function level(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil(Math.sqrt(count / max) * 4));
}

const SUP = ["¹", "²", "³", "⁴", "⁵", "⁶"];

// btop box: rounded frame with the title (and optionally a right label) set into the top border.
// The border is drawn as a path with gaps, so it works on any background.
export function btopBox(x: number, y: number, w: number, h: number, n: number, title: string, color: string, p: Palette, extra = "", fill = "none") {
  const cw = charW(12.5);
  const r = 6;
  const tx = x + 16;
  const tEnd = tx + (title.length + 3) * cw;
  const ew = extra ? (extra.length + 2) * cw : 0;
  const eStart = x + w - 16 - ew;

  const top = extra ? `M${tEnd} ${y} H${eStart} M${eStart + ew} ${y}` : `M${tEnd} ${y}`;
  const d = `${top} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} H${tx}`;

  let out = fill === "none" ? "" : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.2"/>`;
  out += `<text x="${tx + cw}" y="${y + 4}" style="font-size:12.5px;font-weight:700;fill:${p.fg}"><tspan style="fill:${color}">${SUP[n - 1]}</tspan>${escape(title)}</text>`;
  if (extra) {
    out += `<text x="${x + w - 16 - cw}" y="${y + 4}" text-anchor="end" style="font-size:11px;fill:${p.dim}">${escape(extra)}</text>`;
  }
  return out;
}

// btop's default gradient goes green -> yellow -> red with intensity
function heat(p: Palette, t: number) {
  return t < 0.5 ? mix(p.green, p.yellow, t * 2) : mix(p.yellow, p.red, (t - 0.5) * 2);
}

// btop-style graph: two dot columns per value like a braille cell, the left one interpolated
// Each column is a <g class="rise"> with a staggered delay, animated by the card's CSS.
export function dotGraph(opts: { x: number; baseY: number; w: number; values: number[]; p: Palette; rows?: number; rowH?: number; duration?: number }) {
  const { x, baseY, w, values, p, rows = 18, rowH = 5.2, duration = 900 } = opts;
  const max = Math.max(...values, 1);
  const cols: number[] = [];
  values.forEach((v, i) => {
    const prev = values[i - 1] ?? v;
    cols.push((prev + v) / 2, v);
  });
  const step = w / cols.length;

  let out = "";
  cols.forEach((v, i) => {
    const n = v > 0 ? Math.max(1, Math.round((v / max) * rows)) : 0;
    const cx = (x + i * step + step / 2).toFixed(2);
    out += `<g class="rise" style="animation-delay:${Math.round((i / cols.length) * duration)}ms">`;
    for (let r = 0; r < rows; r++) {
      const cy = (baseY - r * rowH).toFixed(2);
      if (r < n) out += `<circle cx="${cx}" cy="${cy}" r="1.6" fill="${heat(p, r / (rows - 1))}"/>`;
      else if (r === 0) out += `<circle cx="${cx}" cy="${cy}" r="0.9" fill="${p.faint}"/>`;
    }
    out += "</g>";
  });
  return out;
}

export function svg(opts: { width: number; height: number; title: string; style?: string; body: string }) {
  const { width, height, title, style = "", body } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}" xml:space="preserve">
<title>${escape(title)}</title>
<style>
@font-face { font-family: rpk; font-weight: 400; src: url(data:font/woff2;base64,${regular}) format("woff2"); }
@font-face { font-family: rpk; font-weight: 700; src: url(data:font/woff2;base64,${bold}) format("woff2"); }
text { font-family: ${FONT}; white-space: pre; font-variant-ligatures: none; }
${style}
</style>
${body}
</svg>
`;
}
