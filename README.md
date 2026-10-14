# Jay Rohrs portfolio site — content pack

Status: APPROVED BY JAY 2026-10-12 · ready to upload to the public portfolio repo.

This folder is public-only (INFORMATION_ARCHITECTURE.md: "Keep site/ public-only"). Only material Jay approves goes to the public GitHub repo.

## Files
- content/site.json — every word, link and project on the site. Only Verified/Confirmed public links. Items marked NEEDS_JAY wait for his answer.
- SITE_SPEC.md — the design brief for the builder (from INFORMATION_ARCHITECTURE.md and the AV resume look Jay picked).
- downloads/ — current approved public PDFs: AV V6.1 and IT V4.9. Private masters and their supporting records stay outside this repository.

## Rules
- Never: the First Unitarian memorial livestream; unverified outlet names; phone number; private career, client or church-governance material; drone credential claims.
- Readable and well balanced beats compact (Jay's rule for every document).
- A private admin system may later propose public content updates through a pull request, always with Jay's approval before publishing. See `docs/UPDATE_CONTRACT.md`.

## Building and publishing
- `node build.mjs` regenerates every page from `content/site.json` (Node 18+, no installs). `node scripts/check.mjs` checks links.
- The generated HTML is committed at the repo root, so GitHub Pages serves it directly.
- **Turn on GitHub Pages (one-time):** repo → Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save. The site appears at `https://<user>.github.io/portfolio/` within a minute or two.
- See `HOW_TO_UPDATE.md` for edits and `TODO.md` for open questions.

## Client site additions
- Menu: Services · Work · About · Résumés · Start a project. IT & Systems and AV & Production are separate services pages, with a short "AI where they meet" page.
- `start.html` is a static request form that opens the visitor's own email program (no backend). See `docs/ORDER_INTAKE.md`.
- `node scripts/check.mjs` checks every page (titles, headings, links, placeholders, emails, the form's mailto). `node scripts/contrast.mjs` prints measured colour contrast.
- Open questions for Jay: `docs/NEEDS_JAY.md`.
