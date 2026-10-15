# Guide for AI coding agents (Codex, Claude Code, others)

This is Jay Rohrs's public portfolio and client-intake site. It is a plain static site published by GitHub Pages from `main`.

## How it works
- `content/site.json` is the single source of every word, link, project and figure. Edit this, not the HTML.
- `node build.mjs` regenerates all pages (`*.html`, `projects/`, `services/`, `sitemap.xml`, `robots.txt`, `TODO.md`) from it. Generated files are overwritten on every build: never hand-edit them.
- `assets/style.css`, `assets/site.js`, `assets/intake.js`, `assets/start.js` are the only front-end code. No framework, no dependencies, no server.
- After any change run `node build.mjs && node scripts/check.mjs`. The checker must pass.
- Work on a branch and open a pull request. Do not push to `main`.

## Hard rules
- Do not add or guess any claim, number, client, outlet, credential, testimonial, price or award. Unknown facts go in `docs/NEEDS_JAY.md` as `[NEEDS JAY: ...]` and stay hidden on live pages (the checker fails if one appears).
- No phone number, analytics, tracking, cookies, autoplay audio, third-party form service, or any outside link that is not in `content/site.json`.
- Videos load only on click (youtube-nocookie). The headshot appears only in About areas.
- The repo is public: no private career, client, church-governance, employer or financial details, no customer data, no keys or tokens, and never name the private subdomain or private systems. `docs/` describes a private admin system only as "a private admin system".
- Keep the two tracks (IT & Systems, AV & Production) separate on every page.
- Keep the look: plum / rust / clay / gold, serif headings, 390 px friendly, 44 px tap targets, text never shrunk to fit, contrast at least 4.5:1 (`node scripts/contrast.mjs`).

## Useful docs
`README.md`, `HOW_TO_UPDATE.md`, `SITE_SPEC.md`, `docs/ORDER_INTAKE.md`, `docs/LIBRARY_IMPORT.md`, `docs/CUSTOM_DOMAIN.md`, `docs/NEEDS_JAY.md`.
