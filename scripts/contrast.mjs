#!/usr/bin/env node
// Measures WCAG contrast for the colour tokens in assets/style.css.
// Tokens are read from the stylesheet itself (the :root tokens, a
// prefers-color-scheme: dark block if there is one, and the --od-* "on-dark" band tokens),
// so this check cannot drift from the real colours. Exits non-zero on any failure.
// Text needs 4.5:1 (AA); non-text UI (borders, focus rings) needs 3:1.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/style.css"), "utf8");
const block = (re) => {
  const m = css.match(re);
  if (!m) throw new Error(`token block not found: ${re}`);
  return Object.fromEntries([...m[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((x) => [x[1], x[2].toLowerCase()]));
};
const light = block(/^:root\s*\{([\s\S]*?)\n\}/m);
const hasDark = /prefers-color-scheme:\s*dark/.test(css);
const dark = hasDark ? { ...light, ...block(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/) } : null;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [label, foreground token, background token, "text" | "ui"]
const themed = [
  ["body text on page", "text", "bg"], ["body text on tinted section", "text", "bg-alt"],
  ["body text on card", "text", "surface"], ["body text on soft panel", "text", "surface-2"],
  ["headings on card", "heading", "surface"], ["headings on page", "heading", "bg"],
  ["muted text on page", "muted", "bg"], ["muted text on tinted section", "muted", "bg-alt"],
  ["muted text on card", "muted", "surface"], ["muted text on soft panel", "muted", "surface-2"],
  ["links on page", "link", "bg"], ["links on tinted section", "link", "bg-alt"],
  ["links on card", "link", "surface"], ["links on soft panel", "link", "surface-2"],
  ["link hover on card", "link-hover", "surface"],
  ["eyebrow on page", "eyebrow", "bg"], ["eyebrow on tinted section", "eyebrow", "bg-alt"],
  ["eyebrow on card", "eyebrow", "surface"], ["eyebrow on soft panel", "eyebrow", "surface-2"],
  ["AV accent text on card", "av-text", "surface"], ["AV accent text on soft panel", "av-text", "surface-2"],
  ["IT accent text on card", "it-text", "surface"], ["IT accent text on soft panel", "it-text", "surface-2"],
  ["primary button", "btn-text", "btn-bg"], ["primary button hover", "btn-text", "btn-hover"],
  ["AV primary button", "av-btn-text", "av-btn-bg"], ["AV primary button hover", "av-btn-text", "av-btn-hover"],
  ["secondary button on page", "btn2-text", "bg"], ["secondary button on tinted section", "btn2-text", "bg-alt"],
  ["secondary button on soft panel", "btn2-text", "surface-2"], ["secondary button hover (filled)", "btn2-hover-text", "btn2-text"],
  ["form field text", "text", "field-bg"], ["form error text on card", "err", "surface"],
  ["error summary text", "err-strong", "err-bg"], ["video-count badge", "badge-text", "badge-bg"],
  ["form field border", "field-border", "field-bg", "ui"], ["form field border on card", "field-border", "surface", "ui"],
  ["focus ring on page", "focus", "bg", "ui"], ["focus ring on card", "focus", "surface", "ui"],
  ["focus ring on tinted section", "focus", "bg-alt", "ui"],
];
// On-dark bands: same in both themes. od-bg-light is the lightest point of the band gradient.
const onDark = [];
for (const bg of ["od-bg", "od-bg-deep", "od-bg-light"]) {
  onDark.push(
    [`band text on ${bg}`, "od-text", bg], [`band heading on ${bg}`, "od-heading", bg],
    [`band muted text on ${bg}`, "od-muted", bg], [`band links on ${bg}`, "od-link", bg],
    [`band eyebrow on ${bg}`, "od-eyebrow", bg], [`highlight figures on ${bg}`, "od-figure", bg],
    [`secondary button (white) on ${bg}`, "#ffffff", bg],
    [`focus ring on ${bg}`, "od-focus", bg, "ui"],
  );
}
onDark.push(
  ["band primary button", "od-btn-text", "od-btn-bg"], ["band primary button hover", "od-btn-text", "od-btn-hover"],
  ["footer accent button", "ink-deep", "lilac"], ["footer accent button hover", "ink-deep", "#ffffff"],
  ["band secondary button hover", "ink-deep", "#ffffff"], ["highlight figures on band", "av-text", "bg-alt"],
  ["service links in hero", "od-heading", "od-bg-light"],
);

let lowest = null;
const run = (title, tokens, pairs) => {
  console.log(`\n${title}`);
  for (const [name, f, b, kind = "text"] of pairs) {
    const fg = f.startsWith("#") ? f : tokens[f];
    const bg = b.startsWith("#") ? b : tokens[b];
    if (!fg || !bg) { console.log(`  MISSING token for ${name} (${f} / ${b})`); process.exitCode = 1; continue; }
    const r = ratio(fg, bg);
    const need = kind === "ui" ? 3 : 4.5;
    console.log(`${r.toFixed(2).padStart(7)}:1  ${r >= need ? "ok  " : "FAIL"}  ${name}${kind === "ui" ? " (non-text)" : ""}  ${fg} on ${bg}`);
    if (kind === "text" && (!lowest || r < lowest[0])) lowest = [r, `${title}: ${name}`];
    if (r < need) process.exitCode = 1;
  }
};
run(hasDark ? "Light theme" : "Page colours (one dark theme)", light, themed);
if (dark) run("Dark theme (prefers-color-scheme: dark)", dark, themed);
run("On-dark bands (hero, page heads, video wall, contact band, footer)", light, onDark);
console.log(`\nLowest text pair: ${lowest[0].toFixed(2)}:1 (${lowest[1]})`);
