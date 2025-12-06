/**
 * Script pour générer les icônes Tauri à partir du logo SVG
 * 
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '..', 'src-tauri', 'icons');
const SVG_PATH = path.join(__dirname, '..', 'public', 'mars.svg');

// Tailles requises par Tauri
const SIZES = [32, 128, 256, 512];

// Créer un SVG plus joli avec gradient pour l'icône
const ENHANCED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="100%" style="stop-color:#09090b"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bg)" stroke="#3f3f46" stroke-width="8"/>
  
  <!-- Mars surface details -->
  <circle cx="180" cy="180" r="40" fill="#27272a" opacity="0.6"/>
  <circle cx="340" cy="300" r="30" fill="#27272a" opacity="0.5"/>
  <circle cx="280" cy="160" r="20" fill="#27272a" opacity="0.4"/>
  
  <!-- Central ring (IKU symbol) -->
  <circle cx="256" cy="256" r="100" fill="none" stroke="url(#ring)" stroke-width="16" filter="url(#glow)"/>
  
  <!-- Inner dot -->
  <circle cx="256" cy="256" r="30" fill="#6366f1"/>
  
  <!-- Crater details -->
  <circle cx="150" cy="320" r="25" fill="#1f1f23"/>
  <circle cx="380" cy="200" r="20" fill="#1f1f23"/>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Génération des icônes Tauri...\n');

  // Créer le dossier icons s'il n'existe pas
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const pngPaths = [];

  // Générer les PNG à différentes tailles
  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `${size}x${size}.png`);
    
    await sharp(Buffer.from(ENHANCED_SVG))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    pngPaths.push(outputPath);
    console.log(`✅ ${size}x${size}.png créé`);
  }

  // Créer icon.png (256x256 par défaut)
  const iconPngPath = path.join(ICONS_DIR, 'icon.png');
  await sharp(Buffer.from(ENHANCED_SVG))
    .resize(256, 256)
    .png()
    .toFile(iconPngPath);
  console.log('✅ icon.png créé');

  // Créer icon.ico pour Windows (à partir du 256x256)
  const icoPath = path.join(ICONS_DIR, 'icon.ico');
  const pngBuffer = fs.readFileSync(path.join(ICONS_DIR, '256x256.png'));
  const icoBuffer = await pngToIco([pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✅ icon.ico créé');

  // Créer les icônes pour macOS (icns) - on copie juste les PNG pour l'instant
  // Sur macOS, Tauri peut utiliser les PNG directement
  
  console.log('\n🎉 Toutes les icônes ont été générées dans src-tauri/icons/');
  console.log('\nFichiers créés:');
  fs.readdirSync(ICONS_DIR).forEach(file => {
    const stats = fs.statSync(path.join(ICONS_DIR, file));
    console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
}

generateIcons().catch(console.error);

