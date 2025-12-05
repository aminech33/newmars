import { JournalPrompt } from '../types/journal'

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // Gratitude
  { id: 'g1', question: 'Quelle est la plus belle chose qui te soit arrivée cette semaine ?', category: 'gratitude', icon: '💝' },
  { id: 'g2', question: 'Quelle personne a eu un impact positif sur ta journée ?', category: 'gratitude', icon: '🤗' },
  { id: 'g3', question: 'Quel petit plaisir simple as-tu apprécié aujourd\'hui ?', category: 'gratitude', icon: '☕' },
  { id: 'g4', question: 'Pour quelle compétence ou talent es-tu reconnaissant(e) ?', category: 'gratitude', icon: '✨' },
  
  // Goals
  { id: 'go1', question: 'Quel est ton objectif prioritaire pour demain ?', category: 'goal', icon: '🎯' },
  { id: 'go2', question: 'Quelle habitude veux-tu développer ce mois-ci ?', category: 'goal', icon: '🌱' },
  { id: 'go3', question: 'Comment peux-tu avancer vers tes rêves aujourd\'hui ?', category: 'goal', icon: '🚀' },
  { id: 'go4', question: 'Quel défi veux-tu relever cette semaine ?', category: 'goal', icon: '⛰️' },
  
  // Reflection
  { id: 'r1', question: 'Qu\'est-ce qui t\'a surpris aujourd\'hui ?', category: 'reflection', icon: '😮' },
  { id: 'r2', question: 'Comment te sens-tu vraiment en ce moment ?', category: 'reflection', icon: '💭' },
  { id: 'r3', question: 'Quelle émotion as-tu le plus ressentie aujourd\'hui ?', category: 'reflection', icon: '🎭' },
  { id: 'r4', question: 'Si tu pouvais revivre un moment d\'aujourd\'hui, lequel serait-ce ?', category: 'reflection', icon: '⏰' },
  { id: 'r5', question: 'Qu\'aimerais-tu dire à ton moi d\'il y a un an ?', category: 'reflection', icon: '📝' },
  
  // Learning
  { id: 'l1', question: 'Quelle leçon importante as-tu apprise récemment ?', category: 'learning', icon: '💡' },
  { id: 'l2', question: 'Quelle erreur t\'a permis de grandir ?', category: 'learning', icon: '🎓' },
  { id: 'l3', question: 'Qu\'as-tu découvert sur toi-même aujourd\'hui ?', category: 'learning', icon: '🔍' },
  { id: 'l4', question: 'Quel livre, podcast ou conversation t\'a marqué(e) ?', category: 'learning', icon: '📚' },
  
  // Victory
  { id: 'v1', question: 'Quelle est ta plus grande fierté aujourd\'hui ?', category: 'victory', icon: '🏆' },
  { id: 'v2', question: 'Quel obstacle as-tu surmonté récemment ?', category: 'victory', icon: '💪' },
  { id: 'v3', question: 'Quand t\'es-tu senti(e) le/la plus fort(e) cette semaine ?', category: 'victory', icon: '⚡' },
  { id: 'v4', question: 'Quel progrès, même minime, as-tu réalisé ?', category: 'victory', icon: '📈' },
]

// Get random prompt
export const getRandomPrompt = (): JournalPrompt => {
  const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length)
  return JOURNAL_PROMPTS[randomIndex]
}

// Get prompt by category
export const getPromptsByCategory = (category: JournalPrompt['category']): JournalPrompt[] => {
  return JOURNAL_PROMPTS.filter(p => p.category === category)
}

// Get daily prompt (same prompt for the whole day)
export const getDailyPrompt = (): JournalPrompt => {
  const today = new Date().toISOString().split('T')[0]
  const daysSinceEpoch = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24))
  const index = daysSinceEpoch % JOURNAL_PROMPTS.length
  return JOURNAL_PROMPTS[index]
}


