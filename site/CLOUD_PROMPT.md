# Cloud session prompt — Jay Rohrs portfolio site

Where: a Claude Code CLOUD session on the new public GitHub repo (e.g. JayRohrs/portfolio). Uses the $100 cloud-session credit, not the weekly limit.
Before starting: Jay has approved site/content/site.json and uploaded to the repo root: content/site.json, SITE_SPEC.md, README.md (from B:\iCloud\iCloudDrive\JayBase\site\), plus downloads/ with the two public resume PDFs and his headshot.

```text
Build Jay Rohrs's portfolio website in this repo.

Read README.md, SITE_SPEC.md and content/site.json first. They are the whole brief:
- Every word, link, project, role and figure comes from content/site.json. Do not add, embellish or guess any claim, number, outlet, client or credential. Items marked NEEDS_JAY or with no videos stay hidden; list them in a TODO.md for Jay.
- Never add: phone number, tracking/analytics scripts, cookies, autoplay audio, or any link not in site.json.

Build:
- A plain static site (HTML/CSS + minimal vanilla JS, no framework, no server) that GitHub Pages can serve from the main branch. Every page is generated from content/site.json at build time by one small script (node or python, no heavy dependencies) OR rendered client-side with graceful no-JS fallback — pick the simpler one that keeps pages readable without JavaScript and good for search engines.
- Pages: Home (sections in SITE_SPEC.md order), Work (filter bar that degrades without JS), one case-study page per visible featured project, About, Résumé (the two PDFs), Contact (email + LinkedIn).
- Look: SITE_SPEC.md colours and segmented rule; serif headings, clean sans body; readable and well balanced before compact; perfect at 390 px phone width and at desktop; 44 px tap targets; WCAG AA contrast; real headings, alt text, visible focus.
- Videos: thumbnail first; load a youtube-nocookie embed only on click.
- Headshot only in the About section.
- Add a short HOW_TO_UPDATE.md: edit content/site.json → rebuild → push; and how jBase can later update that one file.
- Enable GitHub Pages (Settings → Pages → main branch) instructions in README if you can't set it yourself.

Check before finishing: build runs clean; all pages valid HTML; no broken internal links; every external link appears in site.json; Lighthouse-style check for accessibility and performance (state results honestly); screenshots at 390 px and 1366 px of Home and one case study committed under docs/screenshots/.

Commit in small, clear commits. Open a pull request for Jay to review instead of pushing straight to main. Report back in plain words: what's built, what's hidden and why, and what Jay needs to answer.
```
