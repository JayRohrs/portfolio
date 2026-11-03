# Questions for Jay

Nothing below is shown on the live site until it is answered. Keep unanswered facts here; leave their `content/site.json` fields empty so the update validator passes.

## Services
1. **Which services do you want listed under each track?** I drew the lists only from your public résumés and `content/site.json`:
   - IT & Systems: Microsoft 365 administration; email and sign-in security (MFA, phishing and spam); everyday support and equipment; Restaurant365 automation checks; documentation and handover.
   - AV & Production: livestreams and hybrid events; church and community AV; field production and documentary; editing and delivery; music, performance and short commercials.
   The approved AV V6.1 and IT V4.9 public PDFs are complete and were published through PR #5. A general service-sheet draft is in `docs/SERVICE_SHEET_DRAFT.md` for review; final service selection and wording still need Jay's answers.
   [NEEDS JAY: Which offerings should lead the service sheet, and which should be removed or narrowed?]
2. **Local and cloud AI.** Nothing in your résumés or site.json describes AI services beyond "AI-assisted research and ideation with human editorial judgment" and your automation checks. I did not list "practical use of local and cloud AI" as a service. What have you actually done or want to offer?
3. **The three "AI where they meet" examples** (captioned and searchable video archives; reports that watch business data; written plus produced how-to material) are shown as "Ideas worth a first conversation", not as past work. Keep, reword or remove?
4. **Proof for IT & Systems.** There is no case study for the IT track, so its proof link is the IT résumé PDF. Is there something you can show (a written guide, a before/after, a named approach) that is safe to make public?
5. **"Restaurant groups" and "accounting-system data reporting".** The IT résumé supports Restaurant365 automation checks, not "data reporting". Do you want reporting listed? In what words?

## Contact and reach
6. **Preferred contact route** (email only, email plus LinkedIn, a booking link). Today: the form opens the visitor's email program; the address is `jayrohrs@gmail.com`.
7. **Phone number:** resolved by the public-site rule: no phone number is shown.
8. **Service area wording:** approved on 2026-10-14: Denver and remote, with willingness to travel. `person.service_area` is "Denver and remote; travel by arrangement" and is shown on Contact and Services pages.
9. **Domain name:** `https://www.jbase.app` served the portfolio on 2026-10-14. `site_url` is set to that address; canonical links and `sitemap.xml` are built.

## Wording and facts
10. **Prices:** "Quote on request" confirmed by Jay on 2026-10-14. No rates or travel charges have been supplied.
11. **How it works** (talk → small first step → deliver → follow up) and the "small paid first step" idea are my plain-language description of a sensible process. Does it match how you work?
12. **About text.** Only your approved About text is live. A client-focused draft for your approval is in `docs/ABOUT_DRAFT.md`.
13. **Résumés:** approved AV V6.1 and IT V4.9 public PDFs are current. The old replacement-pending notes have been replaced with approved-edition notes, which remain internal.
14. **Art of War Comic Con year** and the **Wall Street Pillow Fight** link: still open from before (see `TODO.md`).
15. **Budget ranges on the form** (under $1,000 … more than $15,000) are choices for the visitor to pick from, not prices you charge. Change the bands if they do not suit your work: `client.start.budgets`.

## Request pages, confirmation page and search (new in this PR)
Nothing here is shown on the site. Each item below is a decision I did not make for you.

16. **Is the first step a paid, quoted job?** The request pages say "a small first step" and "Quote on request". They do not say "paid", give a price, or promise a quote before work starts. [NEEDS JAY: is the first step paid and quoted up front? Say yes and I will add that sentence.]
17. **The examples of a small first step** (`client.requests[].examples` in `content/site.json`). I built each one from the service types you already approved (for example "Tidy up user accounts", "Livestream one event", "Edit one short video"). Please cut, reword or add. The "Both" examples ("Stream one event and write the setup down", "Put a how-to on paper and on video") combine two approved services and are the ones most worth checking.
18. **Reply time.** The "After you send your request" page makes no promise about how fast you reply. [NEEDS JAY: a reply-time sentence, such as "I reply within N working days"? Only if you will keep it.]
19. **Where should "AI where they meet" send people?** Its Start button goes to the "Both" request page. Is that right, or should it go to "Not sure yet"?
20. **Is `www.jbase.app` live?** I cannot reach it from here. If it is not serving this site, the canonical links and sitemap point visitors and search engines at the wrong place. If it is not live, set `site_url` back to an empty string and rebuild (the validator allows both).
21. **Search Console.** After the domain is live, you can verify it in Google Search Console and submit `https://www.jbase.app/sitemap.xml`. That needs your account, so I have not done it and the site has no verification tag.
22. **Local-business details in search results.** The structured data lists only your name, email, Denver, Colorado, your LinkedIn and YouTube, "Denver" as the area served, and the service names and descriptions. It has no street address, phone, opening hours, price range, reviews or ratings, because none are in `content/site.json`. Keep it that way, or tell me which you want added (each needs a fact from you).
23. **Page titles for search.** The IT and AV pages use "IT & Systems Support for Small Business in Denver" and "AV & Livestream Production in Denver" (`seo_title` in `content/site.json`). They use only words from your services pages. Reword if they do not sound like you.

## Design pass (new in this PR)
Nothing here is shown on the site. The new design works without any of these answers; each would let a section do more.

24. **A picture for the IT & Systems track.** The AV track has video stills on every page; the IT track has none, so its card uses a small line icon. Is there something you own and are happy to make public: a photo of a tidy office setup you built, a screenshot of a guide you wrote (with private details removed), or a simple diagram? Nothing has been added in its place.
25. **The big headline on the home page.** The largest line is now your approved hero line ("Technology that keeps working, and video that tells your story."), with "Jay Rohrs · Denver, Colorado" in small capitals above it. Your name is still in the header and page title. Keep that, or put your name back as the biggest line?
26. **"Hello, I'm Jay"** is the heading over the About preview on the home page. It is a heading only, not a claim. Keep it, or go back to plain "About"?
27. **Track order.** AV & Production now comes first and IT & Systems second, on the home page and the Services page, because the video previews belong to the AV track. Say if you want IT first.
28. **Shorter card lines (optional).** Project cards show the full approved "why it matters" sentence. A one-line version of each (for example under 15 words) would let the home page show the previews in a tighter grid. Only if you want to write them; nothing is shortened for you.
29. **Brain-style artwork.** The faint line-and-node pattern behind the page headings is an original drawing made for this site in the spirit of the brain-style imagery you like; no outside image was used. If you have brain-style artwork that you own or have licensed, send it and say where it may be used.
30. **Night Hike thumbnail.** One video ("Night Hike — Inside the Silo") has no still on the site because its thumbnail could not be downloaded from the build machine, so it shows a plum placeholder. Running `node scripts/fetch-thumbs.mjs` and then `node build.mjs` on a normal internet connection should fill it in.
