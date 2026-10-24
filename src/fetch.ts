import { graphql } from "@octokit/graphql";
import type { RawUser } from "./stats.ts";

type Page = {
  user: Omit<RawUser, "repositories"> & {
    repositories: RawUser["repositories"] & {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
};

const client = (token: string) =>
  graphql.defaults({ headers: { authorization: `token ${token}` } });

export async function fetchViewerLogin(token: string) {
  const { viewer } = await client(token)<{ viewer: { login: string } }>(`{ viewer { login } }`);
  return viewer.login;
}

export async function fetchStats(login: string, token: string): Promise<RawUser> {
  const gql = client(token);
  let cursor: string | null = null;
  let user: RawUser | undefined;

  // GraphQL returns max 100 repos per page
  do {
    const page: Page = await gql<Page>(`
      query($login: String!, $cursor: String) {
        user(login: $login) {
          name
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
          contributionsCollection {
            totalCommitContributions
            contributionCalendar {
              totalContributions
              weeks { contributionDays { date contributionCount weekday } }
            }
          }
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
