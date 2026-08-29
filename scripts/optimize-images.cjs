#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '../public/uploads');
const OUT_BASE = path.resolve(__dirname, '../public/_optimized');
const WIDTHS = [480, 800, 1200, 2048];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function processFile(file) {
  const rel = path.relative(SRC_DIR, file);
  const ext = path.extname(file).toLowerCase();
  const outRelDir = path.dirname(rel);

  for (const w of WIDTHS) {
    const outDir = path.join(OUT_BASE, String(w), outRelDir);
    ensureDir(outDir);
    const baseName = path.basename(file, ext);
    const outJpg = path.join(outDir, `${baseName}${ext}`);
    const outWebp = path.join(outDir, `${baseName}.webp`);

    try {
      await sharp(file)
        .resize({ width: w, withoutEnlargement: true })
        .toFile(outJpg);
      // produce webp too
      await sharp(file)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outWebp);
      console.log(`wrote ${outJpg} and ${outWebp}`);
    } catch (err) {
      console.error('failed', file, err.message);
    }
  }
}

function walk(dir, cb) {
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const full = path.join(dir, it);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('Source uploads directory not found:', SRC_DIR);
    process.exit(1);
  }

  const files = [];
  walk(SRC_DIR, (f) => {
    const ext = path.extname(f).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) files.push(f);
  });

  console.log(`Found ${files.length} images, processing...`);
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    await processFile(f);
  }
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
