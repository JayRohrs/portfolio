#!/usr/bin/env node
// Turns an export of the YouTube library into a short list of CANDIDATES for the site.
// Nothing is published by this script: it only writes content/library-candidates.json.
// To show a video, copy its {url, title} entry into "library" in content/site.json.
//
// Usage: node scripts/import-library.mjs export.json
// export.json: an array of { "id" or "url", "title", "privacy": "public"|"unlisted"|"private", "published": "YYYY-MM-DD" }
// See docs/LIBRARY_IMPORT.md.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input) { console.error("Usage: node scripts/import-library.mjs export.json"); process.exit(1); }
const rows = JSON.parse(readFileSync(input, "utf8"));
const site = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
const idOf = (u) => (String(u).match(/(?:youtu\.be\/|\/shorts\/|[?&]v=)([A-Za-z0-9_-]{11})/) || [])[1];
const have = new Set(JSON.stringify(site).match(/(?:youtu\.be\/|\/shorts\/)[A-Za-z0-9_-]{11}/g)?.map((x) => x.slice(-11)));
const out = [];
let skipped = { notPublic: 0, duplicate: 0, noId: 0 };
for (const r of rows) {
  const id = r.id && /^[A-Za-z0-9_-]{11}$/.test(r.id) ? r.id : idOf(r.url);
  if (!id) { skipped.noId++; continue; }
  if ((r.privacy || "").toLowerCase() !== "public") { skipped.notPublic++; continue; }
  if (have.has(id)) { skipped.duplicate++; continue; }
  out.push({ url: `https://youtu.be/${id}`, title: String(r.title || "").trim(), published: String(r.published || "").slice(0, 4) });
}
writeFileSync(join(root, "content/library-candidates.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} candidates written to content/library-candidates.json (skipped: ${JSON.stringify(skipped)}).`);
console.log("Review them, copy the ones you want into \"library\" in content/site.json, run node scripts/fetch-thumbs.mjs, then node build.mjs.");
