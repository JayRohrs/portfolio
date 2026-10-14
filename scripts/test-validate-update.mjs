#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
];
for (const [name, change, expected] of cases) {
  const site = structuredClone(baseline);
  change(site);
  assert(validateSite(site).some((problem) => problem.includes(expected)), `${name} should be rejected`);
}
console.log(`Update validator: current content passed, ${cases.length} invalid cases rejected.`);
