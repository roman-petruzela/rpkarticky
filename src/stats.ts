export type RawUser = {
  name: string | null;
  repositories: {
    nodes: {
      stargazerCount: number;
      languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
    }[];
  };
  contributionsCollection: { totalCommitContributions: number };
  pullRequests: { totalCount: number };
  issues: { totalCount: number };
  repositoriesContributedTo: { totalCount: number };
};

export type Language = { name: string; color: string; percent: number };

export type Stats = {
  name: string;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  contributedTo: number;
  languages: Language[];
};

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

  return {
    name: user.name ?? login,
    stars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    commits: user.contributionsCollection.totalCommitContributions,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    languages: sorted.map(([name, l]) => ({ name, color: l.color, percent: (l.size / total) * 100 })),
  };
}
