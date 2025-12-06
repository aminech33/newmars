/**
 * Script pour générer les icônes iOS PWA et splash screens
 * 
 * Usage: node scripts/generate-ios-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Icône IKU avec design premium
const IKU_ICON_SVG = `
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
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  
  <!-- Mars surface details -->
  <circle cx="140" cy="140" r="35" fill="#27272a" opacity="0.5"/>
  <circle cx="380" cy="340" r="28" fill="#27272a" opacity="0.4"/>
  <circle cx="320" cy="120" r="18" fill="#27272a" opacity="0.3"/>
  <circle cx="120" cy="360" r="22" fill="#1f1f23" opacity="0.5"/>
  
  <!-- Central ring (IKU symbol) -->
  <circle cx="256" cy="256" r="90" fill="none" stroke="url(#ring)" stroke-width="14" filter="url(#glow)"/>
  
  <!-- Inner dot -->
  <circle cx="256" cy="256" r="28" fill="#6366f1"/>
  
  <!-- Subtle shine -->
  <ellipse cx="200" cy="180" rx="80" ry="40" fill="white" opacity="0.03"/>
</svg>
`;

// Splash screen SVG (centered logo on dark background)
const createSplashSVG = (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0f11"/>
      <stop offset="100%" style="stop-color:#09090b"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Full background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  
  <!-- Centered logo -->
  <g transform="translate(${width/2 - 60}, ${height/2 - 60})">
    <!-- Ring -->
    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ring)" stroke-width="8" filter="url(#glow)"/>
    <!-- Dot -->
    <circle cx="60" cy="60" r="16" fill="#6366f1"/>
  </g>
  
  <!-- App name -->
  <text x="${width/2}" y="${height/2 + 100}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="24" 
        font-weight="600"
        fill="#71717a" 
        text-anchor="middle">IKU</text>
</svg>
`;

// iOS icon sizes
const IOS_ICON_SIZES = [
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 152, name: 'apple-touch-icon-152x152.png' }, // iPad
  { size: 120, name: 'apple-touch-icon.png' }, // Default
];

// PWA icon sizes
const PWA_ICON_SIZES = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
];

// iOS splash screen sizes
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' },    // iPhone 5
  { width: 750, height: 1334, name: 'splash-750x1334.png' },    // iPhone 6/7/8
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },  // iPhone 6+/7+/8+
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },  // iPhone X/XS
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },  // iPhone 12/13
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },  // iPhone 14
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },  // iPhone 12/13 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },  // iPhone 14 Pro Max
];

async function generateIcons() {
  console.log('🍎 Génération des icônes iOS PWA...\n');

  // Generate iOS icons
  console.log('📱 Icônes Apple Touch:');
  for (const { size, name } of IOS_ICON_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, name);
    await sharp(Buffer.from(IKU_ICON_SVG))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  // Generate PWA icons
  console.log('\n📦 Icônes PWA:');
  for (const { size, name } of PWA_ICON_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, name);
    await sharp(Buffer.from(IKU_ICON_SVG))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  // Generate splash screens
  console.log('\n🖼️  Splash Screens iOS:');
  for (const { width, height, name } of SPLASH_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, name);
    const splashSVG = createSplashSVG(width, height);
    await sharp(Buffer.from(splashSVG))
      .resize(width, height)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${name} (${width}x${height})`);
  }

  console.log('\n🎉 Toutes les icônes iOS ont été générées dans public/');
  
  // List all generated files
  console.log('\n📁 Fichiers créés:');
  const files = fs.readdirSync(PUBLIC_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();
  
  let totalSize = 0;
  for (const file of files) {
    const stats = fs.statSync(path.join(PUBLIC_DIR, file));
    totalSize += stats.size;
    console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
  }
  console.log(`\n📊 Taille totale: ${Math.round(totalSize / 1024)}KB`);
}

generateIcons().catch(console.error);

