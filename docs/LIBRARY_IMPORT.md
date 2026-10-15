# Adding more videos to the video wall

The wall on Home and Work shows every approved public video already in `content/site.json`, plus anything listed under `"library"`.

## Steps
1. Export the YouTube library from the private studio as a JSON array. Each item needs `id` (or `url`), `title`, `privacy` and, if known, `published`:
   ```json
   [{ "id": "AbCdEfGhIjK", "title": "Example title", "privacy": "public", "published": "2011-12-17" }]
   ```
2. Run `node scripts/import-library.mjs export.json`. This writes `content/library-candidates.json` and publishes nothing. Anything not marked `public` is skipped, as are videos already on the site.
3. Choose. Copy the `{ "url", "title" }` entries you want shown into `"library"` in `content/site.json`. Choose for quality and audience, not quantity: a dense wall of 20–40 strong tiles reads better than 500.
4. Run `node scripts/fetch-thumbs.mjs` (needs internet) so tiles use real thumbnails, then `node build.mjs` and `node scripts/check.mjs`.

## Rules
- Public videos only. Never unlisted or private, and no one's footage without their say-so (the existing note about family permission for the drone swimmer shot still applies).
- Titles are shown as written, so fix typos in the JSON, not on the page.
- Do not add descriptions, view counts, clients or credits unless they are already approved in `content/site.json`.
