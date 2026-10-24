import { execSync } from "node:child_process";
import { fetchViewerLogin } from "./fetch.ts";
import { generate } from "./generate.ts";

// Local preview: npm run dev [-- <login>], writes SVGs into preview/
const token = process.env.RPK_TOKEN ?? execSync("gh auth token").toString().trim();
const login = process.argv[2] ?? (await fetchViewerLogin(token));

for (const path of await generate(login, token, "preview")) console.log(path);
