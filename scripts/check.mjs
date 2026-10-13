#!/usr/bin/env node
// Checks the built site. Exits non-zero on any problem.
//  - every page: unique <title> and description, exactly one h1, no skipped heading levels
//  - internal links, anchors and assets resolve; images have alt text
//  - external links come only from content/site.json
//  - no "[NEEDS JAY", internal-note markers, tracking, phone numbers, or stray email addresses
//  - canonical/sitemap output matches the SITE_URL setting
//  - the Start-a-project form builds a correct mailto string
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "content/site.json"), "utf8");
const site = JSON.parse(raw);
const SITE_URL = (process.env.SITE_URL ?? site.site_url ?? "").trim().replace(/\/+$/, "");
const allowed = new Set(raw.match(/https?:\/\/[^\s"')]+/g) || []);
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
let checks = 0;
const bad = (m) => { problems++; console.error("PROBLEM:", m); };
const ok = (cond, msg) => { checks++; if (!cond) bad(msg); };

const titles = new Map();
const descs = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(root.length + 1);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  // titles / descriptions
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  ok(title && title.trim(), `${rel}: missing <title>`);
  ok(desc && desc.trim(), `${rel}: missing meta description`);
  if (title) { ok(!titles.has(title), `${rel}: duplicate title (also ${titles.get(title)})`); titles.set(title, rel); }
  if (desc) { ok(!descs.has(desc), `${rel}: duplicate description (also ${descs.get(desc)})`); descs.set(desc, rel); }
  if (desc) ok(desc.length <= 300, `${rel}: description over 300 characters`);

  // headings
  ok((html.match(/<h1[\s>]/g) || []).length === 1, `${rel}: expected exactly one h1`);
  let last = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    ok(last === 0 || lvl <= last + 1, `${rel}: heading level jumps from h${last} to h${lvl}`);
    last = lvl;
  }

  // links and assets
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const u = norm(m[1]);
    checks++;
    if (/^(https?:|mailto:)/.test(u)) {
      if (!allowed.has(u) && !(SITE_URL && u.startsWith(SITE_URL))) bad(`${rel}: external link not in site.json: ${u}`);
      continue;
    }
    const [path, frag] = u.split("#");
    const target = path ? resolve(dirname(file), path) : file;
    if (!existsSync(target)) bad(`${rel}: broken internal link ${u}`);
    else if (frag && target.endsWith(".html") && !readFileSync(target, "utf8").includes(`id="${frag}"`)) bad(`${rel}: missing anchor ${u}`);
  }
  // in-page anchors (skip link etc.)
  for (const m of html.matchAll(/href="#([^"]+)"/g)) ok(ids.has(m[1]) || /^(main)$/.test(m[1]), `${rel}: missing in-page anchor #${m[1]}`);

  // images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const alt = (m[0].match(/\balt="([^"]*)"/) || [])[1];
    ok(alt !== undefined, `${rel}: img without alt`);
    if (/headshot/.test(m[0])) ok(alt && alt.length > 3, `${rel}: headshot needs descriptive alt text`);
  }
  ok(!/<img[^>]*headshot/.test(html) || /^(index|about)\.html$/.test(rel), `${rel}: headshot used outside About areas`);

  // labels on form controls
  for (const m of html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    ok(new RegExp(`<label[^>]*for="${m[1]}"`).test(html), `${rel}: control #${m[1]} has no <label for>`);
  }

  // content rules
  ok(!/\[NEEDS JAY/i.test(html), `${rel}: placeholder text [NEEDS JAY ...] on a live page`);
  ok(!/confidential|internal use|\bTODO\b|OCRA|jBase/i.test(html), `${rel}: internal-note marker or private name on a live page`);
  ok(!/tel:|google-analytics|gtag|googletagmanager|fbq\(|plausible|matomo|hotjar/i.test(html), `${rel}: forbidden tracking/phone link`);
  const emails = (html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).filter((e) => !/^name@example\.com$/.test(e));
  ok(emails.every((e) => e === site.person.email), `${rel}: unapproved email address ${emails.filter((e) => e !== site.person.email)}`);
  ok(!/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/.test(html), `${rel}: looks like a phone number`);
  ok(!/<script(?![^>]*(?:src=|type="application\/ld\+json"))[^>]*>/.test(html), `${rel}: inline script`);

  // canonical only when SITE_URL is set
  const hasCanon = /rel="canonical"/.test(html);
  if (rel === "404.html") ok(!hasCanon, `${rel}: 404 must not have a canonical`);
  else ok(hasCanon === Boolean(SITE_URL), `${rel}: canonical ${hasCanon ? "present" : "missing"} but SITE_URL is ${SITE_URL ? "set" : "empty"}`);
  if (rel === "index.html") {
    const ld = (html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/) || [])[1];
    ok(ld, `${rel}: missing JSON-LD`);
    if (ld) { try { JSON.parse(ld); checks++; } catch { bad(`${rel}: JSON-LD is not valid JSON`); } }
  }
}

