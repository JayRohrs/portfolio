# Phone and accessibility check

Checked 2026-11-05 on a local copy of the repo (same files GitHub Pages publishes). Tool: headless Chromium (Playwright). Pages: all 21 (12 top-level, 5 projects, 3 services, plus 404). Design, copy, images and layout were not changed.

## Result in one line
One real defect found and fixed (unreadable footer "Start a project" button). Everything else on the checklist passed or is a note below.

## Findings

| Page | What is wrong | How serious | Exact fix | Fixed? |
|---|---|---|---|---|
| All 21 pages (footer) | The footer "Start a project" button had text `#b9cfff` on a `#a9c4ff` background: contrast **1.12:1** (needs 4.5:1). The words were nearly invisible. On hover the text turned white on a white background (1:1). | Annoying (the button is still tappable, but unreadable) | `assets/style.css`: footer primary button now uses the same dark text colour (`--ink-deep`, `#0e0b17`) the other buttons use. Contrast is now **11.15:1** (hover **19.46:1**). Same blue button, only the text is readable. | Yes |
| All pages at 160 px wide (= 200% zoom on a 320 px phone) | Page is 19 to 109 px wider than the screen, so it scrolls sideways. At 640 px (= 200% zoom on a desktop) and at 320 px there is no sideways scroll. | Cosmetic (the web rule requires 320 px, which passes; 160 px is stricter than required) | Not applied. Fixing it means allowing text to wrap or shrink differently in the hero, which could change the look. | **Needs Jay's eye** |
| `downloads/headshot.png` | 2.6 MB. No page uses it (pages use `assets/images/headshot.jpg`, 148 KB). It only costs anything if someone downloads it. | Cosmetic | Replace with a smaller file if Jay wants. Not touched. | No (his file) |
| External links (41, including YouTube, LinkedIn, one news article) | Could not be tested: this cloud environment blocks outside sites (curl returned 000). | Unknown | Re-run the link command below from a normal computer. | Not testable here |

## What passed (numbers)
- **Sideways scrolling:** 0 pages at 320, 375, 390, 430, 768 and 1280 px (also at 640 px).
- **Tap targets under 44 px:** 0 real ones. The audit lists 30 radio buttons at 24x24 px on the start pages; these are false alarms because each sits in a 44 px high row whose label is also tappable (measured 270x44). Inline links inside sentences are exempt under WCAG 2.5.8.
- **Images:** none overflow or stretch; every image has an `alt` attribute.
- **Page language:** `lang` present on all pages. Title and meta description present on all pages. Viewport meta and favicon present.
- **Headings:** exactly one h1 per page, no skipped levels.
- **Landmarks:** one `main`, plus header, nav and footer on every page. Skip link is the first Tab stop on every page, appears on screen and jumps to `main`.
- **Forms:** every input, select and textarea has a label. No duplicate IDs. No broken `#` anchors. No unnamed links or buttons.
- **Keyboard focus:** tabbing through the first 45 controls on each page, every one shows a visible outline or ring. Skipped none.
- **Text contrast:** every visible text node checked against its background, 0 below 4.5:1 (3:1 for large text) after the fix. Lowest pair in `scripts/contrast.mjs`: **6.92:1**.
- **Internal links and files:** 39 internal URLs (pages, CSS, JS, images) all returned **200**.
- **Colour modes:** the site has one dark theme only (by Jay's decision). Light and dark system settings give identical pages (background `rgb(14,11,23)`).
- **Reduced motion:** tested with reduced motion on; no layout change.
- **Print:** prints with no sideways overflow; the header, footer and filter bars are hidden by the print rules.
- **Performance (home page):** HTML 30 KB, CSS 35 KB, JS 2.5 KB, 7 video thumbnails 12 to 23 KB each (about 120 KB total), one 3.5 KB SVG. The hero image is not an issue. Only one render-blocking file: `style.css` (normal for a static site). No third-party scripts or fonts. The `assets` folder is 348 KB in total.

## Before and after
| Check | Before | After |
|---|---|---|
| Buttons below 4.5:1 contrast (one per page) | 21 | **0** |
| Text elements below contrast minimum | 21 | **0** |
| Real tap targets under 44 px | 0 | 0 |
| Sideways scroll, 320 to 1280 px | 0 | 0 |
| Missing alt, lang, title, description, labels | 0 | 0 |
| `node scripts/check.mjs` | 1415 checks, 0 problems | 1415 checks, 0 problems |

## Commands to repeat this
```bash
node build.mjs && node scripts/check.mjs
node scripts/contrast.mjs
python3 -m http.server 8123          # serve the site, then run a Playwright script against http://localhost:8123/
# external links, from a computer with internet:
grep -ho 'https\?://[^"]*' *.html projects/*.html services/*.html | sort -u | while read u; do echo "$(curl -s -o /dev/null -m 15 -w '%{http_code}' -A 'Mozilla/5.0' "$u") $u"; done
```
The browser checks were Playwright (Chromium) scripts that, for each page and each width (320, 375, 390, 430, 768, 1280, plus 640 and 160 for zoom), measured page width vs screen width, size of every link and button, image shapes, text colour against background, and Tab order focus rings.

## UNVERIFIED (headless Chrome cannot prove these)
- Real iPhone Safari and Android Chrome behaviour (address bar resizing, safe areas, touch scrolling, form autofill).
- Screen readers (VoiceOver, TalkBack, NVDA): reading order and wording were not heard.
- Whether the 41 external links work today (blocked in this environment).
- Pinch zoom on a real phone and the system "larger text" setting.
- Whether `www.jbase.app` serves exactly these files right now (checked the repo copy, not the live site).
- Print on real paper or a real PDF viewer (only print styles were emulated).
- Video playback (videos load on click and were not played).
