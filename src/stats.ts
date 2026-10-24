import type { Day, RawUser } from "./fetch.ts";

export type Language = { name: string; color: string; percent: number };

export type Stats = {
  login: string;
  name: string;
  bio: string | null;
  joined: number;
  stars: number;
  commits: number; // all time
  commitsYear: number; // current calendar year
  prs: number;
  issues: number;
  repos: number;
  contributedTo: number;
  contributionsYear: number; // last 365 days
  currentStreak: number;
  longestStreak: number;
  // last 365 days, Monday first
  weekdays: number[];
  // last 53 weeks, oldest first; each week Monday..Sunday, null = outside range
  heatmap: (number | null)[][];
  // weekly totals of the heatmap columns
  weekly: number[];
  languages: Language[];
};

function streaks(days: Day[]) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // today still counts as part of the streak even if nothing was pushed yet
  let i = days.length - 1;
  if (days[i]?.count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i]!.count > 0) {
    current++;
    i--;
  }

  return { current, longest };
}

function languages(user: RawUser, top: number) {
  const sizes = new Map<string, { size: number; color: string }>();
  for (const repo of user.repositories.nodes) {
    for (const { size, node } of repo.languages.edges) {
      const prev = sizes.get(node.name);
      sizes.set(node.name, { size: (prev?.size ?? 0) + size, color: node.color ?? "#8b8b8b" });
    }
  }

  const sorted = [...sizes].sort((a, b) => b[1].size - a[1].size).slice(0, top);
  const total = sorted.reduce((sum, [, l]) => sum + l.size, 0);
  return sorted.map(([name, l]) => ({ name, color: l.color, percent: (l.size / total) * 100 }));
}

export function computeStats(user: RawUser, login: string, topLangs = 8): Stats {
  const today = new Date().toISOString().slice(0, 10);

  // years overlap at their edges in the calendar, keep each date once
  const byDate = new Map<string, Day>();
  for (const y of user.years) for (const d of y.days) if (d.date <= today) byDate.set(d.date, d);
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const { current, longest } = streaks(days);
  const lastYear = days.slice(-365);

  // GitHub weekday: 0 = Sunday, shift so Monday is 0
  const mondayIndex = (d: Day) => (d.weekday + 6) % 7;

  const weekdays = Array<number>(7).fill(0);
  for (const d of lastYear) weekdays[mondayIndex(d)]! += d.count;

  // 53 columns ending with the current week
  const recent = days.slice(-(52 * 7 + 7));
  const heatmap: (number | null)[][] = [];
  let week: (number | null)[] = Array(7).fill(null);
  for (const d of recent) {
    const i = mondayIndex(d);
    if (i === 0 && week.some((v) => v !== null)) {
      heatmap.push(week);
      week = Array(7).fill(null);
    }
    week[i] = d.count;
  }
  heatmap.push(week);
  const grid = heatmap.slice(-53);

  const thisYear = new Date().getUTCFullYear();

  return {
    login,
    name: user.name ?? login,
    bio: user.bio,
    joined: new Date(user.createdAt).getUTCFullYear(),
    stars: user.repositories.nodes.reduce((sum, r) => sum + r.stargazerCount, 0),
    commits: user.years.reduce((sum, y) => sum + y.commits, 0),
    commitsYear: user.years.find((y) => y.year === thisYear)?.commits ?? 0,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repos: user.repositories.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    contributionsYear: lastYear.reduce((sum, d) => sum + d.count, 0),
    currentStreak: current,
    longestStreak: longest,
    weekdays,
    heatmap: grid,
    weekly: grid.map((w) => w.reduce<number>((sum, v) => sum + (v ?? 0), 0)),
    languages: languages(user, topLangs),
  };
}
