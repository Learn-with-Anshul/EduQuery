#!/usr/bin/env node
/* tools/build.js
   Bundles frontend with esbuild, copies static files to dist/, fingerprints assets (bundle & css)
   and updates dist/index.html to reference fingerprinted filenames.

   Usage: node tools/build.js
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hashFileSync(filePath) {
  const buf = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
  return hash;
}

async function bundle() {
  console.log('Bundling with esbuild...');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'js', 'app.js')],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'browser',
    outfile: path.join(DIST, 'js', 'bundle.mjs'),
    legalComments: 'none',
    target: ['es2020'],
  });
}

function copyStatic() {
  console.log('Copying static files...');
  // Copy index.html
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(DIST, 'index.html'));
  // Copy styles and assets folder
  const srcStyles = path.join(ROOT, 'styles');
  const dstStyles = path.join(DIST, 'styles');
  if (fs.existsSync(srcStyles)) {
    ensureDir(dstStyles);
    fs.readdirSync(srcStyles).forEach(f => {
      fs.copyFileSync(path.join(srcStyles, f), path.join(dstStyles, f));
    });
  }
  // Copy any public assets (images) if present
  const assets = ['assets', 'images', 'img', 'public'];
  assets.forEach(a => {
    const src = path.join(ROOT, a);
    const dst = path.join(DIST, a);
    if (fs.existsSync(src)) {
      copyRecursive(src, dst);
    }
  });
}

function copyRecursive(src, dst) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dst);
    fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dst, f)));
  } else {
    fs.copyFileSync(src, dst);
  }
}

function fingerprintAssets() {
  console.log('Fingerprinting assets...');
  const mappings = {};

  // Bundle
  const bundlePath = path.join(DIST, 'js', 'bundle.mjs');
  if (fs.existsSync(bundlePath)) {
    const h = hashFileSync(bundlePath);
    const newName = `bundle.${h}.mjs`;
    const newPath = path.join(DIST, 'js', newName);
    fs.renameSync(bundlePath, newPath);
    mappings['js/bundle.mjs'] = `js/${newName}`;
    // sourcemap (if exists)
    const mapPath = bundlePath + '.map';
    if (fs.existsSync(mapPath)) {
      try { fs.renameSync(mapPath, newPath + '.map'); } catch (e) { }
    }
  }

  // CSS
  const cssPath = path.join(DIST, 'styles', 'main.css');
  if (fs.existsSync(cssPath)) {
    const h = hashFileSync(cssPath);
    const newName = `main.${h}.css`;
    const newPath = path.join(DIST, 'styles', newName);
    fs.renameSync(cssPath, newPath);
    mappings['styles/main.css'] = `styles/${newName}`;
  }

  // Update index.html references
  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  Object.keys(mappings).forEach(k => {
    html = html.replace(new RegExp(k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), mappings[k]);
  });
  fs.writeFileSync(indexPath, html, 'utf8');

  // Write manifest
  fs.writeFileSync(path.join(DIST, 'asset-manifest.json'), JSON.stringify(mappings, null, 2));
  console.log('Fingerprinting complete. Manifest written to dist/asset-manifest.json');
}

async function run() {
  ensureDir(DIST);
  ensureDir(path.join(DIST, 'js'));
  try {
    await bundle();
    copyStatic();
    fingerprintAssets();
    console.log('Build complete. Serve the dist/ directory in production.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

run();
