/**
 * 🗣️ AI pour apprentissage des langues
 */

import { LanguageCourse, LanguageLevel, LANGUAGE_INFO } from '../types/languages'
import { generateGeminiStreamingResponse } from './geminiAI'

export interface LanguageLearningContext {
  course: {
    targetLanguage: string
    nativeLanguage: string
    level: LanguageLevel
    isRTL: boolean
    usesPinyin: boolean
    usesRomaji: boolean
  }
  progress: {
    wordsLearned: number
    conversationMinutes: number
    exercisesCompleted: number
    currentStreak: number
  }
  recentVocabulary: Array<{
    word: string
    translation: string
  }>
}

/**
 * Génère une réponse IA pour l'apprentissage des langues
 */
export async function generateLanguageLearningResponse(
  context: LanguageLearningContext,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const languageInfo = LANGUAGE_INFO[context.course.targetLanguage as keyof typeof LANGUAGE_INFO]
  
  // Build specialized prompt for language learning
  const systemPrompt = `Tu es un professeur de ${languageInfo.nativeName} (${languageInfo.name}) EXCELLENT et BIENVEILLANT.

📋 CONTEXTE DE L'ÉTUDIANT :
- Niveau : ${context.course.level}
- Langue maternelle : ${context.course.nativeLanguage === 'french' ? 'Français' : context.course.nativeLanguage}
- Mots appris : ${context.progress.wordsLearned}
- Temps de conversation : ${Math.floor(context.progress.conversationMinutes / 60)}h${context.progress.conversationMinutes % 60}min
- Exercices complétés : ${context.progress.exercisesCompleted}
- Série actuelle : ${context.progress.currentStreak} jours

${context.recentVocabulary.length > 0 ? `
📚 VOCABULAIRE RÉCENT :
${context.recentVocabulary.slice(0, 10).map(v => `- ${v.word} = ${v.translation}`).join('\n')}
` : ''}

🎯 TES RÈGLES STRICTES :

1. **LANGUE** : Parle UNIQUEMENT en ${languageInfo.nativeName}
   - Utilise des phrases SIMPLES pour ${context.course.level}
   - Adapte le vocabulaire au niveau (pas de mots complexes pour A1-A2)
   - Si RTL: ${context.course.isRTL ? 'OUI, respecte l\'écriture de droite à gauche' : 'NON'}
   ${context.course.usesPinyin ? '- Ajoute le Pinyin entre parenthèses pour les débutants (A1-A2)' : ''}
   ${context.course.usesRomaji ? '- Ajoute le Romaji entre parenthèses pour les débutants (A1-A2)' : ''}

2. **CORRECTIONS** : Corrige avec DOUCEUR
   - NE DIS JAMAIS "C'est faux" ou "Non"
   - Utilise : "Presque ! On dit plutôt..." ou "Bonne idée ! Une meilleure façon serait..."
   - Explique POURQUOI la correction (grammaire, contexte, etc.)
   - Donne un exemple supplémentaire

3. **PÉDAGOGIE SOCRATIQUE** :
   - Pose des questions SIMPLES pour faire pratiquer
   - Encourage TOUJOURS ("Bien !", "Super !", "Excellent progrès !")
   - Célèbre les petites victoires
   - Varie les sujets (quotidien, voyages, hobbies, culture)

4. **ADAPTATION AU NIVEAU** :
${getLevelGuidelines(context.course.level)}

5. **STRUCTURE** :
   - Réponds en 1-3 phrases courtes MAX
   - Pose UNE question à la fin pour continuer
   - Garde la conversation naturelle et fluide
   - Utilise des emoji contextuels (🎉 pour encourager, 🤔 pour réfléchir, etc.)

6. **TRADUCTION** :
   - Ne donne la traduction française QUE si l'étudiant demande explicitement
   - Format : [Phrase en ${languageInfo.nativeName}] 📖 Traduction : [Phrase en français]

MESSAGE DE L'ÉTUDIANT : 
${userMessage}

Réponds MAINTENANT en ${languageInfo.nativeName}, de manière naturelle et encourageante !`

  try {
    let fullResponse = ''
    
    await generateGeminiStreamingResponse(
      systemPrompt,
      (chunk) => {
        fullResponse += chunk
      }
    )
    
    return fullResponse.trim() || `Bonjour ! Comment puis-je t'aider avec le ${languageInfo.name} ?`
    
  } catch (error) {
    console.error('Error generating language learning response:', error)
    throw error
  }
}

/**
 * Retourne les guidelines spécifiques à chaque niveau
 */
