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
  <rect x="0" y="0" width="${W}" height="100" fill="${C.ink}"/>
  ${text(W / 2, 30, "THE WORLD TODAY  ·  25 STORIES", { size: 22, fill: C.gold, anchor: "middle", spacing: 6 })}
  ${text(W / 2, 88, "FRIDAY 20 NOVEMBER 2026", { size: 58, fill: "#fff", anchor: "middle", fit: 900 })}
  <rect x="0" y="100" width="${W}" height="5" fill="${C.red}"/>`;
}

// Numbered badge used on panels, tiles, the map and the list.
const badge = (cx, cy, n, { r = 11, fill = "#fff", ink = C.ink, size } = {}) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
  ${text(cx, cy + (size || r * 1.15) * 0.36, String(n), { size: size || r * 1.15, fill: ink, anchor: "middle" })}`;

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
  kyiv: () => `
    <rect width="110" height="110" rx="8" fill="#2a3150"/>
    <rect y="74" width="110" height="36" fill="#2d6a9f"/>
    <rect x="0" y="62" width="44" height="8" fill="#8090a8"/><rect x="62" y="62" width="48" height="8" fill="#8090a8"/>
    <rect x="16" y="70" width="6" height="22" fill="#8090a8"/><rect x="88" y="70" width="6" height="22" fill="#8090a8"/>
    <g fill="#6b7280" opacity="0.9"><ellipse cx="50" cy="50" rx="18" ry="9"/><ellipse cx="40" cy="38" rx="24" ry="10"/><ellipse cx="28" cy="26" rx="26" ry="10"/></g>
    <path d="M42 66 q2 -16 10 -24 q2 10 8 6 q6 10 2 18 Z" fill="#ff5a1f"/>
    <path d="M110 6 Q80 4 66 30" stroke="#ffd27a" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <path d="M110 30 Q96 26 86 46" stroke="#ffd27a" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <circle cx="66" cy="30" r="5" fill="#ff7a1a"/><circle cx="86" cy="46" r="5" fill="#ff7a1a"/>`,
  poland: () => `
    <rect width="110" height="110" rx="8" fill="#5a6b85"/>
    <rect y="78" width="110" height="32" fill="#6f8a4a"/>
    <path d="M100 4 L56 64" stroke="#ffd27a" stroke-width="5" stroke-dasharray="8 5"/>
    <g transform="translate(52 70) rotate(-54)"><rect x="-6" y="-26" width="12" height="40" rx="6" fill="#d9dde3"/><path d="M-6 -26 L0 -36 L6 -26 Z" fill="#d9dde3"/><path d="M-12 12 h24 l-6 -10 h-12 Z" fill="#9aa3ad"/></g>
    <ellipse cx="50" cy="84" rx="26" ry="7" fill="#3b2a1a"/>
    <g fill="#ff7a1a"><circle cx="40" cy="78" r="8"/><circle cx="54" cy="74" r="10"/></g>
    <rect x="8" y="22" width="3" height="60" fill="#333"/>
    <rect x="11" y="22" width="30" height="10" fill="#fff"/><rect x="11" y="32" width="30" height="10" fill="#dc143c"/>`,
  markets: () => `
    <rect width="110" height="110" rx="8" fill="#101826"/>
    <g stroke="#2a3a52" stroke-width="1">${[22, 44, 66, 88].map((v) => `<line x1="6" y1="${v}" x2="104" y2="${v}"/>`).join("")}</g>
    <polyline points="8,24 26,30 40,22 54,48 68,44 84,80 100,94" stroke="#ff3b3b" stroke-width="6" fill="none" stroke-linejoin="round"/>
    <path d="M100 94 l-16 -2 l12 -12 Z" fill="#ff3b3b"/>
    <rect x="62" y="8" width="40" height="26" rx="4" fill="${C.gold}"/>
    ${text(82, 28, "AI", { size: 20, anchor: "middle" })}`,
  ukeu: () => `
    <g transform="translate(4 14)"><rect width="62" height="42" fill="#003399"/>
      ${Array.from({ length: 12 }, (_, i) => `<circle cx="${31 + 13 * Math.cos((i * Math.PI) / 6)}" cy="${21 + 13 * Math.sin((i * Math.PI) / 6)}" r="2.6" fill="#ffcc00"/>`).join("")}</g>
    <g transform="translate(44 54)"><rect width="62" height="42" fill="#012169"/>
      <path d="M0 0 L62 42 M62 0 L0 42" stroke="#fff" stroke-width="9"/><path d="M0 0 L62 42 M62 0 L0 42" stroke="#c8102e" stroke-width="3"/>
      <path d="M31 0 V42 M0 21 H62" stroke="#fff" stroke-width="13"/><path d="M31 0 V42 M0 21 H62" stroke="#c8102e" stroke-width="7"/></g>`,
  strike: () => `
    <rect x="50" y="40" width="6" height="66" fill="#6b3f1a"/>
    <rect x="10" y="6" width="90" height="44" rx="4" fill="#fff" stroke="${C.red}" stroke-width="5"/>
    ${text(55, 36, "STRIKE", { size: 22, fill: C.red, anchor: "middle", fit: 76 })}
    <g fill="#37474f"><circle cx="18" cy="82" r="10"/><rect x="6" y="92" width="24" height="18" rx="8"/>
      <circle cx="88" cy="80" r="10"/><rect x="76" y="90" width="24" height="20" rx="8"/></g>`,
  envoy: () => `
    <rect x="6" y="44" width="62" height="46" rx="6" fill="#8b5a2b"/><rect x="24" y="34" width="26" height="12" rx="4" fill="none" stroke="#6b3f1a" stroke-width="5"/>
    <rect x="6" y="62" width="62" height="5" fill="#6b3f1a"/>
    <circle cx="80" cy="38" r="26" fill="#fff" stroke="${C.ink}" stroke-width="4"/>
    ${text(80, 46, "72h", { size: 20, anchor: "middle" })}
    <path d="M70 96 h32 m-10 -9 l10 9 l-10 9" stroke="${C.red}" stroke-width="5" fill="none"/>`,
  iraq: () => `
    <rect x="6" y="56" width="98" height="26" rx="8" fill="#6b705c"/>
    <rect x="26" y="38" width="46" height="22" rx="6" fill="#7d826b"/>
    <rect x="70" y="44" width="38" height="7" fill="#5a5e4c"/>
    <g fill="#333">${[18, 38, 58, 78, 94].map((x) => `<circle cx="${x}" cy="86" r="8"/>`).join("")}</g>
    <g transform="translate(6 4)"><rect width="36" height="8" fill="#ce1126"/><rect y="8" width="36" height="8" fill="#fff"/><rect y="16" width="36" height="8" fill="#000"/></g>`,
};

