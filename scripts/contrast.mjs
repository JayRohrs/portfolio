#!/usr/bin/env node
// Measures WCAG contrast for the text/background pairs used in assets/style.css.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const C = { plumDeep: "#2a1220", plum: "#6b1f3a", blueText: "#395f9f", berryButton: "#923a5c", lilac: "#c5a2ce", white: "#ffffff", tint: "#f4f1f8", muted: "#5a4650", strip: "#f3e6ec", err: "#a4161a", errDark: "#7d1014", errBg: "#fdf1f1", fieldBorder: "#7a6570", dark: "#0d0812", darkCard: "#211426", darkText: "#f1e9ee", darkHeading: "#fff8fb", darkMuted: "#e0ccd8", darkLink: "#c3d5ff", darkBerryLink: "#efb9cd", darkError: "#ffb5b8" };
const pairs = [
  ["body text on white", C.plumDeep, C.white], ["body text on tint", C.plumDeep, C.tint],
  ["links (plum) on white", C.plum, C.white], ["links (plum) on tint", C.plum, C.tint],
  ["muted text on white", C.muted, C.white], ["muted text on tint", C.muted, C.tint],
  ["eyebrow/headline (blue text) on white", C.blueText, C.white], ["blue text on tint", C.blueText, C.tint],
  ["primary button: white on blue", C.white, C.blueText], ["second-track button: white on berry", C.white, C.berryButton],
  ["accent button: plum-deep on lilac", C.plumDeep, C.lilac],
  ["figures: lilac on plum-deep", C.lilac, C.plumDeep], ["strip labels on plum-deep", C.strip, C.plumDeep],
  ["band text: white on plum", C.white, C.plum], ["band availability: lilac on plum", C.lilac, C.plum],
  ["footer text on plum-deep", C.strip, C.plumDeep], ["footer links white on plum-deep", C.white, C.plumDeep],
  ["error text on white", C.err, C.white], ["error summary text on error bg", C.errDark, C.errBg],
  ["form field border (non-text) on white", C.fieldBorder, C.white], ["focus ring blue on white (non-text)", C.blueText, C.white],
  ["focus ring lilac on plum-deep (non-text)", C.lilac, C.plumDeep],
  ["section text on dark plum", C.darkText, C.dark], ["section heading on dark plum", C.darkHeading, C.dark],
  ["card text on dark plum", C.darkText, C.darkCard], ["card muted text on dark plum", C.darkMuted, C.darkCard],
  ["links on dark plum", C.darkLink, C.dark], ["links on dark cards", C.darkLink, C.darkCard],
  ["berry links on dark cards", C.darkBerryLink, C.darkCard],
  ["form errors on dark plum", C.darkError, C.dark],
  ["required labels on dark plum", C.darkBerryLink, C.dark], ["optional labels on dark plum", C.darkMuted, C.dark],
];
let lowest = null;
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  const nonText = /non-text/.test(name);
  const need = nonText ? 3 : 4.5;
  console.log(`${r.toFixed(2).padStart(6)}:1  ${r >= need ? "ok  " : "FAIL"}  ${name}`);
  if (!nonText && (!lowest || r < lowest[0])) lowest = [r, name];
  if (r < need) process.exitCode = 1;
}
console.log(`\nLowest text pair: ${lowest[0].toFixed(2)}:1 (${lowest[1]})`);
