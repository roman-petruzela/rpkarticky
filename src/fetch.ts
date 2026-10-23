import { graphql } from "@octokit/graphql";
import type { RawUser } from "./stats.ts";

export async function fetchStats(login: string, token: string) {
  const gql = graphql.defaults({ headers: { authorization: `token ${token}` } });
  return gql<{ user: RawUser }>(`
    query($login: String!) {
      user(login: $login) {
        name
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
          nodes {
            stargazerCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name color } }
            }
          }
        }
        contributionsCollection { totalCommitContributions }
        pullRequests { totalCount }
        issues { totalCount }
        repositoriesContributedTo(first: 1) { totalCount }
      }
    }`, { login });
}