// ---------- the 25 stories (all from news-brief-v2-2026-11-20.md) ----------
// at = [lon, lat] for the map dot.
const leads = [
  { n: 1, tag: "UKRAINE", color: C.red, icon: "kyiv", at: [30.5, 50.4],
    head: ["Russia's heaviest", "barrage in months"],
    facts: ["110+ missiles, 400+ drones overnight", "3 Dnipro bridges in Kyiv hit", "8 killed across Ukraine"] },
  { n: 2, tag: "POLAND · NATO", color: "#8e24aa", icon: "poland", at: [23.5, 50.9],
    head: ["Russian missiles", "crash in Poland"],
    facts: ["2 missiles + jet drone down in E. Poland", "Tusk: “intentional provocation”", "NATO: “grave violation” of airspace"] },
  { n: 3, tag: "GLOBAL MARKETS", color: "#c62828", icon: "markets", at: [121.5, 25],
    head: ["AI sell-off", "routs markets"],
    facts: ["S&P 500 −3.7% · Nasdaq −5.3%", "Taiwan −6.2% · Nikkei −5.1% · Kospi −5.2%", "Nvidia: worst day since DeepSeek sell-off"] },
];
const tiles = [
  { n: 4, tag: "UK · EU", color: "#1a4fa0", icon: "ukeu", at: [4.4, 50.8], lines: ["UK & EU seal", "‘reset’ deals"] },
  { n: 5, tag: "COP31 · TÜRKIYE", color: "#2e7d32", icon: "cop", at: [30.7, 36.9], lines: ["COP31's last day:", "still no deal"] },
  { n: 6, tag: "INDIA", color: "#1565c0", icon: "cyclone", at: [84.9, 19.3], lines: ["Cyclone Akvan", "hits Odisha coast"] },
  { n: 7, tag: "MYANMAR · ROHINGYA", color: "#795548", icon: "court", at: [96.1, 19.7], lines: ["Myanmar rejects", "genocide ruling"] },
  { n: 8, tag: "ITALY", color: "#00796b", icon: "strike", at: [12.5, 41.9], lines: ["General strike vs", "Meloni's budget"] },
  { n: 9, tag: "ESTONIA · RUSSIA", color: "#37474f", icon: "border", at: [27.5, 59], lines: ["Estonia shuts", "Russia border"] },
  { n: 10, tag: "UN · HUNGER", color: "#e65100", icon: "food", at: [-74, 40.7], lines: ["UN cuts its", "food-aid target"] },
  { n: 11, tag: "SOMALIA · UAE", color: "#0277bd", icon: "envoy", at: [45.3, 2], lines: ["Somalia orders", "UAE envoy out"] },
  { n: 12, tag: "IRAQ", color: "#5d4037", icon: "iraq", at: [44.2, 32.9], lines: ["Iraqi forces enter", "Jurf al-Sakhar"] },
];
const also = [
  { n: 13, at: [-77, 38.9], s: "US: Trump threatens penalties on firms building data centres abroad" },
  { n: 14, at: [-77, 38.9], s: "US: White House cyber director Sean Cairncross stepping down" },
  { n: 15, at: [-77, 38.9], s: "US Treasury sanctions four Iranian ‘oil trustees’" },
  { n: 16, at: [49.1, 14.5], s: "Yemen: armed skiff fires on bulk carrier off Al Mukalla" },
  { n: 17, at: [32.5, 15.6], s: "Sudan: court gives RSF leader Hemedti a second death sentence" },
  { n: 18, at: [-6.8, 34], s: "Morocco aims to make 40% of its own defence needs by 2035" },
  { n: 19, at: [23, -3], s: "Congo: scientists study the rare Ebola virus behind outbreak" },
  { n: 20, at: [35.6, 3.1], s: "Kenya: Turkana oil rig due on; first crude targeted for 1 Dec" },
  { n: 21, at: [-53, -10], s: "Brazil: Lula moves to protect Chief Raoni's Amazon birthplace" },
  { n: 22, at: [2.3, 48.9], s: "France: ex-PM de Villepin launches 2027 presidential bid" },
  { n: 23, at: [72.9, 19], s: "India: shares rise against the Asian rout, Nifty +1.1%" },
  { n: 24, at: [-77, 38.9], s: "Pentagon tells Ukraine its deep strikes|in Russia are ‘counterproductive’" },
  { n: 25, at: [-74, 40.7], s: "Anthropic gives back much of its debut gain on first full trading day" },
];

