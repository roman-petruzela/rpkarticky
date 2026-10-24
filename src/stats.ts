export type RawUser = {
  name: string | null;
  repositories: {
    totalCount: number;
    nodes: {
      stargazerCount: number;
      languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
    }[];
  };
  contributionsCollection: {
    totalCommitContributions: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }[];
    };
  };
  pullRequests: { totalCount: number };
  issues: { totalCount: number };
  repositoriesContributedTo: { totalCount: number };
};

export type Language = { name: string; color: string; percent: number };

export type Stats = {
  login: string;
  name: string;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  repos: number;
  contributedTo: number;
  contributions: number;
  currentStreak: number;
  longestStreak: number;
  // contributions per weekday over the last year, Monday first
  weekdays: number[];
  languages: Language[];
};

function streaks(counts: number[]) {
  let longest = 0;
  let run = 0;
  for (const c of counts) {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // today still counts as part of the streak even if nothing was pushed yet
  let i = counts.length - 1;
  if (counts[i] === 0) i--;
  let current = 0;
  while (i >= 0 && counts[i]! > 0) {
    current++;
    i--;
  }

  return { current, longest };
}

export function computeStats(user: RawUser, login: string, topLangs = 6): Stats {
  const repos = user.repositories.nodes;

  const sizes = new Map<string, { size: number; color: string }>();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const prev = sizes.get(node.name);
      sizes.set(node.name, { size: (prev?.size ?? 0) + size, color: node.color ?? "#888" });
    }
  }

  const sorted = [...sizes].sort((a, b) => b[1].size - a[1].size).slice(0, topLangs);
  const total = sorted.reduce((sum, [, l]) => sum + l.size, 0);

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const { current, longest } = streaks(days.map((d) => d.contributionCount));

  // GitHub weekday: 0 = Sunday, shift so Monday is first
  const weekdays = Array<number>(7).fill(0);
  for (const d of days) weekdays[(d.weekday + 6) % 7]! += d.contributionCount;

  return {
    login,
    name: user.name ?? login,
    stars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    commits: user.contributionsCollection.totalCommitContributions,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repos: user.repositories.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    contributions: calendar.totalContributions,
    currentStreak: current,
    longestStreak: longest,
    weekdays,
    languages: sorted.map(([name, l]) => ({ name, color: l.color, percent: (l.size / total) * 100 })),
  };
}
