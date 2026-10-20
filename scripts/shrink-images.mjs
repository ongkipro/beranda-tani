// Caps landing-page images at 840 px wide (about 2x a 412 px phone column) and
// re-encodes them as WebP. An image is rewritten only when the result is at
// least 3% smaller, and never widened. Names and aspect ratios are unchanged,
// so width/height attributes and every reference stay valid.
//
//   node scripts/shrink-images.mjs            dry run: prints the savings
//   node scripts/shrink-images.mjs --write    rewrites the files in place
import sharp from 'sharp';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/images/', import.meta.url).pathname;
const MAX_WIDTH = 840;
const QUALITY = 78;
const write = process.argv.includes('--write');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.webp$/i.test(name)) yield path;
  }
}

let before = 0;
let after = 0;
const rows = [];
for (const file of walk(ROOT)) {
  const input = readFileSync(file);
  const meta = await sharp(input).metadata();
  before += input.length;
  if ((meta.pages ?? 1) > 1 || !meta.width || meta.width <= MAX_WIDTH || input.length < 40 * 1024) {
    after += input.length;
    continue;
  }
  const output = await sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5 }).toBuffer();
  const kept = output.length < input.length * 0.97 ? output : input;
  after += kept.length;
  if (kept === output) {
    rows.push([file.replace(ROOT, ''), `${meta.width}x${meta.height}`, Math.round(input.length / 1024), Math.round(output.length / 1024)]);
    if (write) writeFileSync(file, output);
  }
}
for (const [name, size, was, now] of rows.sort((a, b) => b[2] - b[3] - (a[2] - a[3])).slice(0, 15)) {
  console.log(`${name.padEnd(62)} ${size.padEnd(10)} ${String(was).padStart(4)} -> ${String(now).padStart(4)} KiB`);
}
console.log(`${rows.length} files ${write ? 'rewritten' : 'would change'}; ${Math.round(before / 1024)} -> ${Math.round(after / 1024)} KiB`);
