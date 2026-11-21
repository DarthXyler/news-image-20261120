// Draws entry.png: a one-page summary of the world news of Friday 20 November 2026.
// Builds an SVG poster, then rasterises it to a 1024x1024 PNG with headless Chrome/Edge.
// Usage: node tools/render.mjs            (writes ../entry.png and tools/poster.svg)
import { writeFileSync, existsSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const W = 1024, H = 1024;

const C = {
  ink: "#0f1b2d", paper: "#f4efe4", card: "#ffffff", red: "#c8102e",
  gold: "#f2b705", muted: "#4a5568", line: "#d8cfbd",
};
const SANS = "Arial, Helvetica, sans-serif";
const NARROW = "'Arial Narrow', Arial, sans-serif";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function text(x, y, s, { size = 24, weight = 700, fill = C.ink, family = SANS, anchor = "start", fit, spacing } = {}) {
  const extra = [
    fit ? `textLength="${fit}" lengthAdjust="spacingAndGlyphs"` : "",
    spacing ? `letter-spacing="${spacing}"` : "",
  ].join(" ");
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
}

// ---------- masthead ----------
function masthead() {
  return `
  <rect x="0" y="0" width="${W}" height="132" fill="${C.ink}"/>
  ${text(W / 2, 40, "THE WORLD TODAY", { size: 26, fill: C.gold, anchor: "middle", spacing: 8 })}
  ${text(W / 2, 112, "FRIDAY 20 NOVEMBER 2026", { size: 66, fill: "#fff", anchor: "middle", fit: 980 })}
  <rect x="0" y="132" width="${W}" height="6" fill="${C.red}"/>`;
}

// ---------- lead: Kyiv ----------
function lead() {
  const x = 16, y = 148, w = 992, h = 300;
  const ix = x, iw = 540; // illustration area
  const missile = (x1, y1, cx, cy, x2, y2) => `
    <path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" stroke="#ffd27a" stroke-width="3" fill="none" stroke-dasharray="10 6" opacity="0.9"/>
    <circle cx="${x2}" cy="${y2}" r="7" fill="#ff7a1a"/><circle cx="${x2}" cy="${y2}" r="13" fill="#ff7a1a" opacity="0.35"/>`;
  const smoke = (cx, cy, s) => `
    <g fill="#5b6270" opacity="0.85">
      <circle cx="${cx}" cy="${cy}" r="${18 * s}"/><circle cx="${cx + 16 * s}" cy="${cy - 22 * s}" r="${22 * s}"/>
      <circle cx="${cx - 10 * s}" cy="${cy - 48 * s}" r="${26 * s}"/><circle cx="${cx + 14 * s}" cy="${cy - 78 * s}" r="${30 * s}"/>
    </g>`;
  const fire = (cx, cy) => `
    <path d="M${cx - 22} ${cy} Q${cx - 18} ${cy - 30} ${cx - 4} ${cy - 46} Q${cx} ${cy - 24} ${cx + 10} ${cy - 36} Q${cx + 24} ${cy - 16} ${cx + 22} ${cy} Z" fill="#ff5a1f"/>
    <path d="M${cx - 10} ${cy} Q${cx - 6} ${cy - 18} ${cx + 2} ${cy - 26} Q${cx + 12} ${cy - 10} ${cx + 10} ${cy} Z" fill="#ffd23f"/>`;
  // bridge deck from left to right with a broken gap in the middle
  const deckY = y + 210;
  const pillars = [90, 200, 330, 450].map((px) => `<rect x="${ix + px - 8}" y="${deckY}" width="16" height="70" fill="#2b3445"/>`).join("");
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2440"/><stop offset="1" stop-color="#4b3a52"/>
    </linearGradient>
  </defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.ink}"/>
  <clipPath id="leadclip"><rect x="${ix}" y="${y}" width="${iw}" height="${h}" rx="10"/></clipPath>
  <g clip-path="url(#leadclip)">
    <rect x="${ix}" y="${y}" width="${iw}" height="${h}" fill="url(#sky)"/>
    <rect x="${ix}" y="${deckY + 40}" width="${iw}" height="${h}" fill="#2d6a9f"/>
    <path d="M${ix} ${deckY + 60} q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#7fb3df" stroke-width="3" fill="none"/>
    <path d="M${ix} ${deckY + 88} q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#7fb3df" stroke-width="3" fill="none"/>
    ${pillars}
    <rect x="${ix}" y="${deckY - 14}" width="250" height="16" fill="#3a4559"/>
    <path d="M${ix + 250} ${deckY - 14} l18 6 l-10 10 l-8 0 Z" fill="#3a4559"/>
    <rect x="${ix + 300}" y="${deckY - 14}" width="${iw - 300}" height="16" fill="#3a4559"/>
    <path d="M${ix + 300} ${deckY - 14} l-16 8 l8 8 l8 0 Z" fill="#3a4559"/>
    <path d="M${ix + 40} ${deckY - 14} Q${ix + 145} ${deckY - 80} ${ix + 250} ${deckY - 14}" stroke="#3a4559" stroke-width="8" fill="none"/>
    <path d="M${ix + 300} ${deckY - 14} Q${ix + 405} ${deckY - 80} ${ix + 510} ${deckY - 14}" stroke="#3a4559" stroke-width="8" fill="none"/>
    ${smoke(ix + 275, deckY - 20, 1.1)}
    ${fire(ix + 275, deckY - 6)}
    ${smoke(ix + 110, deckY - 40, 0.6)}
    ${missile(ix + 540, y + 20, ix + 420, y + 10, ix + 300, y + 120)}
    ${missile(ix + 540, y + 70, ix + 470, y + 40, ix + 400, y + 150)}
    ${missile(ix + 540, y + 120, ix + 200, y + 30, ix + 150, y + 140)}
    <!-- map pin on Kyiv -->
    <g transform="translate(${ix + 70} ${y + 40})">
      <path d="M0 0 a26 26 0 1 1 52 0 q0 22 -26 52 q-26 -30 -26 -52 Z" fill="${C.red}" stroke="#fff" stroke-width="3"/>
      <circle cx="26" cy="0" r="9" fill="#fff"/>
      <rect x="60" y="-20" width="96" height="40" rx="6" fill="#fff"/>
      ${text(108, 10, "KYIV", { size: 28, anchor: "middle" })}
    </g>
  </g>
  <rect x="${x + iw + 18}" y="${y + 22}" width="210" height="34" rx="4" fill="${C.red}"/>
  ${text(x + iw + 30, y + 47, "UKRAINE · LEAD", { size: 22, fill: "#fff" })}
  ${text(x + iw + 18, y + 114, "RUSSIA POUNDS", { size: 52, fill: "#fff", fit: 414 })}
  ${text(x + iw + 18, y + 172, "KYIV OVERNIGHT", { size: 52, fill: "#fff", fit: 414 })}
  ${text(x + iw + 18, y + 224, "8 killed across Ukraine;", { size: 34, fill: C.gold, fit: 414 })}
  ${text(x + iw + 18, y + 266, "3 Dnipro bridges hit", { size: 34, fill: C.gold })}`;
}

// ---------- tile icons (each drawn in a 110x110 box at 0,0) ----------
const icons = {
  cop: () => `
    <circle cx="48" cy="58" r="40" fill="#2f80c2"/>
    <path d="M22 40 q12 -10 22 0 q8 10 0 20 q-10 8 -4 22 q-14 -6 -18 -20 q-4 -12 0 -22 Z M58 30 q16 2 22 18 q-10 4 -16 -2 q-8 -4 -6 -16 Z M60 70 q14 -4 20 6 q-6 12 -18 12 q-6 -8 -2 -18 Z" fill="#4caf50"/>
    <rect x="86" y="12" width="14" height="66" rx="7" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
    <rect x="90" y="34" width="6" height="44" fill="${C.red}"/>
    <circle cx="93" cy="84" r="11" fill="${C.red}" stroke="${C.ink}" stroke-width="3"/>
    <g transform="translate(4 70)">
      <rect x="0" y="0" width="30" height="38" rx="4" fill="#222"/>
      <rect x="0" y="10" width="30" height="4" fill="#666"/><rect x="0" y="24" width="30" height="4" fill="#666"/>
      <line x1="-4" y1="-4" x2="34" y2="42" stroke="${C.red}" stroke-width="6" stroke-linecap="round"/>
    </g>`,
  cyclone: () => `
    <rect x="0" y="0" width="110" height="110" rx="8" fill="#2d6a9f"/>
    <path d="M0 0 L40 0 Q30 30 48 54 Q36 82 44 110 L0 110 Z" fill="#c9a96e"/>
    <g transform="translate(62 52)" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round">
      <path d="M0 -14 A14 14 0 0 1 14 0 A30 30 0 0 1 -16 30"/>
      <path d="M0 14 A14 14 0 0 1 -14 0 A30 30 0 0 1 16 -30"/>
      <circle r="6" fill="#fff" stroke="none"/>
    </g>`,
  summit: () => `
    <g transform="translate(30 22) rotate(-4)">
      <rect width="52" height="66" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
      <rect x="8" y="10" width="36" height="5" fill="${C.ink}"/>
      <rect x="8" y="24" width="36" height="3" fill="#999"/><rect x="8" y="32" width="36" height="3" fill="#999"/>
      <rect x="8" y="40" width="28" height="3" fill="#999"/>
      <path d="M8 56 q8 -8 14 0 q6 -8 14 0" stroke="#1a4fa0" stroke-width="2" fill="none"/>
    </g>
    <!-- US flag -->
    <g transform="translate(0 6)"><rect width="34" height="22" fill="#fff" stroke="#333"/>
      <rect y="0" width="34" height="3" fill="#b22234"/><rect y="6" width="34" height="3" fill="#b22234"/><rect y="12" width="34" height="3" fill="#b22234"/><rect y="18" width="34" height="3" fill="#b22234"/>
      <rect width="14" height="12" fill="#3c3b6e"/></g>
    <!-- China flag -->
    <g transform="translate(0 80)"><rect width="34" height="22" fill="#de2910"/>
      <path d="M8 4 l2 5 l5 0 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 l5 0 Z" fill="#ffde00"/></g>
    <!-- Russia flag -->
    <g transform="translate(76 80)"><rect width="34" height="8" fill="#fff" stroke="#333" stroke-width="0.5"/><rect y="7" width="34" height="8" fill="#0039a6"/><rect y="14" width="34" height="8" fill="#d52b1e"/></g>
    <!-- plane leaving -->
    <g transform="translate(92 14) rotate(-30)" fill="${C.ink}">
      <path d="M-14 0 L14 0 L18 -2 L18 2 L14 0 Z M-14 -2 h28 v4 h-28 Z"/>
      <path d="M-2 0 L-10 -12 L-4 -12 L6 0 Z M-2 0 L-10 12 L-4 12 L6 0 Z"/>
    </g>`,
  court: () => `
    <g stroke="${C.ink}" stroke-width="4" fill="none">
      <line x1="40" y1="14" x2="40" y2="86"/><line x1="10" y1="26" x2="70" y2="26"/>
      <path d="M10 26 L0 54 h20 Z"/><path d="M70 26 L60 54 h20 Z"/>
      <line x1="24" y1="88" x2="56" y2="88"/>
    </g>
    <path d="M0 54 h20 a10 8 0 0 1 -20 0 Z M60 54 h20 a10 8 0 0 1 -20 0 Z" fill="${C.ink}"/>
    <g transform="translate(78 40) rotate(40)">
      <rect x="-6" y="0" width="12" height="44" rx="3" fill="#8b5a2b"/>
      <rect x="-18" y="-14" width="36" height="18" rx="4" fill="#6b3f1a"/>
    </g>
    <g transform="translate(55 96) rotate(-12)">
      <rect x="-50" y="-16" width="104" height="30" rx="4" fill="none" stroke="${C.red}" stroke-width="4"/>
      ${text(2, 7, "REJECTED", { size: 19, fill: C.red, anchor: "middle", fit: 92 })}
    </g>`,
  food: () => `
    <path d="M6 52 h84 a42 40 0 0 1 -84 0 Z" fill="#e8d3a6" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="48" cy="52" rx="42" ry="8" fill="#fff" stroke="${C.ink}" stroke-width="4"/>
    <rect x="34" y="92" width="28" height="8" rx="3" fill="${C.ink}"/>
    <g fill="${C.red}">
      <rect x="86" y="4" width="12" height="44" transform="rotate(-20 92 26)"/>
      <path d="M78 46 L108 40 L100 66 Z"/>
    </g>
    ${text(48, 34, "UN", { size: 22, fill: "#1a73c8", anchor: "middle" })}`,
  border: () => `
    <rect x="0" y="84" width="110" height="10" fill="#9aa3ad"/>
    <rect x="8" y="34" width="10" height="56" fill="${C.ink}"/>
    <g transform="rotate(0)">
      <rect x="18" y="40" width="88" height="14" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
      <rect x="30" y="40" width="14" height="14" fill="${C.red}"/><rect x="58" y="40" width="14" height="14" fill="${C.red}"/><rect x="86" y="40" width="14" height="14" fill="${C.red}"/>
    </g>
    <!-- Estonia flag -->
    <g transform="translate(8 2)"><rect width="34" height="8" fill="#0072ce"/><rect y="8" width="34" height="8" fill="#000"/><rect y="16" width="34" height="8" fill="#fff" stroke="#333" stroke-width="0.5"/></g>
    <rect x="12" y="2" width="2" height="34" fill="${C.ink}"/>
    <circle cx="96" cy="72" r="12" fill="${C.red}"/><rect x="88" y="69" width="16" height="6" fill="#fff"/>`,
};

// ---------- tiles ----------
const tiles = [
  { tag: "CLIMATE · TÜRKIYE", color: "#2e7d32", icon: "cop", lines: ["COP31 ends", "deadlocked,", "drops fossil", "fuel phase-out"] },
  { tag: "INDIA", color: "#1565c0", icon: "cyclone", lines: ["Cyclone Akvan", "slams India's", "east coast"] },
  { tag: "SHENZHEN SUMMIT", color: "#6a1b9a", icon: "summit", lines: ["Trump–Xi–Putin", "pact skips", "Ukraine & Iran"] },
  { tag: "MYANMAR · ICJ", color: "#795548", icon: "court", lines: ["Myanmar", "rejects ICJ", "Rohingya", "genocide ruling"] },
  { tag: "UNITED NATIONS", color: "#e65100", icon: "food", lines: ["UN cuts its", "food-aid target", "as hunger", "crisis looms"] },
  { tag: "EUROPE · BALTIC", color: "#37474f", icon: "border", lines: ["Estonia shuts", "Russia border;", "Moscow vows", "to respond"] },
];

// Rough width of Arial Narrow Bold text; squeeze a line only if it would overflow.
const fitTo = (s, size, max) => (s.length * 0.47 * size > max ? max : undefined);

function tile(t, x, y, w, h) {
  const tx = x + 118, maxW = w - 118 - 10, size = 32;
  const top = t.lines.length === 4 ? y + 78 : y + 94;
  const lines = t.lines.map((l, i) => text(tx, top + i * 35, l, { size, family: NARROW, fit: fitTo(l, size, maxW) })).join("");
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.card}" stroke="${C.line}" stroke-width="2"/>
  <rect x="${x}" y="${y}" width="${w}" height="40" rx="10" fill="${t.color}"/>
  <rect x="${x}" y="${y + 30}" width="${w}" height="10" fill="${t.color}"/>
  ${text(x + 12, y + 30, t.tag, { size: 25, fill: "#fff", fit: fitTo(t.tag, 25 * 1.18, w - 24) })}
  <g transform="translate(${x + 8} ${y + 64}) scale(0.95)">${icons[t.icon]()}</g>
  ${lines}`;
}

