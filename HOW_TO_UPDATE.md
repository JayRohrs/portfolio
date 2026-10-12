# How to update the site

All words, links, projects and figures live in one file: `content/site.json`.

1. Edit `content/site.json`.
2. Run `node build.mjs` (regenerates all pages and `TODO.md`), then `node scripts/check.mjs`.
3. Commit the changed files and push (via a pull request, then merge to `main`). GitHub Pages republishes automatically.

## Common edits
- **Show a hidden project:** add at least one entry to its `videos` list (`title` + YouTube `url`). Projects with no videos stay hidden.
- **Add About text:** fill `about.paragraphs` (list of strings) and `about.timeline` (list of `{ "year": "...", "text": "..." }`).
- **Filters:** each project has `tags`; a filter button appears only when a visible project uses it.
- **Video thumbnails:** run `node scripts/fetch-thumbs.mjs` then rebuild; commit `assets/thumbs/`.
- **Résumés:** put the PDF in `downloads/` and update `resumes[].file`.

## jBase
jBase only needs to change `content/site.json` (keep it valid JSON), then rebuild and open a pull request. Jay approves before merging. No other file needs hand-editing; the generated `.html` files are overwritten on every build.
