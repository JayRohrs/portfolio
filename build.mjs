#!/usr/bin/env node
// Builds the whole static site from content/site.json. No dependencies.
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(ROOT, "content/site.json"), "utf8"));
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
  ["work.html", "Work"],
  ["about.html", "About"],
  ["resume.html", "Résumé"],
  ["contact.html", "Contact"],
];

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
  <figcaption>${esc(v.title)}</figcaption>
</figure>`;
}

function featuredCard(p, rootPrefix, tags = false) {
  const tagAttr = tags ? ` data-tags="${esc(p.tags.map(slug).join(" "))}"` : "";
  return `<article class="card"${tagAttr}>
  <a class="card-media" href="${rootPrefix}projects/${p.id}.html" tabindex="-1" aria-hidden="true">${thumbMarkup(p, rootPrefix)}</a>
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

function head({ title, description, rootPrefix }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-src https://www.youtube-nocookie.com; base-uri 'none'; form-action 'none'">
<meta name="theme-color" content="#2a1220">
<link rel="icon" href="${rootPrefix}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${rootPrefix}assets/style.css">
</head>`;
}

function layout({ file, title, description, body, current }) {
  const rootPrefix = "../".repeat(file.split("/").length - 1);
  const nav = NAV.map(
    ([href, label]) =>
      `<li><a href="${rootPrefix}${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a></li>`
  ).join("\n        ");
  return `${head({ title, description, rootPrefix })}
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
    <a class="btn btn-primary header-cta" href="${mailto}">Email Jay</a>
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
    </div>
    <ul class="footer-links">
      <li><a href="${mailto}">${esc(person.email)}</a></li>
      <li>${ext(person.linkedin, "LinkedIn")}</li>
      <li>${ext(person.youtube, "YouTube")}</li>
    </ul>
  </div>
</footer>
<script src="${rootPrefix}assets/site.js" defer></script>
</body>
</html>
`;
}

const page = (file, opts) => ({ file, html: layout({ file, ...opts }) });

// ---- pages ----------------------------------------------------------------
const pages = [];
const heroProject = featured.find((p) => p.id === "cato-falls") || featured[0];

pages.push(
  page("index.html", {
    current: "index.html",
    title: `${person.name} — ${person.headline.split(" · ")[0]}`,
    description: person.statement,
    body: (r) => `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <h1>${esc(person.name)}</h1>
      <p class="headline">${esc(person.headline)}</p>
      <p class="statement">${esc(person.statement)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${r}work.html">View Selected Work</a>
        <a class="btn btn-secondary" href="${r}${dl(avResume)}">Download AV Résumé</a>
      </div>
      <p class="small-link"><a href="${r}${dl(sysResume)}">${esc(sysResume.label)} (PDF)</a></p>
    </div>
    <a class="hero-media" href="${r}projects/${heroProject.id}.html">
      <span class="video-frame">${thumbMarkup(heroProject, r, true)}</span>
      <span class="hero-caption">${esc(heroProject.title)} — ${esc(heroProject.type)}<span class="sr">. View case study</span></span>
    </a>
  </div>
</section>

<section class="strip" aria-label="Highlights">
  <div class="wrap">
    <ul class="strip-list">
      ${site.credibility_strip.map((c) => `<li><span class="figure">${esc(c.figure)}</span><span class="fig-label">${esc(c.label)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section class="section" id="featured">
  <div class="wrap">
    <h2>Featured work</h2>
    <div class="grid">
${featured.map((p) => featuredCard(p, r)).join("\n")}
    </div>
    <p class="section-link"><a class="btn btn-secondary" href="${r}work.html">See all work</a></p>
  </div>
</section>

<section class="section tint" id="capabilities">
  <div class="wrap">
    <h2>What I do</h2>
    <ul class="caps">
      ${site.capabilities.map((c) => `<li><h3>${esc(c.name)}</h3><p>${esc(c.evidence)}</p></li>`).join("\n      ")}
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

<section class="section" id="proof">
  <div class="wrap">
    <h2>Additional proof</h2>
    <div class="grid grid-2">
${proof.map((p) => proofCard(p)).join("\n")}
    </div>
  </div>
</section>

<section class="section tint" id="system">
  <div class="wrap narrow">
    <h2>Production is also a system</h2>
    <p>${esc(site.capabilities[site.capabilities.length - 1].evidence)}</p>
    <p><a class="btn btn-secondary" href="${r}${dl(sysResume)}">${esc(sysResume.label)} (PDF)</a></p>
  </div>
</section>

<section class="section" id="about">
  <div class="wrap about-grid">
    <img class="headshot" src="${r}assets/images/headshot.jpg" alt="Portrait of ${esc(person.name)}" width="720" height="900" loading="lazy" decoding="async">
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
      <a class="btn btn-gold" href="${mailto}">Contact Jay</a>
      <a class="btn btn-light" href="${r}resume.html">Download Résumé</a>
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
    <div class="grid" id="work-grid">
${featured.map((p) => featuredCard(p, r, true)).join("\n")}
${proof.map((p) => proofCard(p, true)).join("\n")}
    </div>
  </div>
</section>`;
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
      <p><a class="btn btn-primary" href="${r}contact.html">Contact Jay</a></p>
    </div>
  </div>
</section>`,
  })
);

pages.push(
  page("resume.html", {
    current: "resume.html",
    title: `Résumé — ${person.name}`,
    description: `Download ${person.name}'s résumés as PDF.`,
    body: (r) => `
<section class="page-head">
  <div class="wrap"><h1>Résumé</h1><p class="lede">Two résumés, depending on the work you have in mind.</p></div>
</section>
<section class="section">
  <div class="wrap">
    <ul class="grid grid-2 plain-list">
      ${resumes
        .map(
          (x) => `<li class="card card-small"><div class="card-body">
        <h2 class="h3">${esc(x.label)}</h2>
        <p><a class="btn btn-primary" href="${r}${dl(x)}">Download PDF<span class="sr">: ${esc(x.label)}</span></a></p>
      </div></li>`
        )
        .join("\n      ")}
    </ul>
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
  </div>
</section>`,
  })
);

// ---- write ----------------------------------------------------------------
for (const d of ["projects"]) {
  const dir = join(ROOT, d);
  if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(join(dir, f));
}
for (const { file, html } of pages) {
  const out = join(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
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
  "",
].filter((l, i, a) => !(l === "" && a[i - 1] === ""));
const extra = existsSync(join(ROOT, "content/todo-extra.md")) ? readFileSync(join(ROOT, "content/todo-extra.md"), "utf8") : "";
writeFileSync(join(ROOT, "TODO.md"), todo.join("\n") + "\n" + extra);

console.log(`Built ${pages.length} pages (${featured.length} case studies; hidden: ${hidden.map((p) => p.title).join(", ") || "none"}).`);
