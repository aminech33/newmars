/**
 * Utilitaires pour exporter les flashcards en différents formats
 */

import { Flashcard, Course } from '../types/learning'

/**
 * Exporte les flashcards d'un cours en JSON
 */
export function exportFlashcardsAsJSON(course: Course): string {
  const exportData = {
    courseName: course.name,
    courseLevel: course.level,
    exportedAt: new Date().toISOString(),
    flashcards: course.flashcards.map(f => ({
      front: f.front,
      back: f.back,
      hint: f.hint,
      difficulty: f.difficulty,
      reviewCount: f.reviewCount,
      correctCount: f.correctCount,
      successRate: f.reviewCount > 0 ? (f.correctCount / f.reviewCount * 100).toFixed(1) : '0',
      nextReview: f.nextReview,
      createdAt: new Date(f.createdAt).toISOString()
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Exporte les flashcards d'un cours en Markdown
 */
export function exportFlashcardsAsMarkdown(course: Course): string {
  const lines: string[] = []
  
  // Header
  lines.push(`# Flashcards - ${course.name}`)
  lines.push('')
  lines.push(`**Niveau**: ${course.level}`)
  lines.push(`**Total**: ${course.flashcards.length} cartes`)
  lines.push(`**Exporté le**: ${new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Flashcards
  course.flashcards.forEach((flashcard, index) => {
    lines.push(`## Carte ${index + 1}`)
    lines.push('')
    lines.push(`### Question`)
    lines.push('')
    lines.push(flashcard.front)
    lines.push('')
    
    if (flashcard.hint) {
      lines.push(`**💡 Indice**: ${flashcard.hint}`)
      lines.push('')
    }
    
    lines.push(`### Réponse`)
    lines.push('')
    lines.push(flashcard.back)
    lines.push('')
    
    // Stats
    const successRate = flashcard.reviewCount > 0 
      ? (flashcard.correctCount / flashcard.reviewCount * 100).toFixed(0)
      : '0'
    
    lines.push(`**Statistiques**:`)
    lines.push(`- Difficulté: ${'⭐'.repeat(flashcard.difficulty)} (${flashcard.difficulty}/5)`)
    lines.push(`- Révisions: ${flashcard.reviewCount}`)
    lines.push(`- Taux de réussite: ${successRate}%`)
    lines.push(`- Prochaine révision: ${new Date(flashcard.nextReview).toLocaleDateString('fr-FR')}`)
    lines.push('')
    lines.push('---')
    lines.push('')
  })
  
  return lines.join('\n')
}

/**
 * Exporte les flashcards d'un cours en format CSV
 */
export function exportFlashcardsAsCSV(course: Course): string {
  const lines: string[] = []
  
  // Header
  lines.push('Question,Réponse,Indice,Difficulté,Révisions,Correct,Taux réussite (%),Prochaine révision')
  
  // Flashcards
  course.flashcards.forEach(f => {
    const successRate = f.reviewCount > 0 
      ? (f.correctCount / f.reviewCount * 100).toFixed(1)
      : '0'
    
    const csvLine = [
      escapeCsvField(f.front),
      escapeCsvField(f.back),
      escapeCsvField(f.hint || ''),
      f.difficulty,
      f.reviewCount,
      f.correctCount,
      successRate,
      f.nextReview
    ].join(',')
    
    lines.push(csvLine)
  })
  
  return lines.join('\n')
}

/**
 * Exporte les flashcards en format Anki (basique - format texte)
 * Pour un vrai format .apkg, il faudrait utiliser une lib comme genanki
 */
export function exportFlashcardsAsAnkiText(course: Course): string {
  const lines: string[] = []
  
  lines.push(`# deck: ${course.name}`)
  lines.push(`# separator: tab`)
  lines.push(`# tags column: 3`)
  lines.push('')
  
  course.flashcards.forEach(f => {
    const tags = `learning ${course.level}`
    // Format: Front \t Back \t Tags
    lines.push(`${f.front}\t${f.back}\t${tags}`)
  })
  
  return lines.join('\n')
}

/**
 * Télécharge un fichier avec le contenu donné
 */
export function downloadFlashcards(
  filename: string, 
  content: string, 
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  // Cleanup
  URL.revokeObjectURL(url)
}

/**
 * Export rapide avec détection du format
 */
export function exportFlashcards(
  course: Course,
  format: 'json' | 'markdown' | 'csv' | 'anki' = 'markdown'
): void {
  const timestamp = new Date().toISOString().split('T')[0]
  const courseName = course.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  
  let content: string
  let filename: string
  let mimeType: string
  
  switch (format) {
    case 'json':
      content = exportFlashcardsAsJSON(course)
      filename = `flashcards_${courseName}_${timestamp}.json`
      mimeType = 'application/json'
      break
      
    case 'csv':
      content = exportFlashcardsAsCSV(course)
      filename = `flashcards_${courseName}_${timestamp}.csv`
      mimeType = 'text/csv'
      break
      
    case 'anki':
      content = exportFlashcardsAsAnkiText(course)
      filename = `flashcards_${courseName}_${timestamp}.txt`
      mimeType = 'text/plain'
      break
      
    case 'markdown':
    default:
      content = exportFlashcardsAsMarkdown(course)
      filename = `flashcards_${courseName}_${timestamp}.md`
      mimeType = 'text/markdown'
      break
  }
  
  downloadFlashcards(filename, content, mimeType)
}

/**
 * Helper pour échapper les champs CSV
 */
function escapeCsvField(field: string): string {
  // Si le champ contient une virgule, un guillemet ou un saut de ligne, l'entourer de guillemets
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    // Doubler les guillemets existants et entourer de guillemets
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Statistiques pour toutes les flashcards d'un cours
 */
export function getFlashcardsStats(course: Course) {
  const total = course.flashcards.length
  const reviewed = course.flashcards.filter(f => f.reviewCount > 0).length
  const mastered = course.flashcards.filter(f => {
    const successRate = f.reviewCount > 0 
      ? (f.correctCount / f.reviewCount)
      : 0
    return successRate >= 0.8 && f.reviewCount >= 3
  }).length
  
  const dueToday = course.flashcards.filter(f => 
    new Date(f.nextReview).getTime() <= Date.now()
  ).length
  
  const avgSuccessRate = total > 0 
    ? course.flashcards.reduce((sum, f) => {
        const rate = f.reviewCount > 0 ? (f.correctCount / f.reviewCount) : 0
        return sum + rate
      }, 0) / total
    : 0
  
  return {
    total,
    reviewed,
    mastered,
    dueToday,
    avgSuccessRate: Math.round(avgSuccessRate * 100),
    masteryPercentage: total > 0 ? Math.round((mastered / total) * 100) : 0
  }
}










