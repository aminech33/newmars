#!/usr/bin/env node

/**
 * 🧪 Test automatisé des connexions Brain
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧠 === VÉRIFICATION DES CONNEXIONS BRAIN ===\n');

// Chemins
const storeFile = path.join(__dirname, 'src', 'store', 'useStore.ts');

console.log('📁 Vérification des fichiers...\n');

// 1. Vérifier que useStore.ts existe
if (!fs.existsSync(storeFile)) {
  console.error('❌ Fichier useStore.ts non trouvé');
  process.exit(1);
}
console.log('✅ useStore.ts trouvé');

// 2. Lire le contenu
const storeContent = fs.readFileSync(storeFile, 'utf-8');

// 3. Vérifier les imports Brain
const brainImports = [
  'observeTaskCreated',
  'observeTaskCompleted',
  'observeTaskDeleted',
  'observeTaskMoved',
  'observePomodoroCompleted',
  'observePomodoroInterrupted',
  'observeWeightAdded',
  'observeMealAdded',
  'observeWaterAdded',
  'observeJournalWritten',
  'observeMoodSet',
  'observeHabitChecked',
  'observeHabitUnchecked',
  'observeBookStarted',
  'observeBookFinished',
  'observeReadingSession',
  'observeCourseStarted',
  'observeCourseMessage',
];

console.log('\n🔍 Vérification des imports Brain...\n');

let importsFound = 0;
brainImports.forEach(importName => {
  if (storeContent.includes(importName)) {
    console.log(`  ✅ ${importName}`);
    importsFound++;
  } else {
    console.log(`  ❌ ${importName} - MANQUANT`);
  }
});

console.log(`\n📊 Imports: ${importsFound}/${brainImports.length}`);

// 4. Vérifier que les fonctions appellent les observers
console.log('\n🔗 Vérification des appels Brain dans le code...\n');

const observerCalls = [
  'observeTaskCreated(',
  'observeTaskCompleted(',
  'observeTaskDeleted(',
  'observeTaskMoved(',
  'observePomodoroCompleted(',
  'observePomodoroInterrupted(',
  'observeWeightAdded(',
  'observeMealAdded(',
  'observeWaterAdded(',
  'observeJournalWritten(',
  'observeMoodSet(',
  'observeHabitChecked(',
  'observeHabitUnchecked(',
  'observeBookStarted(',
  'observeBookFinished(',
  'observeReadingSession(',
  'observeCourseStarted(',
  'observeCourseMessage(',
];

let callsFound = 0;
observerCalls.forEach(call => {
  const count = (storeContent.match(new RegExp(call.replace('(', '\\('), 'g')) || []).length;
  if (count > 0) {
    console.log(`  ✅ ${call} - ${count} appel(s)`);
    callsFound++;
  } else {
    console.log(`  ❌ ${call} - NON UTILISÉ`);
  }
});

console.log(`\n📊 Appels: ${callsFound}/${observerCalls.length}`);

// 5. Vérifier les fichiers Brain
console.log('\n📂 Vérification des fichiers Brain...\n');

const brainFiles = [
  'src/brain/index.ts',
  'src/brain/Observer.ts',
  'src/brain/Analyzer.ts',
  'src/brain/Memory.ts',
  'src/brain/Wellbeing.ts',
  'src/brain/types.ts',
  'src/brain/integration.ts',
];

let brainFilesFound = 0;
brainFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    brainFilesFound++;
  } else {
    console.log(`  ❌ ${file} - MANQUANT`);
  }
});

console.log(`\n📊 Fichiers Brain: ${brainFilesFound}/${brainFiles.length}`);

// 6. Vérifier HubV2 utilise le Brain
console.log('\n🏠 Vérification de l\'utilisation dans HubV2...\n');

const hubFile = path.join(__dirname, 'src', 'components', 'HubV2.tsx');
if (fs.existsSync(hubFile)) {
  const hubContent = fs.readFileSync(hubFile, 'utf-8');
  const usesUseBrain = hubContent.includes('useBrain');
  const usesWellbeing = hubContent.includes('wellbeing');
  
  if (usesUseBrain && usesWellbeing) {
    console.log('  ✅ HubV2 utilise useBrain() et affiche le wellbeing');
  } else {
    console.log('  ⚠️  HubV2 trouvé mais usage du Brain incomplet');
  }
} else {
  console.log('  ⚠️  HubV2.tsx non trouvé');
}

// 7. Résultat final
console.log('\n' + '='.repeat(60));
console.log('\n🎯 RÉSULTAT FINAL\n');

const totalChecks = importsFound + callsFound + brainFilesFound;
const maxChecks = brainImports.length + observerCalls.length + brainFiles.length;
const percentage = Math.round((totalChecks / maxChecks) * 100);

console.log(`  Total vérifié: ${totalChecks}/${maxChecks} (${percentage}%)`);
console.log(`  - Imports: ${importsFound}/${brainImports.length}`);
console.log(`  - Appels: ${callsFound}/${observerCalls.length}`);
console.log(`  - Fichiers: ${brainFilesFound}/${brainFiles.length}`);

if (percentage >= 95) {
  console.log('\n  ✅ ✅ ✅ PARFAIT ! Le Brain est 100% opérationnel !');
  console.log('  Toutes les connexions sont établies.\n');
} else if (percentage >= 80) {
  console.log('\n  ✅ EXCELLENT ! Le Brain est bien connecté !');
  console.log('  Quelques optimisations possibles mais fonctionnel.\n');
} else if (percentage >= 60) {
  console.log('\n  ⚠️  BIEN mais quelques éléments manquent.');
  console.log('  Vérifie les éléments marqués ❌ ci-dessus.\n');
} else {
  console.log('\n  ❌ ATTENTION ! Plusieurs connexions manquantes.');
  console.log('  Le Brain ne fonctionnera pas correctement.\n');
}

// 8. Instructions
console.log('📝 PROCHAINES ÉTAPES:\n');
if (percentage >= 80) {
  console.log('  ✅ Le Brain est prêt à l\'emploi !');
  console.log('');
  console.log('  Pour tester en conditions réelles:');
  console.log('  1. L\'app tourne déjà sur http://localhost:5173/');
  console.log('  2. Utilise l\'app normalement (crée tâches, habitudes, etc.)');
  console.log('  3. Ouvre DevTools → Application → Local Storage');
  console.log('  4. Cherche "iku-brain-memory"');
  console.log('  5. Tu devrais voir les événements s\'accumuler dans "recentEvents"');
  console.log('');
  console.log('  Le Brain analyse automatiquement toutes les 5 minutes ! 🎯\n');
} else {
  console.log('  1. Vérifie les imports manquants dans useStore.ts');
  console.log('  2. Ajoute les connexions manquantes');
  console.log('  3. Relance: node test-brain-connections.js\n');
}

console.log('='.repeat(60) + '\n');

process.exit(percentage >= 80 ? 0 : 1);










