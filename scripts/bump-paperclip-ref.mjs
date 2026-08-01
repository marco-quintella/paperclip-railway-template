import fs from "node:fs";
import { readCurrentRef, replaceRef } from "./paperclip-ref.mjs";

const owner = "paperclipai";
const repo = "paperclip";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(2);
}

async function gh(path) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "paperclip-railway-template-bot",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const latest = await gh(`/repos/${owner}/${repo}/releases/latest`);
const latestTag = latest.tag_name;
if (!latestTag) throw new Error("No tag_name in latest release response");

const dockerPath = "Dockerfile";
const docker = fs.readFileSync(dockerPath, "utf8");
const currentRef = readCurrentRef(docker);
if (!currentRef) throw new Error("Could not parse current PAPERCLIP_REF");

console.log(`current=${currentRef} latest=${latestTag}`);

if (currentRef === latestTag) {
  console.log("No update needed.");
  process.exit(0);
}

fs.writeFileSync(dockerPath, replaceRef(docker, latestTag));
console.log(`Updated ${dockerPath} to ${latestTag}`);
