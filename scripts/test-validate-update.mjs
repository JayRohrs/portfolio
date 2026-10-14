#!/usr/bin/env node
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSite } from "./validate-update.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
assert.deepEqual(validateSite(baseline), [], "current public content must pass");

const cases = [
  ["placeholder", (s) => { s.person.service_area = "[NEEDS JAY: wording]"; }, "placeholder"],
  ["extra email", (s) => { s.contact_cta = "write to other@example.com"; }, "extra email"],
  ["phone", (s) => { s.person.phone = "303-555-0100"; }, "phone"],
  ["unapproved host", (s) => { s.person.linkedin = "https://example.org/profile"; }, "URL host"],
  ["unsafe link scheme", (s) => { s.person.linkedin = "javascript:alert(1)"; }, "links must use https"],
  ["unlisted video", (s) => { s.featured[0].videos[0].privacy = "unlisted"; }, "only public"],
  ["unsupported video URL", (s) => { s.featured[0].videos[0].url = "https://www.youtube.com/embed/W0aLdycp7ug"; }, "direct YouTube"],
  ["missing service", (s) => { s.client.services = s.client.services.filter((x) => x.id !== "it"); }, "missing it"],
  ["missing PDF", (s) => { s.resumes[0].file = "absent.pdf"; }, "does not exist"],
  ["service path escape", (s) => { s.client.services[0].path = "../outside.html"; }, "matching services/"],
  ["project path escape", (s) => { s.featured[0].id = "../outside"; }, "safe lowercase"],
  ["reserved filename", (s) => { s.featured[0].id = "con"; }, "safe lowercase"],
  ["duplicate project", (s) => { s.featured[1].id = s.featured[0].id; }, "duplicate project"],
  ["duplicate service", (s) => { s.client.services.push(structuredClone(s.client.services[0])); }, "exactly one"],
  ["missing workflow", (s) => { delete s.client.how_it_works; }, "client.how_it_works"],
  ["missing proof", (s) => { delete s.client.services[0].proof; }, "client.services[0].proof"],
  ["broken proof reference", (s) => { s.client.services[1].proof[0].project = "not-published"; }, "visible project"],
  ["missing tag list", (s) => { delete s.featured[0].tags; }, "featured[0].tags"],
  ["bad form options", (s) => { s.client.start.budgets = null; }, "client.start.budgets"],
  ["unsupported intake track", (s) => { s.client.start.tracks[0].value = "other"; }, "supported track"],
  ["missing home text", (s) => { delete s.client.home.hero_line; }, "client.home.hero_line"],
  ["missing resume edition", (s) => { s.resumes.pop(); }, "both public resume"],
];
for (const [name, change, expected] of cases) {
  const site = structuredClone(baseline);
  change(site);
  assert(validateSite(site).some((problem) => problem.includes(expected)), `${name} should be rejected`);
}

// A rejected update must not touch existing output or a path outside the site.
const fixture = mkdtempSync(join(tmpdir(), "portfolio-build-gate-"));
try {
  const fixtureRoot = join(fixture, "site");
  for (const folder of ["content", "scripts", "downloads", "services"]) mkdirSync(join(fixtureRoot, folder), { recursive: true });
  copyFileSync(join(root, "build.mjs"), join(fixtureRoot, "build.mjs"));
  copyFileSync(join(root, "scripts/validate-update.mjs"), join(fixtureRoot, "scripts/validate-update.mjs"));
  for (const resume of baseline.resumes) copyFileSync(join(root, "downloads", resume.file), join(fixtureRoot, "downloads", resume.file));
  const invalid = structuredClone(baseline);
  invalid.client.services[0].path = "../outside.html";
  writeFileSync(join(fixtureRoot, "content/site.json"), JSON.stringify(invalid));
  const sentinels = [join(fixture, "outside.html"), join(fixtureRoot, "index.html"), join(fixtureRoot, "services/it.html")];
  for (const file of sentinels) writeFileSync(file, "unchanged");
  const build = spawnSync(process.execPath, [join(fixtureRoot, "build.mjs")], { encoding: "utf8" });
  assert.equal(build.status, 1, "invalid content must stop the build");
  assert.match(build.stderr, /matching services\/.*before writing files/s);
  for (const file of sentinels) assert.equal(readFileSync(file, "utf8"), "unchanged", `${file} must remain untouched`);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
console.log(`Update validator: current content passed, ${cases.length} invalid cases rejected; build stopped before writing.`);
