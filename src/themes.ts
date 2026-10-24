export type Mode = "dark" | "light";

export type Palette = {
  bg: string;
  border: string;
  title: string;
  label: string;
  value: string;
  muted: string;
  accent: string;
  track: string;
};

export type Theme = {
  // terminal themes get a window title bar, prompt-style titles and lowercase labels
  terminal: boolean;
  font: string;
  dark: Palette;
  light: Palette;
};

const SANS = "'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const themes = {
  // https://github.com/folke/tokyonight.nvim (night + day)
  tokyonight: {
    terminal: false,
    font: SANS,
    dark: {
      bg: "#1a1b26",
      border: "#292e42",
      title: "#7aa2f7",
      label: "#c0caf5",
      value: "#7dcfff",
      muted: "#565f89",
      accent: "#bb9af7",
      track: "#292e42",
    },
    light: {
      bg: "#e1e2e7",
      border: "#c4c8da",
      title: "#2e7de9",
      label: "#3760bf",
      value: "#007197",
      muted: "#848cb5",
      accent: "#9854f1",
      track: "#c4c8da",
    },
  },
  terminal: {
    terminal: true,
    font: MONO,
    dark: {
      bg: "#0c0e14",
      border: "#2a2e3a",
      title: "#1793d1", // Arch blue
      label: "#c5c8c6",
      value: "#b5e07a",
      muted: "#5c6370",
      accent: "#1793d1",
      track: "#1f232d",
    },
    light: {
      bg: "#fbfbfb",
      border: "#d0d7de",
      title: "#0f6fa3",
      label: "#24292f",
      value: "#1a7f37",
      muted: "#8c959f",
      accent: "#1793d1",
      track: "#eaeef2",
    },
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;

export function getTheme(name: string): Theme {
  if (!(name in themes)) {
    throw new Error(`Unknown theme '${name}', available: ${Object.keys(themes).join(", ")}`);
  }
  return themes[name as ThemeName];
}
