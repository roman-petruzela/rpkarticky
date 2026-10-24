import { charW, escape, fmt, pad, plural, svg, truncate, type Design } from "./shared.ts";

const W = 840;
const PAD = 30;
const SIZE = 13;
const LH = 20;
const CW = charW(SIZE);

// Pac-Man facing right, mouth open or closed (pacman.conf ILoveCandy)
function pacmanShape(cx: number, cy: number, r: number, open: boolean, fill: string) {
  if (!open) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  const a = Math.PI / 5;
  const x1 = cx + r * Math.cos(a);
  const y1 = cy - r * Math.sin(a);
  const y2 = cy + r * Math.sin(a);
  return `<path d="M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 1 0 ${x1.toFixed(2)} ${y2.toFixed(2)} Z" fill="${fill}"/>`;
}

export const pacman: Design = {
  name: "pacman",
  description: "pacman -Qi package info, languages installed with ILoveCandy progress bars",
  render({ stats: s, p, mode }) {
    const cols = Math.floor((W - PAD * 2) / CW);
    const KEY = 16;
    const field = (key: string, value: string) =>
      `<tspan fill="${p.fg}" font-weight="700">${pad(key, KEY)}</tspan><tspan fill="${p.dim}">: </tspan><tspan fill="${p.fg}">${escape(truncate(value, cols - KEY - 2))}</tspan>`;

    const info: [string, string][] = [
      ["Name", s.login],
      ["Version", `${fmt(s.commits)} commits`],
      ["Description", s.bio ?? s.name],
      ["URL", `https://github.com/${s.login}`],
      ["Depends On", s.languages.map((l) => l.name.toLowerCase().replace(/\s+/g, "-")).join("  ")],
      ["Required By", plural(s.stars, "stargazer")],
      ["Provides", plural(s.repos, "repository").replace("repositorys", "repositories")],
      ["Pull Requests", fmt(s.prs)],
      ["Contributed To", plural(s.contributedTo, "repo")],
      ["Streak", `${plural(s.currentStreak, "day")} (longest ${plural(s.longestStreak, "day")})`],
      ["Install Date", `${s.joined}`],
    ];

    let y = PAD + 12;
    const out: string[] = [];
    const prompt = (cmd: string) =>
      out.push(`<text x="${PAD}" y="${y}"><tspan fill="${p.green}" font-weight="700">❯</tspan> <tspan fill="${p.blue}">${escape(cmd)}</tspan></text>`);

    prompt(`pacman -Qi ${s.login}`);
    for (const [k, v] of info) out.push(`<text x="${PAD}" y="${(y += LH)}">${field(k, v)}</text>`);

    y += LH * 2;
    prompt("sudo pacman -S languages");
    out.push(`<text x="${PAD}" y="${(y += LH)}"><tspan fill="${p.blue}" font-weight="700">::</tspan><tspan fill="${p.fg}" font-weight="700"> Processing package changes...</tspan></text>`);

    // (i/n) installing <lang>   [-----C o o o]  24.6%
    const n = s.languages.length;
    const nameCols = Math.max(...s.languages.map((l) => l.name.length)) + 1;
    const prefix = `(${n}/${n}) installing `.length;
    const barCols = cols - prefix - nameCols - 9;
    const max = Math.max(...s.languages.map((l) => l.percent));

    s.languages.forEach((l, i) => {
      y += LH;
      const cells = barCols - 2;
      const eaten = Math.max(1, Math.round((l.percent / max) * cells));
      const barX = PAD + (prefix + nameCols) * CW;

      const dash = "-".repeat(eaten - 1);
      let dots = "";
      for (let c = eaten; c < cells; c++) dots += (c - eaten) % 2 === 1 ? "o" : " ";

      out.push(`<text x="${PAD}" y="${y}" fill="${p.fg}">${escape(pad(`(${i + 1}/${n})`, `(${n}/${n})`.length))}<tspan fill="${p.dim}"> installing </tspan>${escape(pad(l.name.toLowerCase(), nameCols))}</text>`);
      out.push(`<text x="${barX.toFixed(2)}" y="${y}"><tspan fill="${p.dim}">[</tspan><tspan fill="${l.color}">${dash}</tspan><tspan fill="${p.faint}"> ${dots}</tspan><tspan fill="${p.dim}">]</tspan></text>`);
      const pacX = barX + eaten * CW + CW / 2;
      out.push(pacmanShape(pacX, y - SIZE * 0.33, SIZE * 0.42, i % 2 === 0, mode === "dark" ? p.yellow : "#e8a900"));
      out.push(`<text x="${(W - PAD).toFixed(2)}" y="${y}" text-anchor="end" fill="${p.fg}">${l.percent.toFixed(1).padStart(5)}%</text>`);
    });

    const height = y + PAD;

    return svg({
      width: W,
      height,
      title: `${s.name}'s GitHub stats`,
      style: `text { font-size: ${SIZE}px; }`,
      body: `<rect width="${W}" height="${height}" fill="${p.bg}"/><rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" fill="none" stroke="${p.line}"/>
${out.join("\n")}`,
    });
  },
};