// site-level files
ok(existsSync(join(root, "robots.txt")), "robots.txt missing");
ok(existsSync(join(root, "404.html")), "404.html missing");
ok(existsSync(join(root, "assets/favicon.svg")), "favicon missing");
ok(htmlFiles.every((f) => /rel="icon" href="[^"]*assets\/favicon\.svg"/.test(readFileSync(f, "utf8"))), "a page does not link the favicon");
ok(existsSync(join(root, "sitemap.xml")) === Boolean(SITE_URL), `sitemap.xml ${SITE_URL ? "missing" : "present"} but SITE_URL is ${SITE_URL ? "set" : "empty"}`);
if (SITE_URL) ok(/Sitemap:/.test(readFileSync(join(root, "robots.txt"), "utf8")), "robots.txt lacks Sitemap line");

// the intake form -> mailto
await import("../assets/intake.js");
const I = globalThis.Intake;
const sample = { name: "Sam Example", organisation: "Example Church", email: "sam@example.org", phone: "", track: "both", need: "Livestream setup & a Microsoft 365 tidy-up.\nSecond line.", timeline: "Within a month", budget: "$1,000 to $5,000", heard_from: "A friend" };
ok(Object.keys(I.validate(sample)).length === 0, "intake: valid sample rejected");
ok(Object.keys(I.validate({})).sort().join() === "email,name,need,track", "intake: required fields not enforced");
ok(I.validate({ ...sample, email: "nope" }).email, "intake: bad email accepted");
const href = I.toMailto(site.person.email, sample);
ok(href.startsWith(`mailto:${site.person.email}?subject=`), "intake: mailto must start with the approved address and subject");
const q = new URLSearchParams(href.slice(href.indexOf("?") + 1));
ok(q.get("subject") === "Project request: Both IT and AV (Sam Example)", "intake: wrong subject");
const body = q.get("body");
ok(body.includes("Name: Sam Example") && body.includes("Kind of help: Both IT and AV") && body.includes("Budget range: $1,000 to $5,000") && body.includes("Livestream setup & a Microsoft 365 tidy-up."), "intake: body missing fields");
ok(body.includes("Phone: (not given)"), "intake: empty phone not marked");
ok(/\r\n/.test(decodeURIComponent(href)) && !href.includes("\n"), "intake: line breaks must be CRLF-encoded");
const json = I.toJSON(sample, new Date("2026-01-01T00:00:00Z"));
ok(json.version === 1 && json.track === "both" && json.created === "2026-01-01T00:00:00.000Z" && Object.keys(json).length === 11, "intake: JSON shape changed");
ok(readFileSync(join(root, "assets/start.js"), "utf8").includes("Intake.toMailto"), "start.js does not use Intake.toMailto");
ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(readFileSync(join(root, "assets/start.js"), "utf8") + readFileSync(join(root, "assets/intake.js"), "utf8")), "form scripts must not contact any server");

console.log(`Checked ${htmlFiles.length} pages, ${checks} checks; ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
