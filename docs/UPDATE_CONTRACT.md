# Public site update contract

This repo is public. A person or a private admin system may propose an update, but Jay reviews and approves every merge. No updater pushes to `main`.

## Files an updater may author

- `content/site.json`: public words, links, projects and figures.
- `downloads/`: public-safe PDF resumes referenced by `site.json`.
- `assets/thumbs/`: thumbnails for approved public videos.

The build also regenerates HTML pages, `sitemap.xml`, `robots.txt` and `TODO.md`; include those generated changes in the pull request. Do not hand-edit them. Keep library exports, candidate lists, inquiry details, keys, account data and private URLs out of the repo. `scripts/import-library.mjs` is the only bulk video suggestion path: it writes candidates for a person to choose and never publishes them.

## Before opening a pull request

1. Start a branch from the intended base. If another portfolio PR is still open, state that dependency in the new PR.
2. Add only public material that Jay has approved. Confirm each new YouTube video is public and appropriate to publish. The validator can reject an explicitly unlisted/private flag and malformed links; it cannot query YouTube or establish ownership or permission.
3. Run `node scripts/validate-update.mjs`, then `node build.mjs && node scripts/check.mjs`, then `node scripts/contrast.mjs`. All must pass. Check the rendered pages at 390 px and 1366 px.
4. Review the diff for factual claims and private material, then open a pull request. Jay approves before merging. GitHub Pages publishes only after an approved merge to `main`.

The validator accepts only the current public domain, approved link hosts, the single public contact address, direct YouTube video URLs, and PDF filenames present in `downloads/`. A needed new host or contact route requires a deliberate review of the validator and site content in the same PR. Unanswered facts belong in `docs/NEEDS_JAY.md`, never as `[NEEDS JAY` text in `site.json`.

The build runs the same validator before writing or removing generated files. Required page and form fields must be present, project IDs must be unique safe filename slugs, service paths must match `services/it.html`, `services/av.html` or `services/ai.html`, and proof links must reference an existing PDF or visible project. Invalid content leaves the existing pages untouched.

Inquiry intake remains `mailto:` plus Copy request text. The later private inquiry endpoint in `docs/ORDER_INTAKE.md` is design only and needs Jay's explicit approval before implementation.
