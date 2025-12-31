/**
 * 🧪 Script de test des connexions Brain
 * 
 * Ce script simule des actions utilisateur et vérifie que le Brain
 * enregistre correctement tous les événements.
 * 
 * À exécuter dans la console DevTools de l'application.
 */

console.log('🧠 === TEST DES CONNEXIONS BRAIN ===\n');

// Fonction helper pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour afficher les résultats
function showBrainMemory() {
  const memory = JSON.parse(localStorage.getItem('iku-brain-memory') || '{}');
  console.log('\n📊 Mémoire Brain actuelle:');
  console.log('- Total événements:', memory.recentEvents?.length || 0);
  console.log('- Patterns:', memory.patterns);
  console.log('- Dernière analyse:', new Date(memory.lastFullAnalysis).toLocaleString('fr-FR'));
  console.log('\n📝 Derniers événements:');
  if (memory.recentEvents) {
    memory.recentEvents.slice(-5).forEach(event => {
      console.log(`  • ${event.type} (${new Date(event.timestamp).toLocaleTimeString('fr-FR')})`);
    });
  }
  return memory;
}

// Test initial
console.log('État initial:');
const initialMemory = showBrainMemory();
const initialCount = initialMemory.recentEvents?.length || 0;

console.log('\n🧪 Début des tests...\n');

// Fonction de test asynchrone
async function runTests() {
  const { useStore } = window;
  
  if (!useStore) {
    console.error('❌ useStore non trouvé. Assure-toi que l\'app est chargée.');
    return;
  }
  
  const store = useStore.getState();
  
  try {
    // Test 1: Tâche
    console.log('1️⃣ Test: Création et complétion de tâche...');
    const testTask = {
      title: '🧪 Test Brain Task',
      completed: false,
      category: 'dev',
      status: 'todo',
      priority: 'medium'
    };
    store.addTask(testTask);
    await wait(500);
    
    const createdTask = store.tasks.find(t => t.title === '🧪 Test Brain Task');
    if (createdTask) {
      store.toggleTask(createdTask.id);
      console.log('✅ Tâche créée et complétée');
    }
    await wait(500);
    
    // Test 2: Habitude
    console.log('2️⃣ Test: Toggle habitude...');
    if (store.habits.length > 0) {
      store.toggleHabitToday(store.habits[0].id);
      console.log('✅ Habitude toggleée');
    } else {
      console.log('⚠️ Aucune habitude trouvée, ajout d\'une nouvelle...');
      store.addHabit('🧪 Test Habit');
      await wait(300);
      const newHabit = store.habits.find(h => h.name === '🧪 Test Habit');
      if (newHabit) {
        store.toggleHabitToday(newHabit.id);
        console.log('✅ Nouvelle habitude créée et toggleée');
      }
    }
    await wait(500);
    
    // Test 3: Journal
    console.log('3️⃣ Test: Ajout entrée journal...');
    store.addJournalEntry({
      content: '🧪 Test Brain - Entrée de test',
      mood: 8,
      date: new Date().toISOString().split('T')[0]
    });
    console.log('✅ Entrée journal ajoutée avec mood=8');
    await wait(500);
    
    // Test 4: Santé
    console.log('4️⃣ Test: Ajout données santé...');
    store.addMealEntry({
      type: 'lunch',
      name: '🧪 Test Meal',
      calories: 500,
      date: new Date().toISOString().split('T')[0]
    });
    console.log('✅ Repas ajouté (500 cal)');
    await wait(500);
    
    store.addHydrationEntry({
      amount: 250,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    console.log('✅ Hydratation ajoutée (250ml)');
    await wait(500);
    
    // Test 5: Pomodoro
    console.log('5️⃣ Test: Session Pomodoro...');
    store.addPomodoroSession({
      duration: 25,
      type: 'focus',
      startedAt: Date.now() - 25 * 60 * 1000
    });
    console.log('✅ Session Pomodoro ajoutée (25min)');
    await wait(500);
    
    // Vérification finale
    console.log('\n🎯 Tests terminés ! Vérification...\n');
    await wait(1000);
    
    const finalMemory = showBrainMemory();
    const finalCount = finalMemory.recentEvents?.length || 0;
    const newEvents = finalCount - initialCount;
    
    console.log('\n📈 Résultats:');
    console.log(`- Événements initiaux: ${initialCount}`);
    console.log(`- Événements finaux: ${finalCount}`);
    console.log(`- Nouveaux événements: ${newEvents}`);
    
    if (newEvents >= 5) {
      console.log('\n✅ ✅ ✅ SUCCESS ! Le Brain fonctionne correctement !');
      console.log('Tous les événements sont enregistrés.\n');
    } else {
      console.log('\n⚠️ Attention: Moins d\'événements que prévu.');
      console.log('Vérifie la console pour des erreurs.');
    }
    
    // Afficher les types d'événements enregistrés
    console.log('\n📋 Types d\'événements enregistrés:');
    const eventTypes = {};
    finalMemory.recentEvents?.forEach(e => {
      eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
    });
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });
    
    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    if (createdTask) {
      store.deleteTask(createdTask.id);
    }
    const testHabit = store.habits.find(h => h.name === '🧪 Test Habit');
    if (testHabit) {
      store.deleteHabit(testHabit.id);
    }
    const testJournal = store.journalEntries.find(e => e.content?.includes('🧪 Test Brain'));
    if (testJournal) {
      store.deleteJournalEntry(testJournal.id);
    }
    console.log('✅ Nettoyage terminé');
    
    console.log('\n🎉 Test complet ! Tu peux maintenant utiliser l\'app normalement.');
    console.log('Le Brain va continuer à collecter des données en arrière-plan.\n');
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  }
}

// Lancer les tests
runTests();