// Rough width of Arial Narrow text; squeeze a line only if it would overflow.
const fitTo = (s, size, max, k = 0.47) => (s.length * k * size > max ? max : undefined);

// ---------- row 1: three lead panels ----------
function leadPanel(p, x, y, w, h) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.ink}"/>
  <rect x="${x}" y="${y}" width="${w}" height="32" rx="10" fill="${p.color}"/><rect x="${x}" y="${y + 22}" width="${w}" height="10" fill="${p.color}"/>
  ${badge(x + 18, y + 16, p.n, { r: 12 })}
  ${text(x + 38, y + 24, p.tag, { size: 20, fill: "#fff" })}
  <g transform="translate(${x + 10} ${y + 42}) scale(0.78)">${icons[p.icon]()}</g>
  ${p.head.map((l, i) => text(x + 106, y + 76 + i * 34, l, { size: 32, fill: "#fff", family: NARROW, fit: fitTo(l, 32, w - 114) })).join("")}
  ${p.facts.map((l, i) => text(x + 12, y + 156 + i * 23, l, { size: 20, fill: i ? "#e6eaf0" : C.gold, family: NARROW, fit: fitTo(l, 20, w - 24) })).join("")}`;
}
function leadRow() {
  const w = 325, gx = 8.5;
  return leads.map((p, i) => leadPanel(p, 16 + i * (w + gx), 112, w, 222)).join("");
}

// ---------- rows 2-4: nine story tiles ----------
function tile(t, x, y, w, h) {
  const tx = x + 92, maxW = w - 92 - 8, size = 29;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${C.card}" stroke="${C.line}" stroke-width="2"/>
  <rect x="${x}" y="${y}" width="${w}" height="28" rx="9" fill="${t.color}"/><rect x="${x}" y="${y + 18}" width="${w}" height="10" fill="${t.color}"/>
  ${badge(x + 15, y + 14, t.n, { r: 11, ink: t.color })}
  ${text(x + 32, y + 21, t.tag, { size: 18, fill: "#fff" })}
  <g transform="translate(${x + 8} ${y + 33}) scale(0.7)">${icons[t.icon]()}</g>
  ${t.lines.map((l, i) => text(tx, y + 63 + i * 32, l, { size, family: NARROW, fit: fitTo(l, size, maxW) })).join("")}`;
}
function grid() {
  const x0 = 16, y0 = 342, w = 325, h = 108, gx = 8.5, gy = 6;
  return tiles.map((t, i) => tile(t, x0 + (i % 3) * (w + gx), y0 + Math.floor(i / 3) * (h + gy), w, h)).join("");
}

