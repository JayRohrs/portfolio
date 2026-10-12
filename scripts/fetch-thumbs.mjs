#!/usr/bin/env node
// Downloads each video's YouTube thumbnail into assets/thumbs/ so the site never
// contacts YouTube until a visitor clicks play. Run once, then `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
const urls = [...site.featured.flatMap((p) => (p.videos || []).map((v) => v.url)), ...site.additional_proof.map((p) => p.url)];
const ids = [...new Set(urls.map((u) => (u.match(/(?:youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/) || [])[1]).filter(Boolean))];
mkdirSync(join(root, "assets/thumbs"), { recursive: true });
for (const id of ids) {
  const res = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  if (!res.ok) { console.warn(`skip ${id}: HTTP ${res.status}`); continue; }
  writeFileSync(join(root, "assets/thumbs", `${id}.jpg`), Buffer.from(await res.arrayBuffer()));
  console.log(`saved ${id}`);
}
