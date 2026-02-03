#!/usr/bin/env node
/**
 * Export layers from the Vecteezy EPS file to PNG for the Hero parallax.
 * Requires Inkscape: https://inkscape.org/
 *
 * Run from project root: node scripts/export-eps-layers.mjs
 *
 * Converts vecteezy_parallax-background-arctic-aurora-borealis-night_14320507.eps
 * to SVG, then exports the full art as layer-0.png. If the SVG contains layer/group
 * IDs, exports each as layer-1.png, layer-2.png, etc.
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const EPS_PATH = path.join(
  projectRoot,
  'src/assets/parallax-files/vecteezy_parallax-background-arctic-aurora-borealis-night_14320507_289/vecteezy_parallax-background-arctic-aurora-borealis-night_14320507.eps'
);
const OUTPUT_DIR = path.join(projectRoot, 'src/assets/parallax-files/vecteezy_parallax_layers');
const TEMP_SVG = path.join(projectRoot, 'temp-parallax-export.svg');

function which(cmd) {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('where', [cmd], { encoding: 'utf8' });
      return r.status === 0 ? (r.stdout.trim().split('\n')[0] || null) : null;
    }
    return execSync(`which ${cmd}`, { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

function extractLayerIdsFromSvg(svgPath) {
  const content = fs.readFileSync(svgPath, 'utf8');
  const ids = [];
  const idRe = /\bid="([^"]+)"/g;
  let m;
  while ((m = idRe.exec(content)) !== null) {
    const id = m[1];
    if (id && !id.startsWith('svg') && !id.startsWith('defs') && !ids.includes(id)) {
      ids.push(id);
    }
  }
  const layerRe = /inkscape:label="([^"]+)"/gi;
  const byLabel = [];
  while ((m = layerRe.exec(content)) !== null) byLabel.push(m[1]);
  return ids.length > 0 ? ids : null;
}

function main() {
  if (!fs.existsSync(EPS_PATH)) {
    console.error('EPS file not found:', EPS_PATH);
    process.exit(1);
  }

  const inkscape = which('inkscape');
  if (!inkscape) {
    console.error('Inkscape is not installed or not on PATH.');
    console.error('Install from https://inkscape.org/ then run: node scripts/export-eps-layers.mjs');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Converting EPS to SVG...');
  try {
    execSync(`"${inkscape}" "${EPS_PATH}" --export-type=svg --export-filename="${TEMP_SVG}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });
  } catch (e) {
    try {
      execSync(`"${inkscape}" "${EPS_PATH}" -l "${TEMP_SVG}"`, { stdio: 'inherit', cwd: projectRoot });
    } catch (e2) {
      console.error('Failed to convert EPS to SVG. Try opening the EPS in Inkscape and exporting manually.');
      process.exit(1);
    }
  }

  if (!fs.existsSync(TEMP_SVG)) {
    console.error('SVG was not created.');
    process.exit(1);
  }

  const layerIds = extractLayerIdsFromSvg(TEMP_SVG);
  const exportFullOnly = !layerIds || layerIds.length <= 1;

  if (exportFullOnly) {
    console.log('Exporting full art as layer-0.png...');
    const out0 = path.join(OUTPUT_DIR, 'layer-0.png');
    try {
      execSync(
        `"${inkscape}" "${TEMP_SVG}" --export-type=png --export-filename="${out0}" --export-width=1200`,
        { stdio: 'inherit', cwd: projectRoot }
      );
      console.log('Created', out0);
    } catch (e) {
      console.error('Export failed:', e.message);
    }
  } else {
    console.log('Exporting', layerIds.length, 'layers...');
    for (let i = 0; i < layerIds.length; i++) {
      const outPath = path.join(OUTPUT_DIR, `layer-${i}.png`);
      try {
        execSync(
          `"${inkscape}" "${TEMP_SVG}" --export-id="${layerIds[i]}" --export-id-only --export-type=png --export-filename="${outPath}" --export-width=1200`,
          { stdio: 'inherit', cwd: projectRoot }
        );
        console.log('Created', outPath);
      } catch (e) {
        console.warn('Skip layer', layerIds[i], e.message);
      }
    }
  }

  try {
    fs.unlinkSync(TEMP_SVG);
  } catch (_) {}

  console.log('Done. Layers are in:', OUTPUT_DIR);
}

main();
