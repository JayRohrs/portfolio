#!/usr/bin/env node
// Checks the built site: internal links resolve, external links all come from content/site.json,
// no tracking/phone/forbidden content. Exits non-zero on problems.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "content/site.json"), "utf8");
const site = JSON.parse(raw);
const allowed = new Set((raw.match(/https?:\/\/[^\s"')]+/g) || []));
allowed.add(`mailto:${site.person.email}`);
const norm = (u) => u.replace(/&amp;/g, "&");

const htmlFiles = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    if (["node_modules", ".git", "docs"].includes(f)) continue;
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && htmlFiles.push(p);
  }
})(root);

let problems = 0;
const bad = (m) => { problems++; console.error("PROBLEM:", m); };
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(root.length + 1);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const u = norm(m[1]);
    if (/^(https?:|mailto:)/.test(u)) { if (!allowed.has(u)) bad(`${rel}: external link not in site.json: ${u}`); continue; }
    const [path, frag] = u.split("#");
    const target = path ? resolve(dirname(file), path) : file;
    if (!existsSync(target)) bad(`${rel}: broken internal link ${u}`);
    else if (frag && target.endsWith(".html") && !readFileSync(target, "utf8").includes(`id="${frag}"`)) bad(`${rel}: missing anchor ${u}`);
  }
  if (/tel:|google-analytics|gtag|googletagmanager|fbq\(|plausible|matomo/i.test(html)) bad(`${rel}: forbidden tracking/phone content`);
  if (/<img(?![^>]*\balt=)/.test(html)) bad(`${rel}: img without alt`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) bad(`${rel}: expected exactly one h1`);
}
console.log(`Checked ${htmlFiles.length} pages; ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
