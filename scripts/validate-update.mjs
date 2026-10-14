#!/usr/bin/env node
// Validate proposed public content before building or opening a pull request.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowedHosts = new Set([
  "www.jbase.app", "www.linkedin.com", "www.youtube.com", "youtube.com",
  "youtu.be", "www.nbcnewyork.com",
]);
const videoPath = /^(?:https:\/\/youtu\.be\/[A-Za-z0-9_-]{11}|https:\/\/(?:www\.)?youtube\.com\/(?:shorts\/[A-Za-z0-9_-]{11}|watch\?v=[A-Za-z0-9_-]{11}))$/;
const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const phonePattern = /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

export function validateSite(site) {
  const problems = [];
  const bad = (path, message) => problems.push(`${path}: ${message}`);
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const required = (value, path, type) => {
    if (type === "array" ? !Array.isArray(value) : type === "object" ? !object(value) : typeof value !== type || (type === "string" && !value.trim())) {
      bad(path, `required ${type} is missing or empty`);
      return false;
    }
    return true;
  };
  const pdf = (name, path) => {
    if (typeof name !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/i.test(name)) {
      bad(path, "must be a PDF filename in downloads/ without a directory path");
    } else if (!existsSync(join(root, "downloads", name))) {
      bad(path, `downloads/${name} does not exist`);
    }
  };
  const videos = (items, path) => {
    if (!required(items, path, "array")) return;
    items.forEach((video, i) => {
      const at = `${path}[${i}]`;
      if (!required(video, at, "object")) return;
      required(video.title, `${at}.title`, "string");
      if (!required(video.url, `${at}.url`, "string")) return;
      if (!videoPath.test(video.url)) bad(`${at}.url`, "must be a direct YouTube video or Shorts URL with one 11-character ID");
      if (video.privacy !== undefined && video.privacy !== "public") bad(`${at}.privacy`, "only public videos are allowed");
    });
  };

  if (!required(site, "site", "object")) return problems;
  for (const key of ["person", "client", "about"]) required(site[key], key, "object");
  for (const key of ["featured", "additional_proof", "resumes", "library", "credibility_strip", "capabilities", "work_filters"]) required(site[key], key, "array");
  if (site.person && object(site.person)) {
    for (const key of ["name", "headline", "statement", "location", "email", "linkedin", "youtube"]) required(site.person[key], `person.${key}`, "string");
    if (site.person.email !== "jayrohrs@gmail.com") bad("person.email", "must remain the approved public address");
    if (site.person.phone) bad("person.phone", "phone numbers are not permitted on this site");
  }
  if (site.site_url !== "" && site.site_url !== "https://www.jbase.app") bad("site_url", "must be empty or https://www.jbase.app");
  if (site.client && object(site.client)) {
    for (const key of ["home", "start"]) required(site.client[key], `client.${key}`, "object");
    required(site.client.services, "client.services", "array");
    if (Array.isArray(site.client.services)) {
      const ids = new Set(site.client.services.map((service) => service?.id));
      for (const id of ["it", "av", "ai"]) if (!ids.has(id)) bad("client.services", `missing ${id} service`);
      site.client.services.forEach((service, i) => {
        if (!required(service, `client.services[${i}]`, "object")) return;
        for (const key of ["id", "title", "track", "tagline"]) required(service[key], `client.services[${i}].${key}`, "string");
        required(service.types, `client.services[${i}].types`, "array");
        if (Array.isArray(service.proof)) service.proof.forEach((proof, j) => {
          if (proof?.file !== undefined) pdf(proof.file, `client.services[${i}].proof[${j}].file`);
        });
      });
    }
  }
  if (Array.isArray(site.featured)) site.featured.forEach((project, i) => {
    const at = `featured[${i}]`;
    if (!required(project, at, "object")) return;
    for (const key of ["id", "title", "type", "role", "why"]) required(project[key], `${at}.${key}`, "string");
    videos(project.videos, `${at}.videos`);
  });
  if (Array.isArray(site.library)) videos(site.library, "library");
  if (Array.isArray(site.resumes)) site.resumes.forEach((resume, i) => {
    const at = `resumes[${i}]`;
    if (!required(resume, at, "object")) return;
    required(resume.label, `${at}.label`, "string");
    pdf(resume.file, `${at}.file`);
  });

  function walk(value, path) {
    if (typeof value === "string") {
      if (/\[NEEDS JAY/i.test(value)) bad(path, "move unanswered questions to docs/NEEDS_JAY.md; do not put placeholders in site.json");
      if (phonePattern.test(value)) bad(path, "contains a phone number");
      for (const email of value.match(emailPattern) || []) {
        if (email !== "jayrohrs@gmail.com") bad(path, "contains an extra email address");
      }
      for (const match of value.matchAll(/https?:\/\/[^\s<>"'()\]]+/g)) {
        const text = match[0].replace(/[.,;!?]+$/, "");
        try {
          const url = new URL(text);
          if (url.protocol !== "https:" || url.username || url.password || url.port || !allowedHosts.has(url.hostname)) {
            bad(path, `URL host or scheme is not allowed: ${url.hostname}`);
          }
        } catch { bad(path, "contains an invalid URL"); }
      }
    } else if (Array.isArray(value)) value.forEach((item, i) => walk(item, `${path}[${i}]`));
    else if (object(value)) for (const [key, item] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key;
      if (["url", "linkedin", "youtube"].includes(key) && (typeof item !== "string" || !item.startsWith("https://"))) {
        bad(at, "links must use https:// and an approved host");
      }
      walk(item, at);
    }
  }
  walk(site, "");
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] || join(root, "content/site.json"));
  let site;
  try { site = JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { console.error(`FAIL ${file}: ${error.message}`); process.exit(1); }
  const problems = validateSite(site);
  if (problems.length) {
    for (const problem of problems) console.error(`FAIL ${problem}`);
    console.error(`Update rejected: ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log("Update content passed: required fields, approved link hosts, video URL format, contact details and PDF paths. Confirm video visibility separately.");
}