// ---------- bottom left: world map with numbered dots ----------
// Hand-drawn, very simplified continent outlines as [lon, lat] points.
const LAND = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-62, 58], [-55, 50], [-66, 44], [-76, 35], [-81, 25], [-90, 29], [-97, 26], [-97, 20], [-87, 21], [-83, 10], [-78, 8], [-92, 15], [-105, 20], [-115, 30], [-124, 40], [-124, 48], [-135, 58], [-152, 58], [-165, 62]],
  [[-50, 60], [-42, 60], [-20, 70], [-25, 76], [-60, 76], [-55, 68]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -26], [-58, -38], [-65, -55], [-72, -50], [-72, -30], [-70, -18], [-81, -5], [-80, 2]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [40, 67], [60, 70], [80, 73], [110, 74], [140, 72], [160, 70], [180, 66], [175, 62], [160, 60], [155, 58], [140, 54], [135, 44], [128, 38], [122, 40], [121, 30], [110, 20], [108, 12], [104, 10], [100, 14], [98, 8], [103, 2], [98, 16], [94, 20], [90, 22], [80, 15], [78, 8], [72, 20], [66, 25], [57, 25], [52, 27], [48, 30], [56, 24], [60, 22], [52, 16], [44, 12], [42, 16], [35, 28], [33, 31], [35, 36], [27, 37], [26, 40], [23, 38], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [-1, 37], [-6, 36]],
  [[-17, 21], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -10], [35, -25], [20, -35], [15, -28], [12, -6], [8, 4], [-8, 5], [-17, 14]],
  [[114, -22], [130, -12], [142, -11], [153, -26], [147, -38], [135, -35], [115, -34]],
  [[130, 32], [140, 36], [142, 42], [139, 38]],
  [[-5, 50], [2, 52], [-2, 58], [-6, 56]],
  [[95, 5], [105, -6], [115, -8], [120, -2], [110, 2]],
  [[44, -16], [50, -14], [48, -25], [44, -24]],
];

