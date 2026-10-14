# Portfolio site — design brief for the builder

Source: Jay's INFORMATION_ARCHITECTURE.md (homepage + portfolio layout) and the AV resume look Jay picked on 2026-10-12. All words, links and projects come from content/site.json — don't add claims.

## Look
- Warm and professional, matching the AV resume: deep plum (#2a1220 / #6b1f3a), rust (#c0562a), clay (#a8574a), gold (#d9a441) on white; serif headings, clean sans-serif body.
- The thin plum–rust–clay–gold segmented rule is the brand device: header and a few key places, not under every heading.
- Readable and well balanced first: generous text size and spacing, works at 390 px phone width, no sideways scroll, 44 px tap targets, good contrast, real headings and alt text.
- No autoplay audio; no big YouTube player above the fold. Videos load only when clicked (thumbnail first, privacy-enhanced youtube-nocookie embeds).

## Homepage (in order)
1. Header: "Jay Rohrs" wordmark, menu (Work · About · Résumé · Contact), contact button.
2. Hero: name, headline, one-sentence statement; buttons "View Selected Work" and "Download AV Résumé", small link to the systems résumé. Right side: a strong project image (not the headshot).
3. Credibility strip: the four figures in site.json.
4. Featured work: grid of the featured projects. Each card: image, title, type, Jay's role, one "why it matters" line, "View case study". Hide any card with no video yet (Drone until Jay picks clips).
5. Capabilities: five blocks, one evidence sentence each.
6. Current practice: narrow band (site.json current_practice + availability).
7. Additional proof: smaller cards (Belly Dance with Sadie, Epidemia).
8. "Production is also a system": short section linking to the systems résumé.
9. About preview: headshot here only, two short paragraphs, small timeline.
10. Contact: the CTA line, "Contact Jay" (email) and "Download Résumé".

## Pages
- Work: filter bar (Featured · Documentary · Live Production · Music · Commercial · Aerial · Archive) that still reads fine with JavaScript off; each project answers what it was, what Jay did, what it proves, why it matters.
- One case-study page per featured project (built from site.json).
- About, Résumé (both PDF downloads), Contact.

## Build
- Plain static site (no server), deployable free on GitHub Pages; one content file (content/site.json) drives every page so Jay or a private admin system can propose updates without touching code.
- Small, fast, no tracking scripts, no cookies banner needed.