function getLevelGuidelines(level: LanguageLevel): string {
  switch (level) {
    case 'A1':
      return `   - Vocabulaire : ~500 mots de base (bonjour, merci, nombres, couleurs, famille)
   - Grammaire : Présent simple uniquement
   - Phrases : 3-5 mots maximum
   - Sujets : Présentations, vie quotidienne basique
   - Exemple : "Je m'appelle Marie. J'ai 25 ans. J'habite à Paris."`
    
    case 'A2':
      return `   - Vocabulaire : ~1000 mots (vie quotidienne, travail simple, loisirs)
   - Grammaire : Présent + passé simple
   - Phrases : 5-8 mots
   - Sujets : Routine, expériences passées simples, plans futurs
   - Exemple : "Hier, je suis allé au cinéma avec mes amis."`
    
    case 'B1':
      return `   - Vocabulaire : ~2000 mots (opinions, émotions, voyages)
   - Grammaire : Tous les temps de base
   - Phrases : 8-12 mots
   - Sujets : Expériences, opinions, rêves, culture
   - Exemple : "Je pense que voyager nous permet de découvrir de nouvelles cultures."`
    
    case 'B2':
      return `   - Vocabulaire : ~4000 mots (abstrait, argumentation)
   - Grammaire : Subjonctif, conditionnel, nuances
   - Phrases : Complexes avec subordonnées
   - Sujets : Débats, analyses, hypothèses
   - Exemple : "Si j'avais su que tu venais, j'aurais préparé quelque chose."`
    
    case 'C1':
      return `   - Vocabulaire : ~8000 mots (idiomes, expressions, nuances)
   - Grammaire : Tous les temps, styles variés
   - Phrases : Naturelles et fluides
   - Sujets : Tout sujet complexe, subtilités culturelles
   - Challenge l'étudiant avec des expressions idiomatiques`
    
    case 'C2':
      return `   - Vocabulaire : >10000 mots (littéraire, technique, régional)
   - Grammaire : Maîtrise parfaite
   - Phrases : Comme un natif
   - Sujets : Philosophie, littérature, politique, humour
   - Parle comme à un égal, introduis des subtilités linguistiques`
    
    default:
      return '   - Adapte-toi au niveau de l\'étudiant'
  }
}

/**
 * Génère un exercice contextuel basé sur le niveau et le vocabulaire
 */
export async function generateContextualExercise(
  context: LanguageLearningContext,
  topic?: string
): Promise<{
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}> {
  const languageInfo = LANGUAGE_INFO[context.course.targetLanguage as keyof typeof LANGUAGE_INFO]
  
  const prompt = `Crée UN exercice pour apprendre le ${languageInfo.name} (niveau ${context.course.level}).

${topic ? `SUJET : ${topic}` : 'SUJET : Vie quotidienne'}

FORMAT JSON STRICT :
{
  "question": "Phrase avec un BLANC à compléter en ${languageInfo.nativeName}",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "option correcte",
  "explanation": "Explication courte en français (pourquoi cette réponse)"
}

RÈGLES :
- Question en ${languageInfo.nativeName}
- Adapté au niveau ${context.course.level}
- Vocabulaire du quotidien
- 4 options plausibles
- Explication claire

Réponds UNIQUEMENT avec le JSON, rien d'autre.`

  try {
    let response = ''
    await generateGeminiStreamingResponse(prompt, (chunk) => {
      response += chunk
    })
    
    // Parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error('Invalid JSON response')
    
  } catch (error) {
    console.error('Error generating exercise:', error)
    // Fallback exercise
    return {
      question: 'Exercice temporairement indisponible',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      explanation: 'Erreur lors de la génération'
    }
  }
}

/**
 * Génère un texte de lecture adapté au niveau
 */
export async function generateReadingText(
  context: LanguageLearningContext,
  topic?: string
): Promise<{
  title: string
  content: string
  vocabulary: Array<{ word: string; translation: string; position: number }>
  estimatedMinutes: number
}> {
  const languageInfo = LANGUAGE_INFO[context.course.targetLanguage as keyof typeof LANGUAGE_INFO]
  
  const prompt = `Crée un texte de lecture en ${languageInfo.nativeName} pour niveau ${context.course.level}.

${topic ? `SUJET : ${topic}` : 'SUJET : Vie quotidienne'}

FORMAT JSON STRICT :
{
  "title": "Titre du texte",
  "content": "Texte complet en ${languageInfo.nativeName} (8-15 phrases)",
  "vocabulary": [
    {"word": "mot difficile", "translation": "traduction française", "position": 0}
  ],
  "estimatedMinutes": 3
}

RÈGLES :
- Adapté au niveau ${context.course.level}
- Texte cohérent et intéressant
- Identifie 8-12 mots clés pour le vocabulaire
- Contenu culturel si possible

Réponds UNIQUEMENT avec le JSON, rien d'autre.`

  try {
    let response = ''
    await generateGeminiStreamingResponse(prompt, (chunk) => {
      response += chunk
    })
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error('Invalid JSON response')
    
  } catch (error) {
    console.error('Error generating reading text:', error)
    throw error
  }
}