function grid() {
  const x0 = 16, y0 = 460, w = 325, h = 196, gx = 8.5, gy = 8;
  return tiles.map((t, i) => tile(t, x0 + (i % 3) * (w + gx), y0 + Math.floor(i / 3) * (h + gy), w, h)).join("");
}

// ---------- ticker ----------
const ticker = [
  "Somalia orders UAE envoy out",
  "Iraq enters Jurf al-Sakhar",
  "Lula shields Raoni's birthplace",
  "Congo: rare Ebola virus studied",
  "France: de Villepin runs for 2027",
];
function tickerStrip() {
  const y = 870;
  const rows = [ticker.slice(0, 2), ticker.slice(2, 4), ticker.slice(4)].map((r) => r.join("   •   "));
  return `
  <rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${C.ink}"/>
  <rect x="16" y="${y + 14}" width="128" height="126" rx="8" fill="${C.gold}"/>
  ${text(80, y + 68, "ALSO", { size: 32, anchor: "middle" })}
  ${text(80, y + 106, "TODAY", { size: 32, anchor: "middle" })}
  ${rows.map((r, i) => text(160, y + 44 + i * 44, r, { size: 31, fill: "#fff", family: NARROW, fit: fitTo(r, 31, 848) })).join("")}`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  ${masthead()}
  ${lead()}
  ${grid()}
  ${tickerStrip()}
</svg>`;

// ---------- rasterise ----------
function findBrowser() {
  const cands = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
  ].filter(Boolean);
  const hit = cands.find((p) => existsSync(p));
  if (!hit) throw new Error("No Chrome/Edge found; set CHROME_PATH");
  return hit;
}

const svgPath = join(here, "poster.svg");
writeFileSync(svgPath, svg);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:${C.paper}}svg{display:block}</style></head><body>${svg}</body></html>`;
const work = mkdtempSync(join(tmpdir(), "poster-"));
const htmlPath = join(work, "poster.html");
writeFileSync(htmlPath, html);
const out = process.argv[2] || join(root, "entry.png");
execFileSync(findBrowser(), [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  `--user-data-dir=${join(work, "profile")}`,
  `--window-size=${W},${H}`, `--screenshot=${out}`, pathToFileURL(htmlPath).href,
], { stdio: "ignore" });
rmSync(work, { recursive: true, force: true });
console.log(`wrote ${out} (${statSync(out).size} bytes)`);
