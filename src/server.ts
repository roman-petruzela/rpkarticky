import { renderCard } from "./card.ts";
import { fetchViewerLogin } from "./fetch.ts";
import { loadStats } from "./generate.ts";
import type { Stats } from "./stats.ts";
import { escape, palettes, type Mode } from "./svg.ts";

// Vercel function: GET /api/card?theme=dark|light
// Serves the card of one user only (GITHUB_USERNAME, or the owner of GITHUB_TOKEN),
// so nobody else can burn through the token's rate limit.

const CACHE_SECONDS = Number(process.env.CACHE_SECONDS ?? 1800);

// Warm instances reuse the stats, so the dark and light request cost one API round
let cache: { stats: Stats; at: number } | undefined;

async function getStats(token: string) {
  if (cache && Date.now() - cache.at < CACHE_SECONDS * 1000) return cache.stats;
  const login = process.env.GITHUB_USERNAME || (await fetchViewerLogin(token));
  const stats = await loadStats(login, token);
  cache = { stats, at: Date.now() };
  return stats;
}

function errorCard(message: string, status: number) {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="60" viewBox="0 0 840 60">
<rect width="840" height="60" fill="#1a1b26"/>
<text x="20" y="35" fill="#f7768e" font-family="monospace" font-size="14">rpkarticky: ${escape(message)}</text>
</svg>`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // retry soon instead of pinning the error in GitHub's image cache
      "cache-control": "public, max-age=60, s-maxage=60",
    },
  });
}

export async function GET(request: Request) {
  const mode: Mode = new URL(request.url).searchParams.get("theme") === "light" ? "light" : "dark";

  const token = process.env.GITHUB_TOKEN;
  if (!token) return errorCard("GITHUB_TOKEN is not set in the Vercel project", 500);

  try {
    const stats = await getStats(token);
    return new Response(renderCard({ stats, p: palettes[mode], mode }), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (e) {
    console.error(e);
    return errorCard("couldn't load stats from GitHub, see the function logs", 502);
  }
}