function worldMap(mx, my, mw) {
  const LON0 = -135, LON1 = 150, LAT0 = 72, LAT1 = -45;
  const s = mw / (LON1 - LON0), mh = (LAT0 - LAT1) * s;
  const P = ([lon, lat]) => [mx + (lon - LON0) * s, my + (LAT0 - lat) * s];
  const land = LAND.map((poly) => `<path d="M${poly.map((p) => P(p).map((v) => v.toFixed(1)).join(" ")).join(" L")} Z"/>`).join("");
  // Numbered badges start at their dot and are pushed apart until none overlap (deterministic).
  const all = [
    ...leads.map((d) => ({ ...d, fill: C.red })),
    ...tiles.map((d) => ({ ...d, fill: "#1565c0" })),
    ...also.map((d) => ({ ...d, fill: "#b07d00" })),
  ].map((d, i) => {
    const [x, y] = P(d.at);
    const a = i * 2.39996; // golden-angle nudge so equal anchors separate
    return { ...d, ax: x, ay: y, x: x + Math.cos(a) * 3, y: y + Math.sin(a) * 3 };
  });
  const R = 9.5, minD = 2 * R + 1;
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const A = all[i], B = all[j];
      let dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01;
      if (d < minD) { const push = (minD - d) / 2; dx /= d; dy /= d; A.x -= dx * push; A.y -= dy * push; B.x += dx * push; B.y += dy * push; }
    }
    for (const b of all) {
      b.x += (b.ax - b.x) * 0.01; b.y += (b.ay - b.y) * 0.01;
      b.x = Math.min(mx + mw - R, Math.max(mx + R, b.x)); b.y = Math.min(my + mh - R, Math.max(my + R, b.y));
    }
  }
  return `
  <clipPath id="mapclip"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="8"/></clipPath>
  <rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="8" fill="#d6e6f2"/>
  <g clip-path="url(#mapclip)" fill="#b8c2cc" stroke="#9aa6b2" stroke-width="1">${land}</g>
  <g stroke="${C.ink}" stroke-width="1.2" opacity="0.7">${all.map((b) => `<line x1="${b.ax.toFixed(1)}" y1="${b.ay.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`).join("")}</g>
  <g fill="${C.ink}">${all.map((b) => `<circle cx="${b.ax.toFixed(1)}" cy="${b.ay.toFixed(1)}" r="2.5"/>`).join("")}</g>
  ${all.map((b) => badge(Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10, b.n, { r: R, fill: b.fill, ink: "#fff", size: 11 })).join("")}`;
}

// ---------- bottom right: numbered "also today" list in two columns ----------
function wrap(s, size, maxW, k = 0.40) {
  if (s.includes("|")) return s.split("|"); // explicit line break
  const per = Math.floor(maxW / (k * size)), words = s.split(" "), lines = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + " " + w).length > per && lines.length < 2) lines.push(w);
    else lines[lines.length - 1] = cur ? cur + " " + w : w;
  }
  return lines;
}
function alsoList(x, y, w) {
  const colW = (w - 10) / 2, rowH = 37, size = 16, perCol = Math.ceil(also.length / 2);
  return `
  ${text(x, y + 18, "ALSO TODAY", { size: 20, fill: C.ink })}
  ${also.map((a, i) => {
    const cx = x + Math.floor(i / perCol) * (colW + 10), cy = y + 32 + (i % perCol) * rowH;
    const lines = wrap(a.s, size, colW - 26);
    return badge(cx + 10, cy + 10, a.n, { r: 10, fill: "#b07d00", ink: "#fff", size: 11 }) +
      lines.map((l, k) => text(cx + 25, cy + 15 + k * 18, l, { size, weight: 400, family: NARROW, fit: fitTo(l, size, colW - 26, 0.43) })).join("");
  }).join("")}`;
}

function bottom() {
  const y = 684;
  return `
  <rect x="16" y="${y}" width="992" height="302" rx="10" fill="#fffaf0" stroke="${C.line}" stroke-width="2"/>
  ${text(28, y + 24, "WHERE IT HAPPENED", { size: 20 })}
  ${worldMap(28, y + 34, 470)}
  <g font-size="14">
    ${badge(36, y + 252, "", { r: 6, fill: C.red })}${text(46, y + 257, "1–3 lead", { size: 14, weight: 400 })}
    ${badge(126, y + 252, "", { r: 6, fill: "#1565c0" })}${text(136, y + 257, "4–12 stories", { size: 14, weight: 400 })}
    ${badge(240, y + 252, "", { r: 6, fill: "#b07d00" })}${text(250, y + 257, "13–25 also today", { size: 14, weight: 400 })}
  </g>
  ${alsoList(514, y + 6, 484)}`;
}

function footer() {
  return text(W / 2, 1009, "All 25 stories happened or were first reported on Friday 20 November 2026 · Sources: AP, Reuters, AFP, Euronews, IMD, CNBC", { size: 13, weight: 400, fill: C.muted, anchor: "middle" });
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  ${masthead()}
  ${leadRow()}
  ${grid()}
  ${bottom()}
  ${footer()}
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
