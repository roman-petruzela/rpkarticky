import { execFileSync } from "node:child_process";
import * as core from "@actions/core";
import { generate } from "./generate.ts";

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" });

// Commits only when an SVG actually changed
function commit(paths: string[], message: string) {
  git("add", ...paths);
  try {
    git("diff", "--cached", "--quiet");
    core.info("Cards unchanged, nothing to commit");
    return;
  } catch {
    // non-zero exit = staged changes exist
  }
  git("-c", "user.name=github-actions[bot]",
      "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
      "commit", "-m", message);
  git("push");
}

// GitHub disables scheduled workflows after 60 days without repo activity.
// Re-enabling the workflow through the API resets that timer without any commit.
async function keepalive(token: string) {
  const repo = process.env.GITHUB_REPOSITORY;
  // e.g. owner/repo/.github/workflows/stats.yml@refs/heads/main
  const file = process.env.GITHUB_WORKFLOW_REF?.split("@")[0]?.split("/").pop();
  if (!repo || !file) throw new Error("not running inside a workflow");

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${file}/enable`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

try {
  const token = core.getInput("token", { required: true });
  const login = core.getInput("username", { required: true });
  const outDir = core.getInput("output-dir") || ".";
  const theme = core.getInput("theme") || "tokyonight";

  const paths = await generate(login, token, outDir, theme);
  core.info(`Generated ${paths.join(", ")}`);

  if (core.getBooleanInput("commit")) {
    commit(paths, core.getInput("commit-message"));
  }

  if (core.getBooleanInput("keepalive")) {
    try {
      await keepalive(core.getInput("keepalive-token"));
      core.info("Keepalive: workflow re-enabled");
    } catch (e) {
      core.warning(`Keepalive skipped (needs 'permissions: actions: write'): ${e}`);
    }
  }
} catch (e) {
  core.setFailed(e instanceof Error ? e.message : String(e));
}
