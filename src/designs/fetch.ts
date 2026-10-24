import { charW, escape, fmt, mix, plural, svg, truncate, type Design } from "./shared.ts";

// neofetch's Arch logo
const ARCH = [
  "                  -`",
  "                 .o+`",
  "                `ooo/",
  "               `+oooo:",
  "              `+oooooo:",
  "              -+oooooo+:",
  "            `/:-:++oooo+:",
  "           `/++++/+++++++:",
  "          `/++++++++++++++:",
  "         `/+++ooooooooooooo/`",
  "        ./ooosssso++osssssso+`",
  "       .oossssso-````/ossssss+`",
  "      -osssssso.      :ssssssso.",
  "     :osssssss/        osssso+++.",
  "    /ossssssss/        +ssssooo/-",
  "  `/ossssso+/:-        -:/+osssso+-",
  " `+sso+:-`                 `.-/+oso:",
  "`++:.                           `-/+/",
  ".`                                 `/",
];

const W = 840;
const PAD = 30;
const LOGO_SIZE = 12.5;
const LOGO_LH = 16;
const SIZE = 13.5;
const LH = 21;

export const fetch: Design = {
  name: "fetch",
  description: "fastfetch output with the Arch logo, languages as the color blocks",
  render({ stats: s, p }) {
    const logoW = Math.max(...ARCH.map((l) => l.length)) * charW(LOGO_SIZE);
    const infoX = PAD + logoW + 40;
    const infoChars = Math.floor((W - infoX - PAD) / charW(SIZE));

    const logo = ARCH.map(
      (line, i) =>
        `<text x="${PAD}" y="${PAD + 14 + i * LOGO_LH}" class="logo" fill="${mix(p.blue, p.cyan, i / (ARCH.length - 1))}">${escape(line)}</text>`,
    ).join("\n");

    const header = `${s.login}@github`;
    const rows: [string, string][] = [
      ["Name", s.name],
      ["Bio", s.bio ?? "-"],
      ["Joined", String(s.joined)],
      ["Stars", fmt(s.stars)],
      ["Commits", `${fmt(s.commits)} (${fmt(s.commitsYear)} this year)`],
      ["Streak", plural(s.currentStreak, "day")],
      ["Longest Streak", plural(s.longestStreak, "day")],
      ["Repositories", fmt(s.repos)],
      ["Pull Requests", fmt(s.prs)],
      ["Contributed To", plural(s.contributedTo, "repo")],
    ];

    const top = PAD + 14;
    let y = top;
    const lines = [
      `<text x="${infoX}" y="${y}" class="key">${escape(s.login)}<tspan fill="${p.fg}">@</tspan>github</text>`,
      `<text x="${infoX}" y="${(y += LH)}" fill="${p.dim}">${"-".repeat(header.length)}</text>`,
      ...rows.map(([key, value]) => {
        const v = truncate(value, infoChars - key.length - 2);
        return `<text x="${infoX}" y="${(y += LH)}" class="key">${key}<tspan fill="${p.fg}" font-weight="400">: ${escape(v)}</tspan></text>`;
      }),
    ].join("\n");

    // neofetch's two rows of color blocks, here one block per language
    const PER_ROW = 4;
    const ROW_H = 44;
    const blocksY = y + 24;
    const blockW = (W - infoX - PAD) / PER_ROW;
    const blocks = s.languages
      .map((l, i) => {
        const x = infoX + (i % PER_ROW) * blockW;
        const by = blocksY + Math.floor(i / PER_ROW) * ROW_H;
        const label = truncate(l.name, Math.floor(blockW / charW(11.5)) - 6);
        return `<rect x="${x.toFixed(2)}" y="${by}" width="${(blockW + 0.5).toFixed(2)}" height="16" fill="${l.color}"/>
<text x="${x.toFixed(2)}" y="${by + 31}" class="small" fill="${p.fg}">${escape(label)} <tspan fill="${p.dim}">${l.percent.toFixed(1)}%</tspan></text>`;
      })
      .join("\n");

    const rowsUsed = Math.ceil(s.languages.length / PER_ROW);
    const blocksBottom = blocksY + (rowsUsed - 1) * ROW_H + 31;
    const logoBottom = PAD + 14 + (ARCH.length - 1) * LOGO_LH;
    const height = Math.max(blocksBottom, logoBottom) + PAD;

    return svg({
      width: W,
      height,
      title: `${s.name}'s GitHub stats`,
      style: `
.logo { font-size: ${LOGO_SIZE}px; font-weight: 700; }
.key { font-size: ${SIZE}px; font-weight: 700; fill: ${p.blue}; }
text { font-size: ${SIZE}px; }
.small { font-size: 11.5px; }`,
      body: `<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="10" fill="${p.bg}" stroke="${p.line}"/>
${logo}
${lines}
${blocks}`,
    });
  },
};
