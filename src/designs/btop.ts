import { charW, escape, fmt, mix, plural, svg, truncate, type Ctx, type Design, type Palette } from "./shared.ts";

const W = 840;
const M = 12; // outer margin
const GAP = 10;
const SIZE = 12.5;
const CW = charW(SIZE);
const SUP = ["¹", "²", "³", "⁴"];

// btop box: rounded frame with the title cut into the top border
function box(x: number, y: number, w: number, h: number, n: number, title: string, color: string, p: Palette, extra = "") {
  const label = `${SUP[n - 1]}${title}`;
  const tx = x + 16;
  const tw = (label.length + 2) * CW;
  let right = "";
  if (extra) {
    const ew = (extra.length + 2) * CW;
    right = `<rect x="${x + w - 16 - ew}" y="${y - 2}" width="${ew}" height="4" fill="${p.bg}"/>
<text x="${x + w - 16 - CW}" y="${y + 4}" text-anchor="end" class="box-extra">${escape(extra)}</text>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="${color}" stroke-width="1.2"/>
<rect x="${tx}" y="${y - 2}" width="${tw}" height="4" fill="${p.bg}"/>
<text x="${tx + CW}" y="${y + 4}" class="box-title"><tspan fill="${color}">${SUP[n - 1]}</tspan>${escape(title)}</text>
${right}`;
}

// btop's default gradient goes green -> yellow -> red with intensity
function heat(p: Palette, t: number) {
  return t < 0.5 ? mix(p.green, p.yellow, t * 2) : mix(p.yellow, p.red, (t - 0.5) * 2);
}

// Meter made of small blocks like btop's mem/proc bars
function meter(x: number, y: number, cells: number, ratio: number, color: (i: number) => string, p: Palette) {
  const filled = ratio > 0 ? Math.max(1, Math.round(ratio * cells)) : 0;
  const cw = 6;
  let out = "";
  for (let i = 0; i < cells; i++) {
    out += `<rect x="${x + i * (cw + 1.5)}" y="${y - 8}" width="${cw}" height="8" rx="1" fill="${i < filled ? color(i) : p.faint}"/>`;
  }
  return out;
}

function activity({ stats: s, p }: Ctx, x: number, y: number, w: number, h: number) {
  const gx = x + 20;
  const gw = w - 220;
  const rows = 18;
  const rowH = 5.2;
  const baseY = y + h - 26;
  const weeks = s.weekly;
  const max = Math.max(...weeks, 1);

  // two dot columns per week like a braille cell, the left one interpolated
  const cols: number[] = [];
  weeks.forEach((v, i) => {
    const prev = weeks[i - 1] ?? v;
    cols.push((prev + v) / 2, v);
  });
  const step = gw / cols.length;

  let dots = "";
  cols.forEach((v, i) => {
    const n = v > 0 ? Math.max(1, Math.round((v / max) * rows)) : 0;
    const cx = gx + i * step + step / 2;
    for (let r = 0; r < rows; r++) {
      const cy = baseY - r * rowH;
      if (r < n) dots += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="1.6" fill="${heat(p, r / (rows - 1))}"/>`;
      else if (r === 0) dots += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="0.9" fill="${p.faint}"/>`;
    }
  });

  const axis = `<text x="${gx}" y="${baseY + 18}" class="faint">52 weeks ago</text>
<text x="${gx + gw}" y="${baseY + 18}" text-anchor="end" class="faint">this week</text>`;

  const peak = Math.max(...weeks);
  const sx = x + w - 180;
  const side = `<text x="${sx}" y="${y + 40}" class="big">${fmt(s.contributionsYear)}</text>
<text x="${sx}" y="${y + 58}" class="dim">contributions</text>
<text x="${sx}" y="${y + 73}" class="faint">in the last 365 days</text>
<text x="${sx}" y="${y + 100}" class="dim">peak <tspan class="val">${fmt(peak)}</tspan>/week</text>
<text x="${sx}" y="${y + 116}" class="dim">avg  <tspan class="val">${(s.contributionsYear / 52).toFixed(1)}</tspan>/week</text>`;

  return box(x, y, w, h, 1, "activity", p.blue, p, `${weeks.length}w`) + dots + axis + side;
}

function statsBox({ stats: s, p }: Ctx, x: number, y: number, w: number, h: number) {
  const lx = x + 16;
  const rx = x + w - 16;
  const rows: [string, string, number | null, string][] = [
    ["stars", fmt(s.stars), null, ""],
    ["commits", fmt(s.commits), null, ""],
    [`in ${new Date().getUTCFullYear()}`, fmt(s.commitsYear), s.commits ? s.commitsYear / s.commits : 0, p.blue],
    ["streak", plural(s.currentStreak, "day"), s.longestStreak ? s.currentStreak / s.longestStreak : 0, p.orange],
    ["longest", plural(s.longestStreak, "day"), null, ""],
    ["repos", fmt(s.repos), null, ""],
    ["pull requests", fmt(s.prs), null, ""],
    ["contributed to", fmt(s.contributedTo), null, ""],
  ];
  let out = box(x, y, w, h, 2, "stats", p.green, p);
  rows.forEach(([label, value, ratio, color], i) => {
    const ty = y + 28 + i * 19.5;
    out += `<text x="${lx}" y="${ty}" class="dim">${label}</text>`;
    if (ratio !== null) out += meter(lx + 15 * CW, ty, 8, ratio, () => color, p);
    out += `<text x="${rx}" y="${ty}" text-anchor="end" class="val">${value}</text>`;
  });
  return out;
}

function langsBox({ stats: s, p }: Ctx, x: number, y: number, w: number, h: number) {
  const lx = x + 16;
  const rx = x + w - 16;
  const max = Math.max(...s.languages.map((l) => l.percent));
  let out = box(x, y, w, h, 3, "languages", p.magenta, p, `${s.languages.length} of ${s.repos} repos`);
  out += `<text x="${lx}" y="${y + 28}" class="head">Language</text><text x="${rx}" y="${y + 28}" text-anchor="end" class="head">Share</text>`;
  s.languages.forEach((l, i) => {
    const ty = y + 48 + i * 17.5;
    out += `<text x="${lx}" y="${ty}" class="val" font-weight="400">${escape(truncate(l.name, 12))}</text>`;
    out += meter(lx + 13 * CW, ty, 14, l.percent / max, () => l.color, p);
    out += `<text x="${rx}" y="${ty}" text-anchor="end" class="dim">${l.percent.toFixed(1)}%</text>`;
  });
  return out;
}

function weekBox({ stats: s, p }: Ctx, x: number, y: number, w: number, h: number) {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const max = Math.max(...s.weekdays, 1);
  const best = s.weekdays.indexOf(max);
  const cells = 10;
  const colW = (w - 32) / 7;
  const baseY = y + h - 44;
  let out = box(x, y, w, h, 4, "weekdays", p.yellow, p);
  s.weekdays.forEach((v, i) => {
    const cx = x + 16 + i * colW + colW / 2;
    const n = v > 0 ? Math.max(1, Math.round((v / max) * cells)) : 0;
    for (let r = 0; r < cells; r++) {
      const fill = r < n ? heat(p, r / (cells - 1)) : p.faint;
      out += `<rect x="${(cx - 6).toFixed(2)}" y="${(baseY - 8 - r * 11).toFixed(2)}" width="12" height="8" rx="1.5" fill="${fill}"/>`;
    }
    out += `<text x="${cx.toFixed(2)}" y="${baseY + 14}" text-anchor="middle" class="${i === best ? "val" : "dim"}">${days[i]}</text>`;
  });
  out += `<text x="${x + w / 2}" y="${baseY + 28}" text-anchor="middle" class="faint">busiest: ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][best]}</text>`;
  return out;
}

export const btop: Design = {
  name: "btop",
  description: "btop system monitor: weekly activity graph, stats, languages and weekdays as boxes",
  render(ctx) {
    const { stats: s, p } = ctx;
    const inner = W - M * 2;
    const topH = 160;
    const botY = M + topH + GAP + 4;
    const botH = 196;
    const statsW = 270;
    const weekW = 190;
    const langsW = inner - statsW - weekW - GAP * 2;
    const height = botY + botH + M;

    return svg({
      width: W,
      height,
      title: `${s.name}'s GitHub stats`,
      style: `
text { font-size: ${SIZE}px; fill: ${p.fg}; }
.box-title { font-weight: 700; fill: ${p.fg}; }
.box-extra { fill: ${p.dim}; font-size: 11px; }
.dim { fill: ${p.dim}; }
.faint { fill: ${p.dim}; opacity: 0.7; font-size: 11px; }
.val { fill: ${p.fg}; font-weight: 700; }
.head { fill: ${p.dim}; font-weight: 700; font-size: 11.5px; }
.big { font-size: 30px; font-weight: 700; fill: ${p.fg}; }`,
      body: `<rect x="0" y="0" width="${W}" height="${height}" rx="10" fill="${p.bg}"/>
${activity(ctx, M, M + 4, inner, topH)}
${statsBox(ctx, M, botY, statsW, botH)}
${langsBox(ctx, M + statsW + GAP, botY, langsW, botH)}
${weekBox(ctx, M + statsW + GAP + langsW + GAP, botY, weekW, botH)}`,
    });
  },
};
