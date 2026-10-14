#!/usr/bin/env node
// Builds the whole static site from content/site.json. No dependencies.
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSite } from "./scripts/validate-update.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(ROOT, "content/site.json"), "utf8"));
const problems = validateSite(site);
if (problems.length) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  console.error("Build stopped before writing files: fix the proposed content first.");
  process.exit(1);
}
const { person } = site;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ytId = (url) => {
  const m = url.match(/(?:youtu\.be\/|\/shorts\/|[?&]v=)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};
const thumbFor = (id) => (id && existsSync(join(ROOT, "assets/thumbs", `${id}.jpg`)) ? `assets/thumbs/${id}.jpg` : null);

// ---- what is visible ------------------------------------------------------
const featured = site.featured.filter((p) => p.videos && p.videos.length > 0);
const hidden = site.featured.filter((p) => !p.videos || p.videos.length === 0);
const proof = site.additional_proof.map((p) => ({ ...p, id: slug(p.title) }));
const resumes = site.resumes;
const avResume = resumes[0];
const sysResume = resumes[1];
const dl = (r) => `downloads/${r.file}`;
const mailto = `mailto:${person.email}`;
const NAV = [
  ["services.html", "Services"],
  ["work.html", "Work"],
  ["about.html", "About"],
  ["resume.html", "Résumés"],
];
const client = site.client;
// Placeholders such as "[NEEDS JAY: ...]" never reach a live page.
const shown = (v) => (typeof v === "string" && v.trim() && !/^\[NEEDS JAY/i.test(v.trim()) ? v : "");
const serviceArea = () => shown(person.service_area) ? `<p>${esc(person.service_area)}</p>` : "";
const SITE_URL = (process.env.SITE_URL ?? site.site_url ?? "").trim().replace(/\/+$/, "");
const services = client.services;
const svc = (id) => services.find((x) => x.id === id);
const projectById = (id) => featured.find((p) => p.id === id);

// ---- building blocks ------------------------------------------------------
const ext = (href, text) =>
  `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr"> (opens in a new tab)</span></a>`;

function thumbMarkup(p, rootPrefix, priority = false) {
  const first = p.videos && p.videos[0];
  const id = first && ytId(first.url);
  const t = thumbFor(id);
  return t
    ? `<img src="${rootPrefix}${t}" alt="" width="480" height="360" ${priority ? "" : 'loading="lazy" '}decoding="async">`
    : `<span class="ph" aria-hidden="true"></span>`;
}

function video(v, rootPrefix) {
  const id = ytId(v.url);
  const t = thumbFor(id);
  const img = t
    ? `<img src="${rootPrefix}${t}" alt="" width="480" height="360" loading="lazy" decoding="async">`
    : `<span class="ph" aria-hidden="true"></span>`;
  return `<figure class="video" data-video-id="${id}" data-title="${esc(v.title)}">
  <a class="video-link" href="${esc(v.url)}">
    <span class="video-frame">${img}<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span>
    <span class="video-cta">Play video<span class="sr">: ${esc(v.title)}</span></span>
  </a>
  <figcaption>${esc(v.title)}${v.published ? ` (${esc(v.published)})` : ""}</figcaption>
</figure>`;
}

function featuredCard(p, rootPrefix, tags = false) {
  const tagAttr = tags ? ` data-tags="${esc(p.tags.map(slug).join(" "))}"` : "";
  return `<article class="card"${tagAttr}>
  <a class="card-media video-frame" href="${rootPrefix}projects/${p.id}.html" tabindex="-1" aria-hidden="true">${thumbMarkup(p, rootPrefix)}</a>
  <div class="card-body">
    <p class="eyebrow">${esc(p.type)}</p>
    <h3><a href="${rootPrefix}projects/${p.id}.html">${esc(p.title)}</a></h3>
    <p class="role"><span class="label">Role</span> ${esc(p.role)}</p>
    <p>${esc(p.why)}</p>
    <p class="card-link"><a class="btn btn-text" href="${rootPrefix}projects/${p.id}.html">View case study<span class="sr"> — ${esc(p.title)}</span></a></p>
  </div>
</article>`;
}

function proofCard(p, tags = false) {
  const tagAttr = tags ? ` data-tags="${esc(p.tags.map(slug).join(" "))}"` : "";
  const label = p.url.includes("/@") ? "Visit the YouTube channel" : "Watch on YouTube";
  return `<article class="card card-small"${tagAttr}>
  <div class="card-body">
    <p class="eyebrow">Additional proof</p>
    <h3>${esc(p.title)}</h3>
    <p class="role"><span class="label">Role</span> ${esc(p.role)}</p>
    <p>${esc(p.why)}</p>
    <p class="card-link">${ext(p.url, `${label}<span class="sr">: ${esc(p.title)}</span>`).replace('<a ', '<a class="btn btn-text" ')}</p>
  </div>
</article>`;
}

function head({ title, description, rootPrefix, file, noindex }) {
  const url = SITE_URL ? `${SITE_URL}/${file === "index.html" ? "" : file}` : "";
  const og = [
    ["og:type", "website"],
    ["og:site_name", person.name],
    ["og:title", title],
    ["og:description", description],
    ...(url ? [["og:url", url]] : []),
  ]
    .map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}${url && !noindex ? `<link rel="canonical" href="${esc(url)}">\n` : ""}${og}
<meta name="twitter:card" content="summary">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-src https://www.youtube-nocookie.com; base-uri 'none'; form-action 'none'">
<meta name="theme-color" content="#2a1220">
<link rel="icon" href="${rootPrefix}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${rootPrefix}assets/style.css">
${file === "index.html" ? jsonLd() : ""}</head>`;
}

// Only approved facts from content/site.json.
function jsonLd() {
  const [city, region] = person.location.split(",").map((x) => x.trim());
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "#jay",
        name: person.name,
        email: person.email,
        sameAs: [person.linkedin, person.youtube],
        address: { "@type": "PostalAddress", addressLocality: city, addressRegion: region },
      },
      {
        "@type": "ProfessionalService",
        name: person.name,
        description: person.statement,
        email: person.email,
        founder: { "@id": "#jay" },
        address: { "@type": "PostalAddress", addressLocality: city, addressRegion: region },
        sameAs: [person.linkedin, person.youtube],
        ...(SITE_URL ? { url: SITE_URL + "/" } : {}),
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>\n`;
}

function layout({ file, title, description, body, current, noindex, scripts = [] }) {
  const rootPrefix = "../".repeat(file.split("/").length - 1);
  const nav = NAV.map(
    ([href, label]) =>
      `<li><a href="${rootPrefix}${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a></li>`
  ).join("\n        ");
  return `${head({ title, description, rootPrefix, file, noindex })}
<body>
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="wordmark" href="${rootPrefix}index.html"${current === "index.html" ? ' aria-current="page"' : ""}>Jay Rohrs</a>
    <nav aria-label="Main">
      <ul class="nav">
        ${nav}
      </ul>
    </nav>
    <a class="btn btn-primary header-cta" href="${rootPrefix}start.html"${current === "start.html" ? ' aria-current="page"' : ""}>Start a project</a>
  </div>
  <div class="rule" aria-hidden="true"></div>
</header>
<main id="main">
${body(rootPrefix)}
</main>
<footer class="site-footer">
  <div class="rule" aria-hidden="true"></div>
  <div class="wrap footer-row">
    <div>
      <p class="footer-name">Jay Rohrs</p>
      <p>${esc(person.location)}</p>
      <p><a class="btn btn-accent" href="${rootPrefix}start.html">Start a project</a></p>
    </div>
    <ul class="footer-links">
      <li><a href="${rootPrefix}services.html">Services</a></li>
      <li><a href="${mailto}">${esc(person.email)}</a></li>
      <li>${ext(person.linkedin, "LinkedIn")}</li>
      <li>${ext(person.youtube, "YouTube")}</li>
    </ul>
  </div>
</footer>
<script src="${rootPrefix}assets/site.js" defer></script>
${scripts.map((x) => `<script src="${rootPrefix}assets/${x}" defer></script>`).join("\n")}
</body>
</html>
`;
}

const page = (file, opts) => ({ file, html: layout({ file, ...opts }) });

// ---- pages ----------------------------------------------------------------
const pages = [];
const heroProject = featured.find((p) => p.id === "cato-falls") || featured[0];


// ---- video wall ---------------------------------------------------------------
// Every approved public video (featured projects, additional proof, and the optional
// "library" list in site.json), de-duplicated, shown as small tiles.
function libraryItems() {
  const items = [];
  for (const p of featured) for (const v of p.videos) items.push({ title: v.title, url: v.url, from: p.title });
  for (const p of proof) if (ytId(p.url)) items.push({ title: p.title, url: p.url, from: p.title });
  for (const v of site.library || []) items.push({ title: v.title, url: v.url, from: "" });
  const seen = new Set();
  return items.filter((x) => {
    const id = ytId(x.url);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    x.id = id;
    return true;
  });
}

function wall(r, heading, intro, level = "h2") {
  const items = libraryItems();
  return `<section class="wall" id="wall" aria-labelledby="wall-h">
  <div class="wrap">
    <${level} id="wall-h">${esc(heading)}</${level}>
    <p class="narrow-text">${esc(intro)}</p>
    <ul class="tiles">
      ${items
        .map((x) => {
          const t = thumbFor(x.id);
          const img = t ? `<img src="${r}${t}" alt="" width="480" height="360" loading="lazy" decoding="async">` : `<span class="ph" aria-hidden="true"></span>`;
          return `<li><a class="tile" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="video-frame">${img}<span class="play play-sm" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span><span class="tile-cap">${esc(x.title)}<span class="sr"> (opens on YouTube in a new tab)</span></span></a></li>`;
        })
        .join("\n      ")}
    </ul>
  </div>
</section>`;
}

function trackCard(x, r) {
  return `<article class="track">
  <p class="eyebrow">${esc(x.track)}</p>
  <h3><a href="${r}${x.path}">${esc(x.title)}</a></h3>
  <p>${esc(x.tagline)}</p>
  <p class="who">${esc(x.who_for)}</p>
  <ul class="ticks">
    ${x.types.slice(0, 3).map((t) => `<li>${esc(t.name)}</li>`).join("\n    ")}
  </ul>
  <p class="card-link"><a class="btn btn-primary" href="${r}${x.path}">See ${esc(x.track)} services</a></p>
</article>`;
}

pages.push(
  page("index.html", {
    current: "index.html",
    title: `${person.name} — IT & Systems and AV & Media Production in Denver`,
    description: `${client.home.hero_line} IT and systems help, and AV and media production, for small businesses, churches and nonprofits. ${person.location}.`,
    body: (r) => `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <h1>${esc(person.name)}</h1>
      <p class="headline">${esc(client.home.hero_line)}</p>
      <p class="statement">${esc(person.statement)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${r}start.html">Start a project</a>
        <a class="btn btn-secondary" href="${r}services.html">See services</a>
      </div>
      <p class="small-link">${esc(person.location)}. ${esc(person.availability)}.</p>
    </div>
    <a class="hero-media" href="${r}projects/${heroProject.id}.html">
      <span class="video-frame">${thumbMarkup(heroProject, r, true)}</span>
      <span class="hero-caption">${esc(heroProject.title)} — ${esc(heroProject.type)}<span class="sr">. View case study</span></span>
    </a>
  </div>
</section>

<section class="section" id="help">
  <div class="wrap">
    <h2>${esc(client.home.intro_heading)}</h2>
    <p class="lede narrow-text">${esc(client.home.intro)}</p>
    <div class="tracks">
      ${["it", "av"].map((id) => trackCard(svc(id), r)).join("\n      ")}
    </div>
  </div>
</section>

<section class="section tint" id="ai">
  <div class="wrap narrow">
    <h2>${esc(client.home.ai_heading)}</h2>
    <p>${esc(client.home.ai_text)}</p>
    <p><a class="btn btn-secondary" href="${r}${svc("ai").path}">AI where they meet</a></p>
  </div>
</section>

<section class="section" id="featured">
  <div class="wrap">
    <h2>${esc(client.home.proof_heading)}</h2>
    <p class="narrow-text">${esc(client.home.proof_intro)}</p>
    <div class="grid">
${featured.map((p) => featuredCard(p, r)).join("\n")}
    </div>
    <p class="section-link"><a class="btn btn-secondary" href="${r}work.html">See all work</a></p>
    <h3 class="sub-h">Additional proof</h3>
    <div class="grid grid-2">
${proof.map((p) => proofCard(p)).join("\n")}
    </div>
  </div>
</section>

${wall(r, client.home.wall_heading, client.home.wall_intro)}

<section class="strip" aria-label="Highlights">
  <div class="wrap">
    <ul class="strip-list">
      ${site.credibility_strip.map((c) => `<li><span class="figure">${esc(c.figure)}</span><span class="fig-label">${esc(c.label)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section class="band" id="current" aria-labelledby="current-h">
  <div class="wrap">
    <h2 id="current-h">Right now</h2>
    <ul class="plain">
      ${site.current_practice.map((c) => `<li>${esc(c)}</li>`).join("\n      ")}
    </ul>
    <p class="availability">${esc(person.availability)}</p>
  </div>
</section>

<section class="section" id="about">
  <div class="wrap about-grid">
    <img class="headshot" src="${r}assets/images/headshot.jpg" alt="Portrait of ${esc(person.name)}" width="720" height="900" decoding="async">
    <div>
      <h2>About</h2>
      <p class="lede">${esc(person.statement)}</p>
      ${aboutParagraphs()}
      <p>${esc(person.location)}. ${esc(person.availability)}.</p>
      <p><a class="btn btn-secondary" href="${r}about.html">More about Jay</a></p>
    </div>
  </div>
</section>

<section class="contact-band" id="contact">
  <div class="wrap narrow center">
    <h2>${esc(site.contact_cta)}</h2>
    <div class="actions center-actions">
      <a class="btn btn-accent" href="${r}start.html">Start a project</a>
      <a class="btn btn-light" href="${r}resume.html">Résumés</a>
    </div>
  </div>
</section>`,
  })
);

function aboutParagraphs() {
  const ps = (site.about && site.about.paragraphs) || [];
  return ps.map((t) => `<p>${esc(t)}</p>`).join("\n      ");
}

pages.push(
  page("work.html", {
    current: "work.html",
    title: `Work — ${person.name}`,
    description: `Selected work by ${person.name}: documentary, music, commercial and civic video.`,
    body: (r) => {
      const filters = site.work_filters.filter((f) =>
        [...featured, ...proof].some((p) => p.tags.includes(f))
      );
      return `
<section class="page-head">
  <div class="wrap">
    <h1>Work</h1>
    <p class="lede">Each project below says what it was, what I did and why it matters. Open a case study to watch the videos.</p>
    <div class="filter-bar" id="filter-bar" hidden>
      <p class="filter-label" id="filter-label">Filter by type</p>
      <ul class="filters" aria-labelledby="filter-label">
        ${filters.map((f) => `<li><button type="button" class="filter" data-filter="${slug(f)}" aria-pressed="false">${esc(f)}</button></li>`).join("\n        ")}
      </ul>
      <p class="filter-status" id="filter-status" role="status" aria-live="polite"></p>
    </div>
  </div>
</section>
<section class="section" aria-label="Projects">
  <div class="wrap">
    <h2 class="sr">Projects</h2>
    <div class="grid" id="work-grid">
${featured.map((p) => featuredCard(p, r, true)).join("\n")}
${proof.map((p) => proofCard(p, true)).join("\n")}
    </div>
  </div>
</section>
${wall(r, "Video wall", client.home.wall_intro)}`;
    },
  })
);

featured.forEach((p, i) => {
  const prev = featured[(i + featured.length - 1) % featured.length];
  const next = featured[(i + 1) % featured.length];
  const pending = p.pending_item;
  const nbc = pending && (pending.verified_event_facts.match(/https:\/\/www\.nbcnewyork\.com\/[^\s)]+/) || [])[0];
  pages.push(
    page(`projects/${p.id}.html`, {
      current: "work.html",
      title: `${p.title} — ${person.name}`,
      description: `${p.type}. ${p.role}.`,
      body: (r) => `
<section class="page-head">
  <div class="wrap">
    <p class="crumb"><a href="${r}work.html">← All work</a></p>
    <p class="eyebrow">${esc(p.type)}</p>
    <h1>${esc(p.title)}</h1>
  </div>
</section>
<section class="section case">
  <div class="wrap case-grid">
    <div class="case-main">
      <h2>Watch</h2>
      <div class="videos">
${p.videos.map((v) => video(v, r)).join("\n")}
      </div>
      ${
        pending
          ? `<h2>Also</h2>
      <p><strong>${esc(pending.title)}</strong> — ${esc(pending.public_wording)}${nbc ? ` ${ext(nbc, "Read the NBC New York report")}.` : ""}</p>`
          : ""
      }
    </div>
    <aside class="case-side" aria-label="Project details">
      <dl>
        <dt>What it was</dt><dd>${esc(p.type)}</dd>
        <dt>Role</dt><dd>${esc(p.role)}</dd>
        <dt>Why it matters</dt><dd>${esc(p.why)}</dd>
        ${
          p.team
            ? `<dt>Team</dt><dd><ul class="plain">${p.team.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></dd>`
            : ""
        }
      </dl>
    </aside>
  </div>
</section>
<nav class="pager" aria-label="More case studies">
  <div class="wrap pager-row">
    <a href="${r}projects/${prev.id}.html"><span class="label">Previous</span> ${esc(prev.title)}</a>
    <a href="${r}projects/${next.id}.html"><span class="label">Next</span> ${esc(next.title)}</a>
  </div>
</nav>`,
    })
  );
});

pages.push(
  page("about.html", {
    current: "about.html",
    title: `About — ${person.name}`,
    description: person.statement,
    body: (r) => `
<section class="page-head">
  <div class="wrap"><h1>About</h1></div>
</section>
<section class="section">
  <div class="wrap about-grid">
    <img class="headshot" src="${r}assets/images/headshot.jpg" alt="Portrait of ${esc(person.name)}" width="720" height="900" decoding="async">
    <div>
      <p class="lede">${esc(person.statement)}</p>
      <p>${esc(person.headline)}.</p>
      ${aboutParagraphs()}
      <p>${esc(person.location)}. ${esc(person.availability)}.</p>
      ${
        site.about && site.about.timeline && site.about.timeline.length
          ? `<h2>Timeline</h2><ul class="timeline">${site.about.timeline.map((t) => `<li><span class="label">${esc(t.year)}</span> ${esc(t.text)}</li>`).join("")}</ul>`
          : ""
      }
      <h2>What I do</h2>
      <ul class="caps caps-list">
        ${site.capabilities.map((c) => `<li><h3>${esc(c.name)}</h3><p>${esc(c.evidence)}</p></li>`).join("\n        ")}
      </ul>
      <h2>Right now</h2>
      <ul class="plain">
        ${site.current_practice.map((c) => `<li>${esc(c)}</li>`).join("\n        ")}
      </ul>
      <p><a class="btn btn-primary" href="${r}start.html">Start a project</a> <a class="btn btn-secondary" href="${r}contact.html">Contact details</a></p>
    </div>
  </div>
</section>`,
  })
);

pages.push(
  page("resume.html", {
    current: "resume.html",
    title: `Résumés — ${person.name}`,
    description: `Download ${person.name}'s two résumés as PDF: one for AV and media production, one for IT and systems.`,
    body: (r) => `
<section class="page-head">
  <div class="wrap"><h1>Résumés</h1><p class="lede">I keep two résumés because the two kinds of work are different. Choose the one that matches the job.</p></div>
</section>
<section class="section">
  <div class="wrap">
    <div class="grid grid-2">
      ${resumes
        .map((x) => {
          const sv = svc(x.track);
          return `<article class="card card-small"><div class="card-body">
        <p class="eyebrow">${esc(sv.track)} track</p>
        <h2 class="h3">${esc(x.label)}</h2>
        <p>${esc(sv.tagline)}</p>
        <p><a class="btn btn-primary" href="${r}${dl(x)}">Download PDF<span class="sr">: ${esc(x.label)}</span></a></p>
        <p class="card-link"><a href="${r}${sv.path}">About the ${esc(sv.track)} services</a></p>
      </div></article>`;
        })
        .join("\n      ")}
    </div>
  </div>
</section>`,
  })
);

pages.push(
  page("contact.html", {
    current: "contact.html",
    title: `Contact — ${person.name}`,
    description: `${site.contact_cta} Email ${person.name} or find Jay on LinkedIn.`,
    body: () => `
<section class="page-head">
  <div class="wrap"><h1>Contact</h1><p class="lede">${esc(site.contact_cta)}</p></div>
</section>
<section class="section">
  <div class="wrap narrow">
    <ul class="contact-list">
      <li><span class="label">Email</span> <a class="contact-big" href="${mailto}">${esc(person.email)}</a></li>
      <li><span class="label">LinkedIn</span> ${ext(person.linkedin, "Jay Rohrs on LinkedIn")}</li>
      <li><span class="label">YouTube</span> ${ext(person.youtube, "Videos on YouTube")}</li>
    </ul>
    <p>${esc(person.location)}. ${esc(person.availability)}.</p>
    ${serviceArea()}
    <p><a class="btn btn-primary" href="start.html">Start a project</a></p>
  </div>
</section>`,
  })
);

// ---- services -------------------------------------------------------------
function proofLink(x, r) {
  if (x.project) {
    const p = projectById(x.project);
    return `<a href="${r}projects/${p.id}.html">${esc(x.label)} (case study)</a>`;
  }
  return `<a href="${r}downloads/${x.file}">${esc(x.label)}</a>`;
}

const howItWorks = () => `<section class="section tint" id="how">
  <div class="wrap">
    <h2>How it works</h2>
    <ol class="steps">
      ${client.how_it_works.map((h) => `<li><h3>${esc(h.step)}</h3><p>${esc(h.text)}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>`;

pages.push(
  page("services.html", {
    current: "services.html",
    title: `Services — ${person.name}`,
    description: `IT and systems help, and AV and media production, for small businesses, churches and nonprofits in ${person.location}. Two separate services, one conversation to start.`,
    body: (r) => `
<section class="page-head">
  <div class="wrap">
    <h1>Services</h1>
    <p class="lede">${esc(client.home.intro)}</p>
    ${serviceArea()}
  </div>
</section>
<section class="section">
  <div class="wrap">
    <h2 class="sr">The two services</h2>
    <div class="tracks">
      ${["it", "av"].map((id) => trackCard(svc(id), r)).join("\n      ")}
    </div>
    <h2 class="sub-h">${esc(svc("ai").title)}</h2>
    <p class="narrow-text">${esc(svc("ai").tagline)} ${esc(client.home.ai_text)}</p>
    <p><a class="btn btn-secondary" href="${r}${svc("ai").path}">${esc(svc("ai").title)}</a></p>
  </div>
</section>
${howItWorks()}
<section class="contact-band">
  <div class="wrap narrow center">
    <h2>${esc(site.contact_cta)}</h2>
    <p class="actions center-actions"><a class="btn btn-accent" href="${r}start.html">Start a project</a></p>
  </div>
</section>`,
  })
);

for (const x of services) {
  const other = x.other_track ? svc(x.other_track) : null;
  pages.push(
    page(x.path, {
      current: "services.html",
      title: `${x.title} — ${person.name}`,
      description: x.description,
      body: (r) => `
<section class="page-head">
  <div class="wrap">
    <p class="crumb"><a href="${r}services.html">← All services</a></p>
    <p class="eyebrow">${esc(x.track)}</p>
    <h1>${esc(x.title)}</h1>
    <p class="lede">${esc(x.tagline)}</p>
    <p class="actions"><a class="btn btn-primary" href="${r}start.html">Start a project</a></p>
  </div>
</section>
<section class="section">
  <div class="wrap case-grid">
    <div class="case-main">
      <h2>Who it is for</h2>
      <p>${esc(x.who_for)}</p>
      <h2>What I can help with</h2>
      <ul class="service-list">
        ${x.types.map((t) => `<li><h3>${esc(t.name)}</h3><p>${esc(t.text)}</p></li>`).join("\n        ")}
      </ul>
      ${
        x.ideas
          ? `<h2>${esc(x.ideas_heading)}</h2>
      <p>${esc(x.ideas_intro)}</p>
      <ul class="ticks">
        ${x.ideas.map((t) => `<li>${esc(t)}</li>`).join("\n        ")}
      </ul>`
          : ""
      }
    </div>
    <aside class="case-side" aria-label="Getting started">
      <h2 class="h3">${esc(client.first_step_title)}</h2>
      <p>${esc(x.first_step)}</p>
      ${serviceArea()}
      <p><span class="label">Price</span><br>${esc(client.pricing)}</p>
      <p><a class="btn btn-primary" href="${r}start.html">Start a project</a></p>
    </aside>
  </div>
</section>
${howItWorks()}
<section class="section" id="proof">
  <div class="wrap narrow">
    <h2>See the proof</h2>
    <ul class="plain proof-links">
      ${x.proof.map((pr) => `<li>${proofLink(pr, r)}</li>`).join("\n      ")}
    </ul>
    ${other ? `<p class="other-track">Looking for something different? See <a href="${r}${other.path}">${esc(other.title)}</a>.</p>` : ""}
  </div>
</section>`,
    })
  );
}

// ---- start a project ----------------------------------------------------------
const st = client.start;
const err = (k) => `<p class="field-error" id="err-${k}" hidden></p>`;
pages.push(
  page("start.html", {
    current: "start.html",
    title: `${st.title} — ${person.name}`,
    description: st.description,
    scripts: ["intake.js", "start.js"],
    body: () => `
<section class="page-head">
  <div class="wrap narrow">
    <h1>${esc(st.title)}</h1>
    <p class="lede">${esc(st.intro)}</p>
    <p>You can also email <a href="${mailto}">${esc(person.email)}</a> directly.</p>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <p id="no-js-note" class="notice">This form needs JavaScript to build your email. Without it, please write to <a href="${mailto}">${esc(person.email)}</a> and tell me which kind of help you need (IT &amp; Systems, AV &amp; Media Production, both, or not sure), what you need, and your timeline.</p>
    <form id="start-form" class="form" data-to="${esc(person.email)}" novalidate hidden>
      <div id="form-errors" class="form-errors" role="alert" tabindex="-1" hidden></div>
      <div class="field">
        <label for="f-name">Your name <span class="req">(required)</span></label>
        <input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="err-name">
        ${err("name")}
      </div>
      <div class="field">
        <label for="f-organisation">Organisation</label>
        <input id="f-organisation" name="organisation" type="text" autocomplete="organization">
      </div>
      <div class="field">
        <label for="f-email">Your email <span class="req">(required)</span></label>
        <input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="err-email">
        ${err("email")}
      </div>
      <div class="field">
        <label for="f-phone">Phone <span class="opt">(optional)</span></label>
        <input id="f-phone" name="phone" type="tel" autocomplete="tel">
      </div>
      <fieldset class="field" aria-describedby="err-track">
        <legend>What kind of help? <span class="req">(required)</span></legend>
        ${st.tracks
          .map(
            (t, i) =>
              `<div class="choice"><input id="track-${t.value}" type="radio" name="track" value="${t.value}"><label for="track-${t.value}">${esc(t.label)}</label></div>`
          )
          .join("\n        ")}
        ${err("track")}
      </fieldset>
      <div class="field">
        <label for="f-need">What do you need? <span class="req">(required)</span></label>
        <textarea id="f-need" name="need" rows="6" required aria-describedby="err-need"></textarea>
        ${err("need")}
      </div>
      <div class="field">
        <label for="f-timeline">Timeline</label>
        <select id="f-timeline" name="timeline">
          <option value="">Choose one</option>
          ${st.timelines.map((t) => `<option>${esc(t)}</option>`).join("\n          ")}
        </select>
      </div>
      <div class="field">
        <label for="f-budget">Budget range <span class="opt">(optional)</span></label>
        <select id="f-budget" name="budget">
          <option value="">Prefer not to say</option>
          ${st.budgets.map((t) => `<option>${esc(t)}</option>`).join("\n          ")}
        </select>
      </div>
      <div class="field">
        <label for="f-heard_from">How did you hear about me?</label>
        <input id="f-heard_from" name="heard_from" type="text">
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="submit">Open my email program</button>
        <button class="btn btn-secondary" type="button" id="copy-request">Copy request text</button>
      </div>
      <p id="form-status" class="form-status" role="status" aria-live="polite"></p>
      <div id="preview-box" hidden>
        <label for="request-preview">Your request, as it will appear in the email</label>
        <textarea id="request-preview" rows="12" readonly></textarea>
      </div>
      <p class="fine">This page does not send, store or track anything. Your message goes only where you send it from your own email program.</p>
    </form>
  </div>
</section>`,
  })
);

// ---- 404, robots, sitemap -----------------------------------------------------
pages.push(
  page("404.html", {
    title: `Page not found — ${person.name}`,
    description: "That page could not be found. Use the links to go back to the home page, services or work.",
    noindex: true,
    body: () => {
      const b = SITE_URL ? SITE_URL + "/" : "";
      return `
<section class="page-head">
  <div class="wrap narrow"><h1>Page not found</h1><p class="lede">That page is not here. Try one of these instead.</p></div>
</section>
<section class="section">
  <div class="wrap narrow">
    <ul class="plain">
      <li><a href="${b}index.html">Home</a></li>
      <li><a href="${b}services.html">Services</a></li>
      <li><a href="${b}work.html">Work</a></li>
      <li><a href="${b}start.html">Start a project</a></li>
    </ul>
  </div>
</section>`;
    },
  })
);

const indexable = pages.filter((p) => p.file.endsWith(".html") && p.file !== "404.html");
pages.push({
  file: "robots.txt",
  html: `User-agent: *\nAllow: /\n${SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml\n` : ""}`,
});
if (SITE_URL) {
  pages.push({
    file: "sitemap.xml",
    html: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
      .map((p) => `  <url><loc>${esc(SITE_URL + "/" + (p.file === "index.html" ? "" : p.file))}</loc></url>`)
      .join("\n")}\n</urlset>\n`,
  });
}


// ---- write ----------------------------------------------------------------
for (const d of ["projects", "services"]) {
  const dir = join(ROOT, d);
  if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(join(dir, f));
}
if (!SITE_URL) rmSync(join(ROOT, "sitemap.xml"), { force: true });
for (const { file, html } of pages) {
  const out = join(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html.replace(/[ \t]+$/gm, ""));
}

function placeholders(node = site, path = "") {
  const out = [];
  if (typeof node === "string") return /^\[NEEDS JAY/i.test(node.trim()) ? [{ path, text: node }] : [];
  if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) out.push(...placeholders(v, path ? `${path}.${k}` : k));
  return out;
}

// ---- TODO.md for Jay --------------------------------------------------------
const todo = [
  "# TODO for Jay",
  "",
  "Generated by `node build.mjs` from the `needs_jay` / hidden items in `content/site.json`. Nothing below is shown on the site until you answer.",
  "",
  "## Hidden items",
  ...hidden.map((p) => `- **${p.title}** — hidden (no public videos). ${p.needs_jay || ""}`),
  "",
  "## Questions",
  ...site.featured.filter((p) => p.needs_jay && p.videos && p.videos.length).map((p) => `- **${p.title}:** ${p.needs_jay}`),
  ...site.featured
    .filter((p) => p.pending_item)
    .map((p) => `- **${p.pending_item.title}** (inside "${p.title}"): ${p.pending_item.status}`),
  site.about && site.about.needs_jay ? `- **About:** ${site.about.needs_jay}` : "",
  ...placeholders().map((x) => `- **${x.path}:** ${x.text}`),
  "",
].filter((l, i, a) => !(l === "" && a[i - 1] === ""));
const extra = existsSync(join(ROOT, "content/todo-extra.md")) ? readFileSync(join(ROOT, "content/todo-extra.md"), "utf8") : "";
writeFileSync(join(ROOT, "TODO.md"), todo.join("\n") + "\n" + extra);

console.log(`Built ${pages.length} pages (${featured.length} case studies; hidden: ${hidden.map((p) => p.title).join(", ") || "none"}).`);
