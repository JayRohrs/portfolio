#!/usr/bin/env node
// Measures WCAG contrast for the text/background pairs used in assets/style.css.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const C = { plumDeep: "#2a1220", plum: "#6b1f3a", rust: "#c0562a", rustText: "#9c3f17", clay: "#a8574a", gold: "#d9a441", white: "#ffffff", tint: "#faf4f0", muted: "#5a4650", strip: "#f3e6ec", err: "#a4161a", errDark: "#7d1014", errBg: "#fdf1f1", fieldBorder: "#7a6570" };
const pairs = [
  ["body text on white", C.plumDeep, C.white], ["body text on tint", C.plumDeep, C.tint],
  ["links (plum) on white", C.plum, C.white], ["links (plum) on tint", C.plum, C.tint],
  ["muted text on white", C.muted, C.white], ["muted text on tint", C.muted, C.tint],
  ["eyebrow/headline (rust text) on white", C.rustText, C.white], ["rust text on tint", C.rustText, C.tint],
  ["primary button: white on plum", C.white, C.plum], ["gold button: plum-deep on gold", C.plumDeep, C.gold],
  ["figures: gold on plum-deep", C.gold, C.plumDeep], ["strip labels on plum-deep", C.strip, C.plumDeep],
  ["band text: white on plum", C.white, C.plum], ["band availability: gold on plum", C.gold, C.plum],
  ["footer text on plum-deep", C.strip, C.plumDeep], ["footer links white on plum-deep", C.white, C.plumDeep],
  ["error text on white", C.err, C.white], ["error summary text on error bg", C.errDark, C.errBg],
  ["form field border (non-text) on white", C.fieldBorder, C.white], ["focus ring (rust text) on white (non-text)", C.rustText, C.white],
  ["focus ring gold on plum-deep (non-text)", C.gold, C.plumDeep],
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
