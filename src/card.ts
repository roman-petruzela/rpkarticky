import { icons } from "./fonts.ts";
import { btopBox, charW, dotGraph, escape, fmt, level, mix, plural, svg, truncate, type Ctx } from "./svg.ts";

const W = 840;
const GAP = 12; // niri "gaps"
const RADIUS = 6;
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

  out += `<text x="${W / 2}" y="${y + 20}" text-anchor="middle" class="title">${escape(s.login)}<tspan class="cursor" fill="${p.blue}">▍</tspan></text>`;

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

// btop's dotted weekly graph; the header shows the last 7 days as a row of tiles
function activityWindow(ctx: Ctx, x: number, y: number, w: number) {
  const { stats: s, p } = ctx;
  const h = 172;
  const gx = x + 20;
  const sideW = 160;
  const gw = w - 40 - sideW - 20;
  const baseY = y + h - 34;

  let out = btopBox(x, y, w, h, 1, "activity", p.blue, p, `${s.weekly.length}w`, p.bg);

  const week = s.last7;
  const total = week.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(...week.map((d) => d.count), 1);
  const empty = mix(p.bg, p.fg, 0.07);
  const shades = [empty, mix(empty, p.green, 0.4), mix(empty, p.green, 0.62), mix(empty, p.green, 0.82), p.green];
  const sq = 15;
  const sqGap = 4;
  const rowY = y + 16;
  week.forEach((d, i) => {
    out += `<rect class="pop" style="animation-delay:${900 + i * 70}ms" x="${gx + i * (sq + sqGap)}" y="${rowY}" width="${sq}" height="${sq}" rx="4" fill="${shades[level(d.count, max)]}"><title>${DAYS[d.weekday]} ${d.date}: ${d.count}</title></rect>`;
  });
  const textX = gx + 7 * (sq + sqGap) + 8;
  out += `<text x="${textX}" y="${rowY + 12}" class="title">${plural(total, "contribution")} <tspan class="dim" font-weight="400">in the last week</tspan></text>`;

  out += dotGraph({ x: gx, baseY, w: gw, values: s.weekly, p });
  out += `<text x="${gx}" y="${baseY + 20}" class="faint">52 weeks ago</text>`;
  out += `<text x="${gx + gw}" y="${baseY + 20}" text-anchor="end" class="faint">this week</text>`;

  // btop-style summary on the right
  const sx = x + w - 20 - sideW;
  const peak = Math.max(...s.weekly);
  out += `<text x="${sx}" y="${y + 62}" class="big">${fmt(s.contributionsYear)}</text>`;
  out += `<text x="${sx}" y="${y + 80}" class="dim">contributions</text>`;
  out += `<text x="${sx}" y="${y + 95}" class="faint">in the last 365 days</text>`;
  out += `<text x="${sx}" y="${y + 122}" class="dim">peak <tspan class="val">${fmt(peak)}</tspan>/week</text>`;
  out += `<text x="${sx}" y="${y + 138}" class="dim">avg  <tspan class="val">${(s.contributionsYear / 52).toFixed(1)}</tspan>/week</text>`;

  return { svg: out, bottom: y + h };
}

function statsWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const { stats: s, p } = ctx;
  const items = [
    { icon: icons.star, color: p.yellow, value: s.stars, label: "stars earned" },
    { icon: icons.commit, color: p.orange, value: s.commits, label: "commits total" },
    { icon: icons.repo, color: p.blue, value: s.repos, label: "repositories" },
    { icon: icons.pr, color: p.magenta, value: s.prs, label: "pull requests" },
    { icon: icons.forked, color: p.cyan, value: s.contributedTo, label: "contributed to" },
    { icon: icons.code, color: p.green, value: s.languageCount, label: "languages used" },
  ];
  const colW = (w - 40) / 2;
  const rowH = (h - 32) / 3;
  let out = btopBox(x, y, w, h, 2, "stats", p.green, p, "", p.bg);
  items.forEach((it, i) => {
    const ix = x + 20 + (i % 2) * colW;
    const iy = y + 26 + Math.floor(i / 2) * rowH;
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

  let out = btopBox(x, y, w, h, 3, "languages", p.magenta, p, `top ${s.languages.length} of ${s.languageCount}`, p.bg);
  let offset = 0;
  for (const l of s.languages) {
    const len = (l.percent / 100) * circ;
    const timing = `animation-delay:${Math.round(200 + (offset / circ) * 800)}ms;animation-duration:${Math.max(Math.round((len / circ) * 800), 40)}ms`;
    out += `<circle class="draw" style="${timing}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${l.color}" stroke-width="${sw}" stroke-dasharray="${Math.max(len - gapLen, 0.5).toFixed(2)} ${(circ - len + gapLen).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${escape(l.name)} ${l.percent.toFixed(1)}%</title></circle>`;
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

// niri desktop: waybar with weekdays as workspaces, tiled btop-style boxes below
export function renderCard(ctx: Ctx) {
  const { stats: s, p } = ctx;
  const top = bar(ctx, GAP);
  const activity = activityWindow(ctx, GAP, top.bottom + GAP + 2, W - GAP * 2);
  const rowY = activity.bottom + GAP + 2;
  const rowH = 184;
  const half = (W - GAP * 3) / 2;
  const height = rowY + rowH + GAP;

  return svg({
    width: W,
    height,
    title: `${s.name}'s GitHub stats`,
    style: `
svg { fill: ${p.fg}; }
text { font-size: 12px; }
.icon { font-size: 15px; }
.ws { font-size: 11px; font-weight: 700; }
.mod { font-size: 12px; }
.title { font-size: 13px; font-weight: 700; fill: ${p.fg}; }
.value { font-size: 15px; font-weight: 700; fill: ${p.fg}; }
.small { font-size: 11.5px; }
.dim { fill: ${p.dim}; }
.faint { font-size: 10.5px; fill: ${p.dim}; }
.big { font-size: 30px; font-weight: 700; fill: ${p.fg}; }
.val { font-weight: 700; fill: ${p.fg}; }
/* one load sequence: graph rises left to right, donut draws, last week tiles pop in */
.rise { transform-box: fill-box; transform-origin: 50% 100%; animation: rise 450ms cubic-bezier(.2,.7,.3,1) both; }
@keyframes rise { from { transform: scaleY(0); } }
.draw { animation-name: draw; animation-timing-function: linear; animation-fill-mode: both; }
@keyframes draw { from { stroke-dasharray: 0 400; } }
.pop { transform-box: fill-box; transform-origin: center; animation: pop 350ms cubic-bezier(.3,1.5,.5,1) both; }
@keyframes pop { from { transform: scale(.3); opacity: 0; } }
.cursor { animation: blink 1.1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .rise, .draw, .pop, .cursor { animation: none; } }`,
    body: `<rect width="${W}" height="${height}" fill="${p.surface}"/>
${top.svg}
${activity.svg}
${statsWindow(ctx, GAP, rowY, half, rowH)}
${langsWindow(ctx, GAP * 2 + half, rowY, half, rowH)}`,
  });
}
