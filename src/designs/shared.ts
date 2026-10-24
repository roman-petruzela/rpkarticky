import { bold, regular } from "../fonts.ts";
import type { Stats } from "../stats.ts";

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
export type Design = { name: string; description: string; render: (ctx: Ctx) => string };

// JetBrains Mono advance width is 600/1000 em, which makes column layout exact
export const charW = (size: number) => size * 0.6;

export const FONT = "rpk, 'JetBrainsMono Nerd Font Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const fmt = (n: number) => n.toLocaleString("en-US");

export const plural = (n: number, word: string) => `${fmt(n)} ${word}${n === 1 ? "" : "s"}`;

export const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

export const pad = (s: string, len: number) => s + " ".repeat(Math.max(0, len - s.length));

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
