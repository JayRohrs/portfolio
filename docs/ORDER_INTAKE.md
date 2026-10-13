# Start a project: how the request works

The "Start a project" page (`start.html`) is a static form. There is no backend and no outside service.

## What happens today
1. The visitor fills in the form. The browser checks the required fields (`assets/intake.js` → `Intake.validate`).
2. **Open my email program** builds a plain-text request and opens a `mailto:` link addressed to the email in `content/site.json` (`person.email`). The visitor presses Send in their own email program.
3. **Copy request text** copies the same text, for people without a mail app.
4. The page never says a message was sent, because it cannot know. Nothing is stored or transmitted by the site.

Limits: very long requests can exceed what some email programs accept in a `mailto:` link. The copy button is the fallback.

## Request shape (JSON)
`Intake.toJSON(fields)` returns this object. The site itself does not send it anywhere; it exists so a later system can use the same shape.

| Field | Type | Required | Notes |
|---|---|---|---|
| `version` | number | yes | Currently `1`. Increase it if fields change. |
| `name` | string | yes | |
| `organisation` | string | no | Empty string if not given. |
| `email` | string | yes | Checked for a basic name@domain shape. |
| `phone` | string | no | Optional; never shown anywhere else. |
| `track` | string | yes | One of `it`, `av`, `both`, `not-sure`. |
| `need` | string | yes | Free text, plain. |
| `timeline` | string | no | One of the options in `content/site.json` → `client.start.timelines`, or empty. |
| `budget` | string | no | A range label from `client.start.budgets`, or empty. Ranges only, never exact figures. |
| `heard_from` | string | no | Free text. |
| `created` | string | yes | ISO 8601 time the request text was built in the visitor's browser. |

Example (made-up data):

```json
{
  "version": 1,
  "name": "Sam Example",
  "organisation": "Example Church",
  "email": "sam@example.org",
  "phone": "",
  "track": "both",
  "need": "Livestream setup and a Microsoft 365 tidy-up.",
  "timeline": "Within a month",
  "budget": "$1,000 to $5,000",
  "heard_from": "A friend",
  "created": "2026-01-01T00:00:00.000Z"
}
```

The email subject is `Project request: <track label> (<name>)`. The body lists the same fields in plain text.

## Later: private admin intake (design only)
Nothing here is built, and no admin code, addresses or secrets belong in this public repo.

Idea: a private admin system could receive these requests, list them, and track each one (new → talked → first step agreed → delivered → followed up).

- **Receiving.** The simplest route is to read the emailed requests, since the body is a fixed, predictable plain-text layout, and turn each into the JSON shape above. A later step could let the site hand the JSON to a small private endpoint, but that would be a deliberate change: it would add a server that contacts an outside address, so it needs Jay's explicit approval and a privacy note on the page first.
- **Listing and tracking.** Each request gets a status, a date, and notes that stay private. The `version` field lets the admin system handle older requests after the form changes.
- **Privacy.** Requests contain real contact details, so they stay out of this repo, out of screenshots and out of examples. Keep only made-up data here.
