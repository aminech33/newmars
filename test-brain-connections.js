/**
 * 🧪 Test automatisé des connexions Brain
 * Ce fichier sera exécuté via Node pour tester l'intégration
 */

const fs = require('fs');
const path = require('path');

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

// 4. Vérifier les appels dans le code
console.log('\n🔗 Vérification des connexions...\n');

const connections = [
  { name: 'addTask', observer: 'observeTaskCreated', line: 'addTask:' },
  { name: 'toggleTask', observer: 'observeTaskCompleted', line: 'toggleTask:' },
  { name: 'deleteTask', observer: 'observeTaskDeleted', line: 'deleteTask:' },
  { name: 'moveTask', observer: 'observeTaskMoved', line: 'moveTask:' },
  { name: 'addPomodoroSession', observer: 'observePomodoroCompleted', line: 'addPomodoroSession:' },
  { name: 'addWeightEntry', observer: 'observeWeightAdded', line: 'addWeightEntry:' },
  { name: 'addMealEntry', observer: 'observeMealAdded', line: 'addMealEntry:' },
  { name: 'addHydrationEntry', observer: 'observeWaterAdded', line: 'addHydrationEntry:' },
  { name: 'addJournalEntry', observer: 'observeJournalWritten', line: 'addJournalEntry:' },
  { name: 'updateJournalEntry', observer: 'observeMoodSet', line: 'updateJournalEntry:' },
  { name: 'toggleHabitToday', observer: 'observeHabit', line: 'toggleHabitToday:' },
  { name: 'updateBook', observer: 'observeBook', line: 'updateBook:' },
  { name: 'endReadingSession', observer: 'observeReadingSession', line: 'endReadingSession:' },
  { name: 'addLearningCourse', observer: 'observeCourseStarted', line: 'addLearningCourse:' },
  { name: 'addLearningMessage', observer: 'observeCourseMessage', line: 'addLearningMessage:' },
];

let connectionsFound = 0;

connections.forEach(conn => {
  // Chercher la fonction
  const funcRegex = new RegExp(`${conn.line}[^}]*${conn.observer}`, 's');
  if (funcRegex.test(storeContent)) {
    console.log(`  ✅ ${conn.name} → ${conn.observer}`);
    connectionsFound++;
  } else {
    console.log(`  ❌ ${conn.name} → ${conn.observer} - NON CONNECTÉ`);
  }
});

console.log(`\n📊 Connexions: ${connectionsFound}/${connections.length}`);

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
    console.log(`  ✅ ${file}`);
    brainFilesFound++;
  } else {
    console.log(`  ❌ ${file} - MANQUANT`);
  }
});

console.log(`\n📊 Fichiers Brain: ${brainFilesFound}/${brainFiles.length}`);

// 6. Résultat final
console.log('\n' + '='.repeat(60));
console.log('\n🎯 RÉSULTAT FINAL\n');

const totalChecks = importsFound + connectionsFound + brainFilesFound;
const maxChecks = brainImports.length + connections.length + brainFiles.length;
const percentage = Math.round((totalChecks / maxChecks) * 100);

console.log(`  Total vérifié: ${totalChecks}/${maxChecks} (${percentage}%)`);

if (percentage >= 90) {
  console.log('\n  ✅ ✅ ✅ EXCELLENT ! Le Brain est bien connecté !');
  console.log('  Tous les composants sont en place.\n');
} else if (percentage >= 70) {
  console.log('\n  ⚠️  BIEN mais quelques éléments manquent.');
  console.log('  Vérifie les éléments marqués ❌ ci-dessus.\n');
} else {
  console.log('\n  ❌ ATTENTION ! Plusieurs connexions manquantes.');
  console.log('  Le Brain ne fonctionnera pas correctement.\n');
}

// 7. Instructions
console.log('📝 PROCHAINES ÉTAPES:\n');
if (percentage >= 90) {
  console.log('  1. Lance l\'app: npm run dev');
  console.log('  2. Utilise l\'app normalement');
  console.log('  3. Vérifie localStorage: iku-brain-memory');
  console.log('  4. Les événements devraient s\'accumuler automatiquement\n');
} else {
  console.log('  1. Vérifie les imports manquants dans useStore.ts');
  console.log('  2. Ajoute les connexions manquantes');
  console.log('  3. Relance ce test\n');
}

console.log('='.repeat(60) + '\n');

process.exit(percentage >= 90 ? 0 : 1);

