
## Site-level to-dos
- **Video thumbnails:** any video without a file in `assets/thumbs/` shows a styled placeholder. Run `node scripts/fetch-thumbs.mjs` on a computer with internet, then `node build.mjs`, and commit the new files.
- **Work filters with no projects:** "Live Production" and "Aerial" have no visible projects yet, so those buttons are not shown. They appear automatically once a project is tagged with them in `content/site.json`.
- **Résumés:** approved public AV V6.1 and IT V4.9 PDFs are current. Edition notes in `content/site.json` remain internal; private masters stay outside this repo.
- **Contact page:** still exists (linked from the footer and About) and also lists the YouTube channel (it is in `content/site.json`); say if you want it removed.
- **Search engines:** `site_url` is set to the verified public domain; canonical links and `sitemap.xml` are built. Confirm search indexing separately if needed.

## Client-site questions
The remaining questions for Jay (services per track, preferred contact route, service area, About text) are in `docs/NEEDS_JAY.md`. A draft About for approval is in `docs/ABOUT_DRAFT.md`.
