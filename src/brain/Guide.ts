/**
 * 🧠 BRAIN - Guide
 * 
 * Le guide bienveillant qui suggère sans imposer.
 * 
 * Philosophie :
 * - Jamais de culpabilisation
 * - Toujours encourageant
 * - Non-intrusif
 * - Célèbre les petites victoires
 * - Pardonne les échecs
 */

import { 
  BrainMemory, 
  UserPatterns, 
  CurrentPredictions, 
  Suggestion, 
  ContextualSuggestions,
  SuggestionTone,
  DEFAULT_BRAIN_CONFIG 
} from './types'
import { getTodayEvents } from './Memory'

/**
 * Génère les suggestions contextuelles
 */
export function generateSuggestions(
  memory: BrainMemory,
  patterns: UserPatterns,
  predictions: CurrentPredictions
): ContextualSuggestions {
  const allSuggestions = [
    ...generateProductivitySuggestions(memory, patterns, predictions),
    ...generateHealthSuggestions(memory, patterns, predictions),
    ...generateMentalSuggestions(memory, patterns, predictions),
    ...generateCelebrations(memory, patterns),
  ]
  
  // Filtrer les suggestions déjà dismissées
  const filtered = allSuggestions.filter(s => 
    !memory.dismissedSuggestions.includes(s.id)
  )
  
  // Trier par priorité
  const sorted = filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
  
  // Séparer célébrations des autres
  const celebrations = sorted.filter(s => s.category === 'celebration')
  const others = sorted.filter(s => s.category !== 'celebration')
  
  return {
    now: others[0] || null,
    upcoming: others.slice(1, 4),
    achievements: celebrations.slice(0, 3),
  }
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTIONS PRODUCTIVITÉ
// ═══════════════════════════════════════════════════════════════

function generateProductivitySuggestions(
  memory: BrainMemory,
  patterns: UserPatterns,
  predictions: CurrentPredictions
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const now = new Date()
  const currentHour = now.getHours()
  const todayEvents = getTodayEvents(memory)
  const todayTasks = todayEvents.filter(e => e.type === 'task:completed').length
  
  // Suggestion heure productive
  if (predictions.isGoodTimeForWork && todayTasks < patterns.avgTasksPerDay) {
    suggestions.push({
      id: `peak-hour-${currentHour}`,
      message: `C'est ton heure la plus productive ! Parfait pour une tâche importante.`,
      tone: 'encouraging',
      priority: 'medium',
      category: 'productivity',
      actionable: {
        label: 'Voir mes tâches',
        action: 'navigate:tasks',
      },
    })
  }
  
  // Suggestion pause (bienveillante)
  if (predictions.suggestedBreakIn !== null && predictions.suggestedBreakIn <= 10) {
    suggestions.push({
      id: `break-soon-${Date.now()}`,
      message: `Tu travailles depuis un moment. Une petite pause ferait du bien ! ☕`,
      tone: 'gentle',
      priority: 'medium',
      category: 'break',
    })
  }
  
  // Suggestion type de tâche
  if (predictions.optimalTaskType === 'creative' && todayTasks === 0) {
    suggestions.push({
      id: `creative-time-${currentHour}`,
      message: `Ton énergie est au top ! Idéal pour les tâches qui demandent de la réflexion.`,
      tone: 'encouraging',
      priority: 'low',
      category: 'productivity',
    })
  }
  
  // Procrastination (doux, pas culpabilisant)
  if (predictions.procrastinationRisk > 0.6 && patterns.avoidedCategories.length > 0) {
    const avoided = patterns.avoidedCategories[0]
    suggestions.push({
      id: `procrastination-gentle`,
      message: `Les tâches "${avoided}" attendent depuis un moment. Peut-être juste 5 minutes dessus ?`,
      tone: 'gentle',
      priority: 'low',
      category: 'productivity',
      actionable: {
        label: 'Commencer petit',
        action: 'navigate:tasks',
      },
    })
  }
  
  return suggestions
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTIONS SANTÉ
// ═══════════════════════════════════════════════════════════════

function generateHealthSuggestions(
  memory: BrainMemory,
  patterns: UserPatterns,
  predictions: CurrentPredictions
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const now = new Date()
  const currentHour = now.getHours()
  
  // Rappel repas (non-intrusif)
  if (predictions.shouldEatSoon) {
    const mealType = currentHour < 11 ? 'petit-déjeuner' : 
                     currentHour < 15 ? 'déjeuner' : 
                     currentHour < 20 ? 'goûter' : 'dîner'
    
    suggestions.push({
      id: `meal-reminder-${currentHour}`,
      message: `Tu n'as pas encore mangé. Un ${mealType} te ferait du bien ! 🍽️`,
      tone: 'gentle',
      priority: 'medium',
      category: 'health',
      actionable: {
        label: 'Ajouter un repas',
        action: 'navigate:health',
      },
    })
  }
  
  // Rappel hydratation
  if (predictions.hydrationReminder) {
    suggestions.push({
      id: `water-reminder-${currentHour}`,
      message: `N'oublie pas de boire ! 💧`,
      tone: 'gentle',
      priority: 'low',
      category: 'health',
    })
  }
  
  // Encouragement tendance poids
  if (patterns.weightTrend === 'losing') {
    suggestions.push({
      id: 'weight-progress',
      message: `Ta tendance poids est positive, continue comme ça ! 📉`,
      tone: 'celebratory',
      priority: 'low',
      category: 'health',
    })
  }
  
  return suggestions
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTIONS MENTAL
// ═══════════════════════════════════════════════════════════════

function generateMentalSuggestions(
  memory: BrainMemory,
  patterns: UserPatterns,
  predictions: CurrentPredictions
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const todayEvents = getTodayEvents(memory)
  
  // Mood bas (supportif, pas intrusif)
  const moodEvents = todayEvents.filter(e => e.type === 'mood:set' || e.type === 'journal:written')
  const lastMood = moodEvents.length > 0 
    ? moodEvents.sort((a, b) => b.timestamp - a.timestamp)[0]?.data.mood 
    : null
  
  if (lastMood !== null && lastMood <= DEFAULT_BRAIN_CONFIG.thresholds.lowMoodThreshold) {
    suggestions.push({
      id: 'low-mood-support',
      message: `Journée difficile ? C'est ok, ça arrive. Prends soin de toi. 💙`,
      tone: 'supportive',
      priority: 'high',
      category: 'mental',
    })
  }
  
  // Rappel journal (doux)
  const hasJournalToday = todayEvents.some(e => e.type === 'journal:written')
  if (!hasJournalToday && new Date().getHours() >= 20) {
    suggestions.push({
      id: 'journal-evening',
      message: `Un petit moment pour toi ? Écrire quelques mots peut aider à décompresser.`,
      tone: 'gentle',
      priority: 'low',
      category: 'mental',
      actionable: {
        label: 'Ouvrir le journal',
        action: 'navigate:myday',
      },
    })
  }
  
  // Encouragement habitudes en difficulté (forgiveness)
  if (patterns.strugglingHabits.length > 0 && patterns.habitCompletionRate < 0.5) {
    suggestions.push({
      id: 'habit-forgiveness',
      message: `Les habitudes, c'est dur. Chaque petit pas compte, même imparfait. 🌱`,
      tone: 'supportive',
      priority: 'low',
      category: 'habit',
    })
  }
  
  return suggestions
}

// ═══════════════════════════════════════════════════════════════
// CÉLÉBRATIONS
// ═══════════════════════════════════════════════════════════════

function generateCelebrations(
  memory: BrainMemory,
  patterns: UserPatterns
): Suggestion[] {
  const celebrations: Suggestion[] = []
  const todayEvents = getTodayEvents(memory)
  const todayTasks = todayEvents.filter(e => e.type === 'task:completed').length
  
  // Célébrer X tâches
  if (todayTasks >= DEFAULT_BRAIN_CONFIG.thresholds.celebrateAfterTasks) {
    celebrations.push({
      id: `celebrate-tasks-${todayTasks}`,
      message: `🎉 ${todayTasks} tâches aujourd'hui ! Tu assures !`,
      tone: 'celebratory',
      priority: 'low',
      category: 'celebration',
    })
  }
  
  // Célébrer objectif atteint
  if (todayTasks >= patterns.avgTasksPerDay && patterns.avgTasksPerDay > 0) {
    celebrations.push({
      id: 'daily-goal-reached',
      message: `🏆 Objectif du jour atteint ! Tu peux être fier(e).`,
      tone: 'celebratory',
      priority: 'low',
      category: 'celebration',
    })
  }
  
  // Célébrer toutes les habitudes du jour
  const habitChecks = todayEvents.filter(e => e.type === 'habit:checked')
  if (habitChecks.length >= 3) {
    celebrations.push({
      id: 'habits-done',
      message: `✨ Toutes tes habitudes sont cochées ! Bravo !`,
      tone: 'celebratory',
      priority: 'low',
      category: 'celebration',
    })
  }
  
  // Célébrer amélioration corrélation mood/productivité
  if (patterns.correlations.moodProductivity > 0.5) {
    celebrations.push({
      id: 'mood-productivity-correlation',
      message: `📈 Quand tu vas bien, tu es super productif ! Continue de prendre soin de toi.`,
      tone: 'celebratory',
      priority: 'low',
      category: 'celebration',
    })
  }
  
  // Célébrer streak journal
  if (patterns.journalFrequency >= 5) {
    celebrations.push({
      id: 'journal-streak',
      message: `📝 Tu écris régulièrement dans ton journal. C'est une super habitude !`,
      tone: 'celebratory',
      priority: 'low',
      category: 'celebration',
    })
  }
  
  return celebrations
}

// ═══════════════════════════════════════════════════════════════
// MESSAGES PERSONNALISÉS
// ═══════════════════════════════════════════════════════════════

/**
 * Génère un message de bienvenue personnalisé
 */
export function generateWelcomeMessage(patterns: UserPatterns): string {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()
  
  // Salutation selon l'heure
  let greeting = ''
  if (hour < 12) greeting = 'Bonjour'
  else if (hour < 18) greeting = 'Bon après-midi'
  else greeting = 'Bonsoir'
  
  // Message personnalisé selon les patterns
  const messages: string[] = []
  
  if (patterns.peakHours.includes(hour)) {
    messages.push(`C'est une de tes heures productives !`)
  }
  
  if (patterns.bestDays.includes(dayOfWeek)) {
    messages.push(`Les ${getDayName(dayOfWeek)}s sont souvent de bonnes journées pour toi.`)
  }
  
  if (patterns.avgMood >= 7) {
    messages.push(`Tu as l'air en forme ces derniers temps.`)
  }
  
  // Choisir un message aléatoire ou le premier
  const personalMessage = messages.length > 0 
    ? messages[Math.floor(Math.random() * messages.length)]
    : `Prêt(e) pour une nouvelle journée ?`
  
  return `${greeting} ! ${personalMessage}`
}

/**
 * Génère un message de fin de journée
 */
export function generateEveningMessage(memory: BrainMemory, patterns: UserPatterns): string {
  const todayEvents = getTodayEvents(memory)
  const tasksCompleted = todayEvents.filter(e => e.type === 'task:completed').length
  const pomodoroMinutes = todayEvents
    .filter(e => e.type === 'pomodoro:completed')
    .reduce((sum, e) => sum + (e.data.actualDuration || e.data.duration || 25), 0)
  
  if (tasksCompleted >= patterns.avgTasksPerDay) {
    return `Belle journée ! ${tasksCompleted} tâches accomplies. Repose-toi bien. 🌙`
  }
  
  if (tasksCompleted > 0) {
    return `${tasksCompleted} tâche${tasksCompleted > 1 ? 's' : ''} aujourd'hui. Chaque pas compte. Bonne soirée ! 🌙`
  }
  
  if (pomodoroMinutes > 0) {
    return `${pomodoroMinutes} minutes de focus aujourd'hui. C'est déjà ça ! Bonne nuit. 🌙`
  }
  
  // Journée sans activité (bienveillant, pas culpabilisant)
  return `Journée calme ? C'est ok, demain est un nouveau jour. Repose-toi bien. 🌙`
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getDayName(day: number): string {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  return days[day]
}

/**
 * Obtient l'emoji approprié pour le ton
 */
export function getToneEmoji(tone: SuggestionTone): string {
  switch (tone) {
    case 'encouraging': return '💪'
    case 'gentle': return '🌿'
    case 'celebratory': return '🎉'
    case 'supportive': return '💙'
    default: return '✨'
  }
}



