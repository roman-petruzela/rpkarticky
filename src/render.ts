import type { Stats } from "./stats.ts";
import type { Palette, Theme } from "./themes.ts";

const WIDTH = 450;
const HEIGHT = 195;
const PAD = 25;

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const fmt = (n: number) => n.toLocaleString("en-US");

type Ctx = { theme: Theme; p: Palette; stats: Stats };

// Shared frame: card with a plain title, or a terminal window with a prompt line.
// Returns the SVG and the y where content may start.
function frame({ theme, p, stats }: Ctx, title: string, command: string, body: (top: number) => string) {
  const style = `
    text { font-family: ${theme.font}; }
    .title { font-size: 18px; font-weight: 600; fill: ${p.title}; }
    .label { font-size: 14px; font-weight: 600; fill: ${p.label}; }
    .value { font-size: 14px; font-weight: 700; fill: ${p.value}; }
    .small { font-size: 12px; fill: ${p.label}; }
    .muted { font-size: 12px; fill: ${p.muted}; }
    .big { font-size: 34px; font-weight: 700; fill: ${p.accent}; }
    .prompt { font-size: 14px; fill: ${p.label}; }`;

  let header: string;
  let top: number;
  if (theme.terminal) {
    const dots = ["#ff5f57", "#febc2e", "#28c840"]
      .map((c, i) => `<circle cx="${18 + i * 16}" cy="16" r="5" fill="${c}"/>`)
      .join("");
    header = `
  <path d="M0.5 28.5 H${WIDTH - 0.5}" stroke="${p.border}"/>
  ${dots}
  <text x="${WIDTH / 2}" y="20" text-anchor="middle" class="muted">${escape(stats.login)}@github: ~</text>
  <text x="${PAD - 5}" y="54" class="prompt"><tspan fill="${p.value}">❯</tspan> <tspan fill="${p.title}">${escape(command)}</tspan></text>`;
    top = 82;
  } else {
    header = `\n  <text x="${PAD}" y="38" class="title">${escape(title)}</text>`;
    top = 70;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escape(title)}">
  <title>${escape(title)}</title>
  <style>${style}
  </style>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="${theme.terminal ? 8 : 6}" fill="${p.bg}" stroke="${p.border}"/>${header}
${body(top)}
</svg>
`;
}

const label = (theme: Theme, text: string) =>
  theme.terminal ? text.toLowerCase() : `${text}:`;

export function renderStats(ctx: Ctx) {
  const { theme, stats } = ctx;
  const rows: [string, number][] = [
    ["Stars Earned", stats.stars],
    ["Commits (last year)", stats.commits],
    ["Pull Requests", stats.prs],
    ["Issues", stats.issues],
    ["Repositories", stats.repos],
    ["Contributed To", stats.contributedTo],
  ];
  const step = theme.terminal ? 18 : 20;

  return frame(ctx, `${stats.name}'s GitHub Stats`, "gh stats", (top) =>
    rows
      .map(([text, value], i) => {
        const y = top + i * step;
        return `  <text x="${PAD}" y="${y}" class="label">${label(theme, text)}</text>\n  <text x="${WIDTH - PAD}" y="${y}" text-anchor="end" class="value">${fmt(value)}</text>`;
      })
      .join("\n"),
  );
}

export function renderLangs(ctx: Ctx) {
  const { theme, p, stats } = ctx;
  const barWidth = WIDTH - PAD * 2;

  return frame(ctx, "Most Used Languages", "gh langs", (top) => {
    const barY = top - 10;
    let x = PAD;
    const segments = stats.languages
      .map((l) => {
        const w = (l.percent / 100) * barWidth;
        const rect = `    <rect x="${x.toFixed(2)}" y="${barY}" width="${w.toFixed(2)}" height="8" fill="${l.color}"/>`;
        x += w;
        return rect;
      })
      .join("\n");

    const rx = theme.terminal ? 0 : 4;
    const bar = `  <clipPath id="bar"><rect x="${PAD}" y="${barY}" width="${barWidth}" height="8" rx="${rx}"/></clipPath>
  <rect x="${PAD}" y="${barY}" width="${barWidth}" height="8" rx="${rx}" fill="${p.track}"/>
  <g clip-path="url(#bar)">\n${segments}\n  </g>`;

    const legend = stats.languages
      .map((l, i) => {
        const cx = PAD + 5 + (i % 2) * 205;
        const cy = barY + 35 + Math.floor(i / 2) * 26;
        const marker = theme.terminal
          ? `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" fill="${l.color}"/>`
          : `<circle cx="${cx}" cy="${cy}" r="5" fill="${l.color}"/>`;
        return `  ${marker}\n  <text x="${cx + 12}" y="${cy + 4}" class="small">${escape(l.name)} <tspan fill="${p.muted}">${l.percent.toFixed(1)}%</tspan></text>`;
      })
      .join("\n");

    return `${bar}\n${legend}`;
  });
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function renderActivity(ctx: Ctx) {
  const { theme, p, stats } = ctx;

  return frame(ctx, "Activity", "gh activity", (top) => {
    const streakY = top + 18;
    const left = `  <text x="${PAD}" y="${streakY}" class="big">${fmt(stats.currentStreak)}</text>
  <text x="${PAD}" y="${streakY + 20}" class="muted">${theme.terminal ? "day streak" : "day current streak"}</text>
  <text x="${PAD}" y="${streakY + 48}" class="small">${label(theme, "Longest")} <tspan class="value">${fmt(stats.longestStreak)}</tspan></text>
  <text x="${PAD}" y="${streakY + 68}" class="small">${label(theme, "Contributions (1y)")} <tspan class="value">${fmt(stats.contributions)}</tspan></text>`;

    // weekday bars, most active day highlighted
    const max = Math.max(...stats.weekdays, 1);
    const best = stats.weekdays.indexOf(max);
    const baseline = HEIGHT - 32;
    const maxH = baseline - top + 10;
    const barW = 16;
    const gap = 9;
    const startX = WIDTH - PAD - 7 * barW - 6 * gap;

    const bars = stats.weekdays
      .map((count, i) => {
        const h = Math.max((count / max) * maxH, 2);
        const x = startX + i * (barW + gap);
        const fill = i === best ? p.accent : p.track;
        return `  <rect x="${x}" y="${(baseline - h).toFixed(2)}" width="${barW}" height="${h.toFixed(2)}" rx="${theme.terminal ? 0 : 3}" fill="${fill}"><title>${DAYS[i]}: ${count}</title></rect>
  <text x="${x + barW / 2}" y="${baseline + 16}" text-anchor="middle" class="muted"${i === best ? ` fill="${p.accent}"` : ""}>${DAYS[i]!.slice(0, 2)}</text>`;
      })
      .join("\n");

    return `${left}\n${bars}`;
  });
}

export const cards = {
  stats: renderStats,
  langs: renderLangs,
  activity: renderActivity,
};
