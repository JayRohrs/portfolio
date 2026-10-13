# Putting the site on www.jbase.app (GitHub Pages + Cloudflare)

Do these in order. Leave every existing DNS record (including any private subdomain) untouched.

## 1. GitHub
1. Review and merge the pull request into `main`.
2. Repo → **Settings → Pages** → Build and deployment → Source: **Deploy from a branch** → Branch **main**, folder **/ (root)** → Save. Wait until the page shows the site is published at `https://jayrohrs.github.io/portfolio/`.
3. Same page → **Custom domain**: enter `www.jbase.app` → Save. GitHub adds a `CNAME` file to the branch (leave it there; the build does not touch it).
4. (Recommended) Account → Settings → **Pages → Add a domain**, enter `jbase.app`, and add the TXT record GitHub shows to Cloudflare DNS. This stops anyone else claiming the domain on GitHub.

## 2. Cloudflare (DNS tab for jbase.app)
1. Add record: Type **CNAME**, Name **www**, Target **jayrohrs.github.io**, Proxy status **DNS only** (grey cloud). Save.
2. Do not add wildcard records, and do not change the existing private subdomain's records.
3. Optional: send the bare `jbase.app` to `www`. If the bare domain is not used for anything else, add a Cloudflare **Redirect Rule** (free): when hostname equals `jbase.app`, redirect to `https://www.jbase.app` (301, keep path).

## 3. Back on GitHub
- Settings → Pages: wait for "DNS check successful" (minutes to a few hours), then tick **Enforce HTTPS**.
- Check `https://www.jbase.app/` loads, and that the Start a project page opens your email program.

## 4. Afterwards (ask Claude, or do it yourself)
- In `content/site.json` set `"site_url": "https://www.jbase.app"`, run `node build.mjs` and `node scripts/check.mjs`, push. This switches on canonical links and `sitemap.xml`.
- The checker currently rejects the word "jBase" on pages; that check needs relaxing for this domain. (Claude can do this when you ask.)

## Later, optional: turning the Cloudflare proxy on (orange cloud)
If you want Cloudflare's proxy in front, first set SSL/TLS mode to **Full (strict)**, then switch the `www` record to Proxied. If you see redirect loops, the SSL mode is the usual cause. Not needed for a working site.
