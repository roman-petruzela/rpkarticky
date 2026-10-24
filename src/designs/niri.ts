import { icons } from "../fonts.ts";
import { charW, escape, fmt, level, mix, svg, truncate, type Ctx, type Design } from "./shared.ts";

const W = 840;
const GAP = 12; // niri "gaps"
const RADIUS = 10;
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// niri's focus ring sits outside the window with a small offset
function window(x: number, y: number, w: number, h: number, ctx: Ctx, focused = false) {
  const { p } = ctx;
  const ring = focused
    ? `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="${RADIUS + 3}" fill="none" stroke="${p.blue}" stroke-width="2.5"/>`
    : `<rect x="${x - 0.5}" y="${y - 0.5}" width="${w + 1}" height="${h + 1}" rx="${RADIUS}" fill="none" stroke="${p.line}"/>`;
  return `${ring}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS}" fill="${p.bg}"/>`;
}

// waybar: weekdays as workspaces, busiest one active, streak modules on the right
function bar(ctx: Ctx, y: number) {
  const { stats: s, p } = ctx;
  const h = 30;
  const max = Math.max(...s.weekdays, 1);
  const best = s.weekdays.indexOf(max);
  let out = `<rect x="${GAP}" y="${y}" width="${W - GAP * 2}" height="${h}" rx="${RADIUS}" fill="${p.bg}"/>`;
  out += `<text x="${GAP + 14}" y="${y + 20}" class="icon" fill="${p.cyan}">${icons.arch}</text>`;

  DAYS.forEach((d, i) => {
    const x = GAP + 40 + i * 34;
    const active = i === best;
    const t = s.weekdays[i]! / max;
    const fill = active ? p.blue : mix(p.surface, p.blue, t * 0.45);
    out += `<rect x="${x}" y="${y + 6}" width="28" height="18" rx="9" fill="${fill}"><title>${d}: ${s.weekdays[i]} contributions</title></rect>`;
    out += `<text x="${x + 14}" y="${y + 19}" text-anchor="middle" class="ws" fill="${active ? p.bg : p.fg}">${d}</text>`;
  });

  out += `<text x="${W / 2}" y="${y + 20}" text-anchor="middle" class="title">${escape(s.login)}</text>`;

  const modules = [
    { icon: icons.flame, text: `${s.currentStreak}d streak`, color: p.orange },
    { icon: icons.trophy, text: `${s.longestStreak}d longest`, color: p.yellow },
    { icon: icons.calendar, text: `since ${s.joined}`, color: p.magenta },
  ];
  let x = W - GAP - 14;
  for (const m of modules.reverse()) {
    const tw = (m.text.length + 2) * charW(12);
    x -= tw;
    out += `<text x="${x}" y="${y + 20}" class="mod"><tspan fill="${m.color}">${m.icon}</tspan><tspan fill="${p.fg}"> ${m.text}</tspan></text>`;
    x -= 18;
  }
  return { svg: out, bottom: y + h };
}

function heatmapWindow(ctx: Ctx, x: number, y: number, w: number) {
  const { stats: s, p } = ctx;
  const cell = 11;
  const step = 14;
  const gridW = s.heatmap.length * step - (step - cell);
  const gx = x + w - 20 - gridW;
  const gy = y + 52;
  const h = 52 + 7 * step + 14;

  const max = Math.max(...s.heatmap.flat().map((v) => v ?? 0), 1);
  const empty = mix(p.bg, p.fg, 0.07);
  const shades = [empty, mix(empty, p.green, 0.4), mix(empty, p.green, 0.62), mix(empty, p.green, 0.82), p.green];

  let out = window(x, y, w, h, ctx, true);
  out += `<text x="${x + 20}" y="${y + 26}" class="title">${fmt(s.contributionsYear)} contributions <tspan class="dim" font-weight="400">in the last year</tspan></text>`;

  // month labels at the first column whose Monday falls into a new month
  const today = new Date();
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  let lastMonth = -1;
  s.heatmap.forEach((week, c) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() - (s.heatmap.length - 1 - c) * 7);
    if (d.getUTCMonth() !== lastMonth && c < s.heatmap.length - 2) {
      if (lastMonth !== -1 || d.getUTCDate() <= 7) {
        out += `<text x="${gx + c * step}" y="${gy - 8}" class="faint">${MONTHS[d.getUTCMonth()]}</text>`;
      }
      lastMonth = d.getUTCMonth();
    }
    week.forEach((v, r) => {
      if (v === null) return;
      out += `<rect x="${gx + c * step}" y="${gy + r * step}" width="${cell}" height="${cell}" rx="2.5" fill="${shades[level(v, max)]}"><title>${v}</title></rect>`;
    });
  });
  [0, 2, 4].forEach((r) => {
    out += `<text x="${x + 20}" y="${gy + r * step + 9}" class="faint">${DAYS[r]}</text>`;
  });

  return { svg: out, bottom: y + h };
}

function statsWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const { stats: s, p } = ctx;
  const items = [
    { icon: icons.star, color: p.yellow, value: s.stars, label: "stars earned" },
    { icon: icons.commit, color: p.orange, value: s.commits, label: "commits total" },
    { icon: icons.flame, color: p.red, value: s.currentStreak, label: "day streak" },
    { icon: icons.trophy, color: p.yellow, value: s.longestStreak, label: "longest streak" },
    { icon: icons.repo, color: p.blue, value: s.repos, label: "repositories" },
    { icon: icons.pr, color: p.magenta, value: s.prs, label: "pull requests" },
    { icon: icons.forked, color: p.cyan, value: s.contributedTo, label: "contributed to" },
    { icon: icons.code, color: p.green, value: s.languages.length, label: "languages" },
  ];
  const colW = (w - 40) / 2;
  const rowH = (h - 32) / 4;
  let out = window(x, y, w, h, ctx);
  items.forEach((it, i) => {
    const ix = x + 20 + (i % 2) * colW;
    const iy = y + 22 + Math.floor(i / 2) * rowH;
    out += `<rect x="${ix}" y="${iy}" width="30" height="30" rx="8" fill="${mix(p.bg, it.color, 0.16)}"/>`;
    out += `<text x="${ix + 15}" y="${iy + 20}" text-anchor="middle" class="icon" fill="${it.color}">${it.icon}</text>`;
    out += `<text x="${ix + 42}" y="${iy + 14}" class="value">${fmt(it.value)}</text>`;
    out += `<text x="${ix + 42}" y="${iy + 28}" class="dim small">${it.label}</text>`;
  });
  return out;
}

function langsWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const { stats: s, p } = ctx;
  const r = 52;
  const sw = 16;
  const cx = x + 24 + r + sw / 2;
  const cy = y + h / 2;
  const circ = 2 * Math.PI * r;
  const gapLen = 2.5;

  let out = window(x, y, w, h, ctx);
  let offset = 0;
  for (const l of s.languages) {
    const len = (l.percent / 100) * circ;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${l.color}" stroke-width="${sw}" stroke-dasharray="${Math.max(len - gapLen, 0.5).toFixed(2)} ${(circ - len + gapLen).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${escape(l.name)} ${l.percent.toFixed(1)}%</title></circle>`;
    offset += len;
  }
  const top = s.languages[0];
  if (top) {
    out += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" class="value">${escape(truncate(top.name, 10))}</text>`;
    out += `<text x="${cx}" y="${cy + 15}" text-anchor="middle" class="dim small">${top.percent.toFixed(1)}%</text>`;
  }

  const lx = cx + r + sw / 2 + 28;
  const rx = x + w - 20;
  const rowH = (h - 36) / s.languages.length;
  s.languages.forEach((l, i) => {
    const ly = y + 24 + i * rowH + rowH / 2;
    out += `<rect x="${lx}" y="${ly - 9}" width="10" height="10" rx="3" fill="${l.color}"/>`;
    out += `<text x="${lx + 18}" y="${ly}" class="small" fill="${p.fg}">${escape(truncate(l.name, 14))}</text>`;
    out += `<text x="${rx}" y="${ly}" text-anchor="end" class="dim small">${l.percent.toFixed(1)}%</text>`;
  });
  return out;
}

export const niri: Design = {
  name: "niri",
  description: "niri desktop: waybar with weekdays as workspaces, tiled windows with heatmap, stats and a language donut",
  render(ctx) {
    const { stats: s, p } = ctx;
    const top = bar(ctx, GAP);
    const heat = heatmapWindow(ctx, GAP, top.bottom + GAP + 2, W - GAP * 2);
    const rowY = heat.bottom + GAP + 2;
    const rowH = 184;
    const half = (W - GAP * 3) / 2;
    const height = rowY + rowH + GAP;

    return svg({
      width: W,
      height,
      title: `${s.name}'s GitHub stats`,
      style: `
text { font-size: 12px; fill: ${p.fg}; }
.icon { font-size: 15px; }
.ws { font-size: 11px; font-weight: 700; }
.mod { font-size: 12px; }
.title { font-size: 13px; font-weight: 700; fill: ${p.fg}; }
.value { font-size: 15px; font-weight: 700; fill: ${p.fg}; }
.small { font-size: 11.5px; }
.dim { fill: ${p.dim}; }
.faint { font-size: 10.5px; fill: ${p.dim}; }`,
      body: `<rect x="0" y="0" width="${W}" height="${height}" rx="14" fill="${p.surface}"/>
${top.svg}
${heat.svg}
${statsWindow(ctx, GAP, rowY, half, rowH)}
${langsWindow(ctx, GAP * 2 + half, rowY, half, rowH)}`,
    });
  },
};
