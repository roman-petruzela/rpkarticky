import { fetchStats } from "./fetch.ts";

const login = process.argv[2] ?? "roman-petruzela";
const data = await fetchStats(login, process.env.GITHUB_TOKEN!);
console.log(JSON.stringify(data, null, 2));
