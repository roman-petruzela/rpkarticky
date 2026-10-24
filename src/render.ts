import type { Stats } from "./stats.ts";

// Placeholder look, final design comes later

const WIDTH = 450;
const HEIGHT = 165;

const theme = {
  bg: "#1a1b27",
  border: "#e4e2e2",
  title: "#70a5fd",
  text: "#38bdae",
};

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function card(title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <style>
    .title { font: 600 18px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .label { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .small { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
  </style>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="4.5" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="25" y="35" class="title">${escape(title)}</text>
${body}
</svg>
`;
}

export function renderStats(stats: Stats) {
  const rows: [string, number][] = [
    ["Total Stars Earned:", stats.stars],
    ["Total Commits (last year):", stats.commits],
    ["Total PRs:", stats.prs],
    ["Total Issues:", stats.issues],
    ["Contributed to:", stats.contributedTo],
  ];

  const body = rows
    .map(([label, value], i) => {
      const y = 65 + i * 22;
      return `  <text x="25" y="${y}" class="label">${label}</text>\n  <text x="250" y="${y}" class="label">${value}</text>`;
    })
    .join("\n");

  return card(`${stats.name}'s GitHub Stats`, body);
}

export function renderLangs(stats: Stats) {
  const barWidth = WIDTH - 50;
  let x = 25;
  const bar = stats.languages
    .map((l) => {
      const w = (l.percent / 100) * barWidth;
      const rect = `  <rect x="${x}" y="50" width="${w}" height="8" fill="${l.color}"/>`;
      x += w;
      return rect;
    })
    .join("\n");

  const legend = stats.languages
    .map((l, i) => {
      const cx = 30 + (i % 2) * 200;
      const cy = 85 + Math.floor(i / 2) * 25;
      return `  <circle cx="${cx}" cy="${cy}" r="5" fill="${l.color}"/>\n  <text x="${cx + 12}" y="${cy + 4}" class="small">${escape(l.name)} ${l.percent.toFixed(2)}%</text>`;
    })
    .join("\n");

  return card("Most Used Languages", `${bar}\n${legend}`);
}
