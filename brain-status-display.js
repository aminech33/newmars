/**
 * 🎨 Brain Status Display
 * Affichage visuel de l'état du Brain dans la console
 */

console.clear();

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function displayBrainStatus() {
  const memory = JSON.parse(localStorage.getItem('iku-brain-memory') || '{}');
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║         🧠  BRAIN STATUS DASHBOARD  🧠           ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Version & Last Analysis
  console.log('📌 INFORMATIONS');
  console.log('─'.repeat(50));
  console.log(`   Version: ${memory.version || 'N/A'}`);
  console.log(`   Dernière analyse: ${memory.lastFullAnalysis ? new Date(memory.lastFullAnalysis).toLocaleString('fr-FR') : 'Jamais'}`);
  console.log(`   Prochaine analyse: ~${memory.lastFullAnalysis ? new Date(memory.lastFullAnalysis + 5*60*1000).toLocaleTimeString('fr-FR') : 'N/A'}`);
  console.log('\n');
  
  // Events Count
  const eventCount = memory.recentEvents?.length || 0;
  console.log('📊 ÉVÉNEMENTS');
  console.log('─'.repeat(50));
  console.log(`   Total: ${eventCount} événements (7 derniers jours)`);
  
  if (eventCount > 0) {
    const types = {};
    memory.recentEvents.forEach(e => {
      types[e.type] = (types[e.type] || 0) + 1;
    });
    
    console.log('\n   Par type:');
    Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count]) => {
        const emoji = getEmojiForEvent(type);
        const bar = '█'.repeat(Math.min(count, 20));
        console.log(`   ${emoji} ${type.padEnd(25)} ${bar} ${count}`);
      });
  } else {
    console.log('   ⚠️  Aucun événement enregistré');
    console.log('   → Commence à utiliser l\'app pour générer des données');
  }
  console.log('\n');
  
  // Patterns
  const patterns = memory.patterns || {};
  console.log('🎯 PATTERNS');
  console.log('─'.repeat(50));
  console.log(`   📋 Tâches/jour: ${patterns.avgTasksPerDay?.toFixed(1) || '0.0'}`);
  console.log(`   ⏱️  Focus moyen: ${patterns.avgFocusDuration || 0} min`);
  console.log(`   ✅ Complétion tâches: ${((patterns.taskCompletionRate || 0) * 100).toFixed(0)}%`);
  console.log(`   😊 Mood moyen: ${patterns.avgMood?.toFixed(1) || '0.0'}/10`);
  console.log(`   🔄 Complétion habitudes: ${((patterns.habitCompletionRate || 0) * 100).toFixed(0)}%`);
  console.log(`   📝 Journal/semaine: ${patterns.journalFrequency || 0} jours`);
  console.log(`   🍽️  Calories/jour: ${patterns.avgCaloriesPerDay || 0}`);
  console.log(`   ⚖️  Tendance poids: ${patterns.weightTrend || 'stable'}`);
  
  if (patterns.correlations) {
    console.log('\n   📈 Corrélations:');
    const moodProd = patterns.correlations.moodProductivity || 0;
    const correlation = moodProd > 0.3 ? 'Forte ✅' : moodProd > 0 ? 'Faible' : 'Aucune';
    console.log(`   Mood ↔ Productivité: ${(moodProd * 100).toFixed(0)}% (${correlation})`);
  }
  console.log('\n');
  
  // Score History
  const history = memory.scoreHistory || [];
  console.log('📈 HISTORIQUE WELLBEING SCORE (30 derniers jours)');
  console.log('─'.repeat(50));
  
  if (history.length > 0) {
    const recent = history.slice(-7);
    console.log('   Derniers 7 jours:');
    recent.forEach(entry => {
      const bar = '█'.repeat(Math.floor(entry.score / 5));
      const emoji = entry.score >= 80 ? '🌟' : entry.score >= 60 ? '😊' : entry.score >= 40 ? '🙂' : '💙';
      console.log(`   ${entry.date} ${emoji} ${bar.padEnd(20)} ${entry.score}/100`);
    });
    
    const avg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
    console.log(`\n   Moyenne 7 jours: ${avg.toFixed(1)}/100`);
  } else {
    console.log('   ⚠️  Aucun historique');
    console.log('   → Le score sera enregistré après la première analyse');
  }
  console.log('\n');
  
  // Recent Events
  console.log('🕐 DERNIERS ÉVÉNEMENTS');
  console.log('─'.repeat(50));
  if (eventCount > 0) {
    memory.recentEvents.slice(-5).forEach(event => {
      const time = new Date(event.timestamp).toLocaleTimeString('fr-FR');
      const emoji = getEmojiForEvent(event.type);
      console.log(`   ${emoji} ${event.type.padEnd(25)} ${time}`);
    });
  } else {
    console.log('   Aucun événement récent');
  }
  console.log('\n');
  
  // Status Summary
  const status = eventCount > 10 ? '🟢 OPÉRATIONNEL' : eventCount > 0 ? '🟡 EN COLLECTE' : '🔴 EN ATTENTE';
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log(`║  STATUT: ${status.padEnd(42)}║`);
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('\n');
  
  if (eventCount === 0) {
    console.log('💡 CONSEIL: Utilise l\'app pour générer des données.');
    console.log('   Le Brain apprend de tes actions pour créer des insights.');
  } else if (eventCount < 10) {
    console.log('💡 CONSEIL: Continue d\'utiliser l\'app régulièrement.');
    console.log(`   ${eventCount}/50 événements pour des patterns fiables.`);
  } else {
    console.log('✨ Le Brain collecte des données et apprend de ton comportement !');
  }
  
  console.log('\n');
  console.log('📌 Commandes utiles:');
  console.log('   • displayBrainStatus() - Afficher ce dashboard');
  console.log('   • JSON.parse(localStorage.getItem("iku-brain-memory")) - Voir la mémoire brute');
  console.log('\n');
}

function getEmojiForEvent(type) {
  const emojis = {
    'task:created': '📝',
    'task:completed': '✅',
    'task:deleted': '🗑️',
    'task:moved': '↔️',
    'pomodoro:started': '🍅',
    'pomodoro:completed': '✅',
    'pomodoro:interrupted': '⏸️',
    'weight:added': '⚖️',
    'meal:added': '🍽️',
    'water:added': '💧',
    'journal:written': '📓',
    'mood:set': '😊',
    'habit:checked': '✔️',
    'habit:unchecked': '❌',
    'book:started': '📖',
    'book:finished': '🎉',
    'reading:session': '📚',
    'course:started': '🎓',
    'course:message': '💬',
    'flashcard:reviewed': '🃏',
    'view:changed': '🧭',
    'app:opened': '🚀',
    'app:closed': '👋',
  };
  return emojis[type] || '•';
}

// Rendre la fonction disponible globalement
window.displayBrainStatus = displayBrainStatus;

// Afficher automatiquement
displayBrainStatus();

console.log('🎉 Brain Dashboard chargé !');
console.log('   Tape displayBrainStatus() pour rafraîchir.\n');









