
## Site-level to-dos
- **Video thumbnails:** any video without a file in `assets/thumbs/` shows a styled placeholder. Run `node scripts/fetch-thumbs.mjs` on a computer with internet, then `node build.mjs`, and commit the new files.
- **Work filters with no projects:** "Live Production" and "Aerial" have no visible projects yet, so those buttons are not shown. They appear automatically once a project is tagged with them in `content/site.json`.
- **Résumé notes:** the "will be replaced when the new master is approved" notes in `content/site.json` are internal, so they are not shown on the public Résumé page. Tell me if you want them shown.
- **Résumé files:** when the new AV / IT masters are approved, replace the PDFs in `downloads/` and update `file` in `content/site.json`.
- **Contact page:** still exists (linked from the footer and About) and also lists the YouTube channel (it is in `content/site.json`); say if you want it removed.
- **Search engines:** canonical links and `sitemap.xml` switch on automatically once `site_url` is set (see `HOW_TO_UPDATE.md`).

## Client-site questions
The full list of questions for Jay (services per track, preferred contact route, domain, phone number, service area, About text) is in `docs/NEEDS_JAY.md`. A draft About for approval is in `docs/ABOUT_DRAFT.md`.
