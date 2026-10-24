import { graphql } from "@octokit/graphql";

export type Day = { date: string; count: number; weekday: number };

export type RawUser = {
  name: string | null;
  bio: string | null;
  createdAt: string;
  repositories: {
    totalCount: number;
    nodes: {
      stargazerCount: number;
      languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
    }[];
  };
  pullRequests: { totalCount: number };
  issues: { totalCount: number };
  repositoriesContributedTo: { totalCount: number };
  // filled from per-year contribution queries
  years: { year: number; commits: number; days: Day[] }[];
};

type Gql = ReturnType<typeof graphql.defaults>;

const client = (token: string) =>
  graphql.defaults({ headers: { authorization: `token ${token}` } });

export async function fetchViewerLogin(token: string) {
  const { viewer } = await client(token)<{ viewer: { login: string } }>(`{ viewer { login } }`);
  return viewer.login;
}

type ProfilePage = {
  user: Omit<RawUser, "repositories" | "years"> & {
    repositories: RawUser["repositories"] & {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
    contributionsCollection: { contributionYears: number[] };
  };
};

async function fetchProfile(gql: Gql, login: string) {
  let cursor: string | null = null;
  let user: ProfilePage["user"] | undefined;

  // GraphQL returns max 100 repos per page
  do {
    const page: ProfilePage = await gql<ProfilePage>(`
      query($login: String!, $cursor: String) {
        user(login: $login) {
          name
          bio
          createdAt
          repositories(ownerAffiliations: OWNER, isFork: false, first: 100, after: $cursor) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              stargazerCount
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges { size node { name color } }
              }
            }
          }
          contributionsCollection { contributionYears }
          pullRequests { totalCount }
          issues { totalCount }
          repositoriesContributedTo(first: 1) { totalCount }
        }
      }`, { login, cursor });

    if (user) user.repositories.nodes.push(...page.user.repositories.nodes);
    else user = page.user;

    const { hasNextPage, endCursor } = page.user.repositories.pageInfo;
    cursor = hasNextPage ? endCursor : null;
  } while (cursor);

  return user;
}

type YearCollection = {
  totalCommitContributions: number;
  contributionCalendar: {
    weeks: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }[];
  };
};

// A contributions collection can span at most one year, so ask for each year
// separately (aliased in a single request) to get all-time commits and streaks.
async function fetchYears(gql: Gql, login: string, years: number[]) {
  const now = new Date().toISOString();
  const fields = years
    .map((y) => {
      const to = y === new Date().getUTCFullYear() ? now : `${y}-12-31T23:59:59Z`;
      return `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${to}") {
        totalCommitContributions
        contributionCalendar { weeks { contributionDays { date contributionCount weekday } } }
      }`;
    })
    .join("\n");

  const { user } = await gql<{ user: Record<string, YearCollection> }>(
    `query($login: String!) { user(login: $login) { ${fields} } }`,
    { login },
  );

  return years.map((year) => {
    const c = user[`y${year}`]!;
    return {
      year,
      commits: c.totalCommitContributions,
      days: c.contributionCalendar.weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday })),
      ),
    };
  });
}

export async function fetchStats(login: string, token: string): Promise<RawUser> {
  const gql = client(token);
  const { contributionsCollection, ...profile } = await fetchProfile(gql, login);
  const years = await fetchYears(gql, login, contributionsCollection.contributionYears);
  return { ...profile, years };
}
