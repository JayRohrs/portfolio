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
  const strings = (items, path) => {
    if (required(items, path, "array")) items.forEach((item, i) => required(item, `${path}[${i}]`, "string"));
  };
  const records = (items, path, keys) => {
    if (!required(items, path, "array")) return;
    items.forEach((item, i) => {
      const at = `${path}[${i}]`;
      if (required(item, at, "object")) for (const key of keys) required(item[key], `${at}.${key}`, "string");
    });
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
  for (const key of ["featured", "resumes", "library"]) required(site[key], key, "array");
  records(site.additional_proof, "additional_proof", ["title", "role", "why", "url"]);
  if (Array.isArray(site.additional_proof)) site.additional_proof.forEach((proof, i) => {
    if (object(proof)) strings(proof.tags, `additional_proof[${i}].tags`);
  });
  records(site.credibility_strip, "credibility_strip", ["figure", "label"]);
  records(site.capabilities, "capabilities", ["name", "evidence"]);
  strings(site.work_filters, "work_filters");
  strings(site.current_practice, "current_practice");
  required(site.contact_cta, "contact_cta", "string");
  if (object(site.about)) {
    strings(site.about.paragraphs, "about.paragraphs");
    records(site.about.timeline, "about.timeline", ["year", "text"]);
  }
  if (site.person && object(site.person)) {
    for (const key of ["name", "headline", "statement", "location", "availability", "email", "linkedin", "youtube"]) required(site.person[key], `person.${key}`, "string");
    if (site.person.email !== "jayrohrs@gmail.com") bad("person.email", "must remain the approved public address");
    if (site.person.phone) bad("person.phone", "phone numbers are not permitted on this site");
  }
  if (site.site_url !== "" && site.site_url !== "https://www.jbase.app") bad("site_url", "must be empty or https://www.jbase.app");
  if (site.client && object(site.client)) {
    for (const key of ["home", "start"]) required(site.client[key], `client.${key}`, "object");
    for (const key of ["pricing", "first_step_title"]) required(site.client[key], `client.${key}`, "string");
    records(site.client.how_it_works, "client.how_it_works", ["step", "text"]);
    if (object(site.client.home)) {
      for (const key of ["hero_line", "intro_heading", "intro", "ai_heading", "ai_text", "proof_heading", "proof_intro", "wall_heading", "wall_intro"]) {
        required(site.client.home[key], `client.home.${key}`, "string");
      }
    }
    if (object(site.client.start)) {
      for (const key of ["title", "description", "intro"]) required(site.client.start[key], `client.start.${key}`, "string");
      records(site.client.start.tracks, "client.start.tracks", ["value", "label"]);
      if (Array.isArray(site.client.start.tracks)) {
        const values = site.client.start.tracks.map((track) => track?.value);
        const expected = ["it", "av", "both", "not-sure"];
        if (values.length !== expected.length || expected.some((value) => !values.includes(value))) {
          bad("client.start.tracks", "must contain each supported track exactly once: it, av, both, not-sure");
        }
      }
      for (const key of ["timelines", "budgets"]) strings(site.client.start[key], `client.start.${key}`);
    }
    required(site.client.services, "client.services", "array");
    if (Array.isArray(site.client.services)) {
      const ids = new Set(site.client.services.map((service) => service?.id));
      for (const id of ["it", "av", "ai"]) if (!ids.has(id)) bad("client.services", `missing ${id} service`);
      if (site.client.services.length !== 3 || ids.size !== 3) bad("client.services", "must contain exactly one it, av and ai service");
      site.client.services.forEach((service, i) => {
        const at = `client.services[${i}]`;
        if (!required(service, at, "object")) return;
        for (const key of ["id", "path", "title", "track", "tagline", "description", "who_for", "first_step"]) required(service[key], `${at}.${key}`, "string");
        if (!["it", "av", "ai"].includes(service.id) || service.path !== `services/${service.id}.html`) {
          bad(`${at}.path`, "must be the matching services/it.html, services/av.html or services/ai.html path");
        }
        records(service.types, `${at}.types`, ["name", "text"]);
        if (service.ideas !== undefined) {
          strings(service.ideas, `${at}.ideas`);
          for (const key of ["ideas_heading", "ideas_intro"]) required(service[key], `${at}.${key}`, "string");
        }
        if (service.other_track && !["it", "av", "ai"].includes(service.other_track)) bad(`${at}.other_track`, "must reference an existing service");
        records(service.proof, `${at}.proof`, ["label"]);
        if (Array.isArray(service.proof)) service.proof.forEach((proof, j) => {
          if (!object(proof)) return;
          const proofAt = `${at}.proof[${j}]`;
          if ((proof.file !== undefined) === (proof.project !== undefined)) {
            bad(proofAt, "must reference exactly one PDF file or visible project");
          }
          if (proof.file !== undefined) pdf(proof.file, `${proofAt}.file`);
          if (proof.project !== undefined && (!Array.isArray(site.featured) || !site.featured.some((project) => object(project) && project.id === proof.project && Array.isArray(project.videos) && project.videos.length))) {
            bad(`${proofAt}.project`, "must reference a visible project with public videos");
          }
        });
      });
    }
  }
  const projectIds = new Set();
  if (Array.isArray(site.featured)) site.featured.forEach((project, i) => {
    const at = `featured[${i}]`;
    if (!required(project, at, "object")) return;
    for (const key of ["id", "title", "type", "role", "why"]) required(project[key], `${at}.${key}`, "string");
    if (typeof project.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id) || /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(project.id)) {
      bad(`${at}.id`, "must be a safe lowercase filename slug");
    }
    if (projectIds.has(project.id)) bad(`${at}.id`, "duplicate project ID");
    projectIds.add(project.id);
    strings(project.tags, `${at}.tags`);
    if (project.team !== undefined) strings(project.team, `${at}.team`);
    videos(project.videos, `${at}.videos`);
  });
  if (Array.isArray(site.library)) videos(site.library, "library");
  if (Array.isArray(site.resumes) && site.resumes.length < 2) bad("resumes", "must include both public resume editions");
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
