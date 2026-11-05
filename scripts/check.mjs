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
import { validateSite } from "./validate-update.mjs";

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
for (const problem of validateSite(site)) bad(`content/site.json: ${problem}`);

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
      const plain = u.startsWith(`mailto:${site.person.email}?subject=Project%20request`) && !/%40/.test(u.slice(u.indexOf("?")));
      if (!allowed.has(u) && !plain && !(SITE_URL && u.startsWith(SITE_URL))) bad(`${rel}: external link not in site.json: ${u}`);
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
  ok(!/confidential|internal use|\bTODO\b/i.test(html), `${rel}: internal-note marker on a live page`);
  ok(!/(?<![A-Za-z0-9.-])(?:https?:\/\/)?(?!www\.)[A-Za-z0-9-]+\.jbase\.app/i.test(html), `${rel}: non-public subdomain named on a live page`);
  ok(!/tel:|google-analytics|gtag|googletagmanager|fbq\(|plausible|matomo|hotjar/i.test(html), `${rel}: forbidden tracking/phone link`);
  const emails = (html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).filter((e) => !/^name@example\.com$/.test(e));
  ok(emails.every((e) => e === site.person.email), `${rel}: unapproved email address ${emails.filter((e) => e !== site.person.email)}`);
  ok(!/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/.test(html), `${rel}: looks like a phone number`);
  ok(!/<script(?![^>]*(?:src=|type="application\/ld\+json"))[^>]*>/.test(html), `${rel}: inline script`);

  // canonical only when SITE_URL is set
  const hasCanon = /rel="canonical"/.test(html);
  const noindex = /<meta name="robots" content="noindex">/.test(html);
  if (rel === "404.html" || noindex) ok(!hasCanon, `${rel}: 404 and noindex pages must not have a canonical`);
  else ok(hasCanon === Boolean(SITE_URL), `${rel}: canonical ${hasCanon ? "present" : "missing"} but SITE_URL is ${SITE_URL ? "set" : "empty"}`);
  if (rel === "index.html") {
    const ld = (html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/) || [])[1];
    ok(ld, `${rel}: missing JSON-LD`);
    if (ld) { try { JSON.parse(ld); checks++; } catch { bad(`${rel}: JSON-LD is not valid JSON`); } }
  }

  // structured data: valid JSON, and only facts that are in content/site.json
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => m[1]);
  for (const text of lds) {
    let data;
    try { data = JSON.parse(text.replace(/\\u003c/g, "<")); checks++; } catch { bad(`${rel}: JSON-LD is not valid JSON`); continue; }
    const keys = new Set();
    const strings = [];
    (function walkLd(n) {
      if (Array.isArray(n)) n.forEach(walkLd);
      else if (n && typeof n === "object") for (const [k, v] of Object.entries(n)) { keys.add(k); walkLd(v); }
      else if (typeof n === "string") strings.push(n);
    })(data);
    ok(!["telephone", "priceRange", "price", "openingHours", "openingHoursSpecification", "streetAddress", "aggregateRating", "review", "award"].some((k) => keys.has(k)), `${rel}: JSON-LD states a fact that is not in content/site.json (${[...keys].join(",")})`);
    ok(strings.every((v) => !/^https?:\/\//.test(v) || v === "https://schema.org" || allowed.has(v) || (SITE_URL && v.startsWith(SITE_URL))), `${rel}: JSON-LD link not in site.json`);
    ok(strings.every((v) => !/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(v) || v === site.person.email), `${rel}: JSON-LD has an unapproved email`);
  }
  const wantsService = site.client.services.find((x) => x.path === rel);
  if (wantsService) {
    const flat = lds.join("");
    ok(flat.includes('"@type":"Service"') && flat.includes(`"serviceType":${JSON.stringify(wantsService.track)}`), `${rel}: service page needs Service structured data`);
    ok(wantsService.types.every((t) => flat.includes(JSON.stringify(t.name))), `${rel}: structured data must list the same service types as the page`);
    ok(/<h2[^>]*>What a small first step can look like<\/h2>/.test(html) || wantsService.id === "ai", `${rel}: service page needs its first-step examples`);
  }

  // the site cannot know whether an email was sent, so no page may say so
  ok(!/(?<!nothing )(?<!not )(?:has|have|was|were) been sent\b|\b(?:message|request|email) sent\b|successfully sent|thank you for (?:your )?(?:request|message)|we(?:'ve| have)? received your/i.test(html), `${rel}: page claims a request was sent or received`);

  // request pages: one per track, same form, track pre-selected, link to the "what next" page
  const req = site.client.requests.find((q) => q.path === rel);
  if (req) {
    ok(/<form id="start-form"[^>]*data-to="/.test(html), `${rel}: request form missing`);
    ok(new RegExp(`name="track" value="${req.value}" checked`).test(html), `${rel}: ${req.value} track not pre-selected`);
    ok((html.match(/\schecked[\s>]/g) || []).length === 1, `${rel}: exactly one track must be pre-selected`);
    ok(html.includes('class="steps"'), `${rel}: how-it-works section missing`);
    ok(req.examples.every((e) => html.includes(`<h3>${e.name.replace(/&/g, "&amp;")}</h3>`)), `${rel}: first-step examples missing`);
    ok(html.includes(`href="${site.client.start.next.path}"`), `${rel}: link to the what-next page missing`);
    ok(/<a href="mailto:[^"]*\?subject=Project%20request[^"]*">open an email with the questions already listed/.test(html), `${rel}: no-JavaScript mailto fallback missing`);
    ok(/Open my email program/.test(html) && /Copy request text/.test(html), `${rel}: mailto and copy fallbacks missing`);
  }
  if (rel === "start.html") {
    ok(site.client.requests.every((q) => html.includes(`href="${q.path}"`)), `${rel}: chooser must link every request page`);
    ok((html.match(/\schecked[\s>]/g) || []).length === 0, `${rel}: no track should be pre-selected on the chooser`);
  }
  if (rel === site.client.start.next.path) {
    ok(noindex, `${rel}: confirmation page must be noindex`);
    ok(html.includes("cannot tell") || html.includes("cannot see"), `${rel}: confirmation page must say it cannot know`);
    ok(!/<form/.test(html), `${rel}: confirmation page must not contain a form`);
  }
}

// site-level files
ok(existsSync(join(root, "robots.txt")), "robots.txt missing");
ok(existsSync(join(root, "404.html")), "404.html missing");
ok(existsSync(join(root, "assets/favicon.svg")), "favicon missing");
ok(htmlFiles.every((f) => /rel="icon" href="[^"]*assets\/favicon\.svg"/.test(readFileSync(f, "utf8"))), "a page does not link the favicon");
ok(existsSync(join(root, "sitemap.xml")) === Boolean(SITE_URL), `sitemap.xml ${SITE_URL ? "missing" : "present"} but SITE_URL is ${SITE_URL ? "set" : "empty"}`);
if (SITE_URL) ok(/Sitemap:/.test(readFileSync(join(root, "robots.txt"), "utf8")), "robots.txt lacks Sitemap line");
if (SITE_URL && existsSync(join(root, "sitemap.xml"))) {
  const locs = [...readFileSync(join(root, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = htmlFiles.map((f) => f.slice(root.length + 1)).filter((rel) => rel !== "404.html" && !/content="noindex"/.test(readFileSync(join(root, rel), "utf8")));
  ok(expected.every((rel) => locs.includes(`${SITE_URL}/${rel === "index.html" ? "" : rel}`)), "sitemap.xml is missing an indexable page");
  ok(locs.length === expected.length, "sitemap.xml lists a page that should not be indexed");
  ok(locs.every((u) => u.startsWith(SITE_URL + "/")), "sitemap.xml has a URL outside the public address");
}

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
