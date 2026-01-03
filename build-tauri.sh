#!/bin/bash

# 🏗️ Script pour rebuild Tauri (version production)

echo "🔄 Fermeture de l'app IKU si elle tourne..."
killall iku 2>/dev/null

echo "🏗️ Build de l'app Tauri (ça peut prendre 2-3 minutes)..."
cd /Users/aminecb/Desktop/newmars

# Build Tauri
npm run tauri build

echo "✅ Build terminé !"
echo "📦 L'app est dans: src-tauri/target/release/bundle/"











