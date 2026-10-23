import { fetchStats } from "./fetch.ts";
import { computeStats } from "./stats.ts";

const login = process.argv[2] ?? "roman-petruzela";
const data = await fetchStats(login, process.env.GITHUB_TOKEN!);
console.log(computeStats(data.user, login));
