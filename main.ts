// Writes the pre-rendered news poster to <output dir>/entry.png.
// Node 22, standard library only, no network. Validates the image against the
// contest limits before writing, so a bad render fails loudly instead of silently.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024; // 1 MiB
const MAX_SIDE = 1024;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function checkPng(buf: Buffer): { width: number; height: number } {
  if (buf.length > MAX_BYTES) throw new Error(`entry.png is ${buf.length} bytes, over ${MAX_BYTES}`);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIG)) throw new Error("entry.png is not a PNG");
  if (buf.toString("latin1", 12, 16) !== "IHDR") throw new Error("entry.png has no IHDR chunk first");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE) {
    throw new Error(`entry.png is ${width}x${height}, limit is ${MAX_SIDE}x${MAX_SIDE}`);
  }
  if (buf.toString("latin1", buf.length - 8, buf.length - 4) !== "IEND") throw new Error("entry.png is truncated (no IEND)");
  return { width, height };
}

const here = dirname(fileURLToPath(import.meta.url));
const png = readFileSync(join(here, "entry.png"));
const { width, height } = checkPng(png);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
console.log(`entry.png ${width}x${height}, ${png.length} bytes -> ${outDir}`);
