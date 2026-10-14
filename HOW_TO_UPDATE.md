# How to update the site

All words, links, projects and figures live in one file: `content/site.json`.

1. Edit `content/site.json`.
2. Run `node scripts/validate-update.mjs`, then `node build.mjs` (regenerates all pages and `TODO.md`), then `node scripts/check.mjs` and `node scripts/contrast.mjs`.
3. Commit the changed files and push (via a pull request, then merge to `main`). GitHub Pages republishes automatically.

## Common edits
- **Show a hidden project:** add at least one entry to its `videos` list (`title` + YouTube `url`). Projects with no videos stay hidden.
- **Add About text:** fill `about.paragraphs` (list of strings) and `about.timeline` (list of `{ "year": "...", "text": "..." }`).
- **Filters:** each project has `tags`; a filter button appears only when a visible project uses it.
- **Video thumbnails:** run `node scripts/fetch-thumbs.mjs` then rebuild; commit `assets/thumbs/`.
- **Résumés:** put the PDF in `downloads/` and update `resumes[].file`.

## Updates from a private admin system
A private admin system may author only `content/site.json`, public-safe PDFs in `downloads/`, and approved thumbnails in `assets/thumbs/`. It then rebuilds and opens a branch pull request. Jay approves before merging. See `docs/UPDATE_CONTRACT.md` for the full gate; generated `.html` files are overwritten on every build.

## Services, pages and the start form
- Services pages, the "How it works" steps, pricing wording and the form's options all live under `client` in `content/site.json`.
- Keep unanswered facts in `docs/NEEDS_JAY.md` and leave their content fields empty. The update validator rejects `[NEEDS JAY: ...]` text in `content/site.json`; the page checker also rejects it on live pages.
- The form opens the visitor's email program with a ready-made request. It sends nothing itself. Details and the request format: `docs/ORDER_INTAKE.md`.

## Turning on the web address, canonical links and sitemap
`site_url` in `content/site.json` is empty on purpose. While it is empty, the build leaves out canonical links, `og:url` and `sitemap.xml`.
1. When the final address is known, set it with no trailing slash, for example `"site_url": "https://example.org"` (for a GitHub Pages project site, include the folder: `https://<user>.github.io/portfolio`).
2. Run `node build.mjs` then `node scripts/check.mjs`, commit and push.
3. `404.html` links work from the site root; once `site_url` is set they use the full address, so they also work from deeper pages.
