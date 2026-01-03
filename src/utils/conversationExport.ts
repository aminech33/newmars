/**
 * 💾 conversationExport - Export complet des conversations
 * Formats: Markdown, JSON, CSV, TXT
 */

import type { Course, Message } from '../types/learning'

/**
 * Exporte une conversation complète en Markdown
 */
export function exportConversationAsMarkdown(course: Course): string {
  const timestamp = new Date().toLocaleString('fr-FR')
  const duration = Math.round(course.totalTimeSpent / 60)
  
  let markdown = `# 💬 Conversation - ${course.name}\n\n`
  markdown += `> **Exporté le** : ${timestamp}\n`
  markdown += `> **Durée totale** : ${duration}h\n`
  markdown += `> **Messages** : ${course.messages.length}\n`
  markdown += `> **Niveau** : ${course.level}\n\n`
  markdown += `---\n\n`
  
  // Ajouter chaque message
  course.messages.forEach((msg, index) => {
    const date = new Date(msg.timestamp).toLocaleString('fr-FR')
    const role = msg.role === 'user' ? '🧑 Vous' : '🤖 Assistant'
    
    markdown += `## Message ${index + 1} - ${role}\n`
    markdown += `*${date}*\n\n`
    markdown += `${msg.content}\n\n`
    
    // Ajouter metadata si présente
    if (msg.liked) {
      markdown += `❤️ *Message aimé*\n\n`
    }
    
    if (msg.codeBlocks && msg.codeBlocks.length > 0) {
      markdown += `📝 *Contient ${msg.codeBlocks.length} bloc(s) de code*\n\n`
    }
    
    markdown += `---\n\n`
  })
  
  markdown += `\n## 📊 Statistiques\n\n`
  markdown += `- **Total messages** : ${course.messages.length}\n`
  markdown += `- **Messages utilisateur** : ${course.messages.filter(m => m.role === 'user').length}\n`
  markdown += `- **Réponses IA** : ${course.messages.filter(m => m.role === 'assistant').length}\n`
  markdown += `- **Durée** : ${duration}h\n`
  markdown += `- **Maîtrise** : ${course.currentMastery || 0}%\n`
  
  return markdown
}

/**
 * Exporte une conversation complète en JSON
 */
export function exportConversationAsJSON(course: Course): string {
  const exportData = {
    metadata: {
      courseName: course.name,
      courseDescription: course.description,
      level: course.level,
      icon: course.icon,
      color: course.color,
      exportedAt: new Date().toISOString(),
      totalTimeSpent: course.totalTimeSpent,
      messagesCount: course.messages.length,
      currentMastery: course.currentMastery || 0,
      streak: course.streak,
      sessionsCount: course.sessionsCount
    },
    messages: course.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      timestampFormatted: new Date(msg.timestamp).toISOString(),
      liked: msg.liked || false,
      codeBlocks: msg.codeBlocks || [],
      savedAsNote: msg.savedAsNote || false
    })),
    stats: {
      totalMessages: course.messages.length,
      userMessages: course.messages.filter(m => m.role === 'user').length,
      assistantMessages: course.messages.filter(m => m.role === 'assistant').length,
      likedMessages: course.messages.filter(m => m.liked).length,
      messagesWithCode: course.messages.filter(m => m.codeBlocks && m.codeBlocks.length > 0).length
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Exporte une conversation complète en CSV
 */
export function exportConversationAsCSV(course: Course): string {
  let csv = 'Index,Rôle,Date,Heure,Contenu,Aimé,Blocs code\n'
  
  course.messages.forEach((msg, index) => {
    const date = new Date(msg.timestamp)
    const dateStr = date.toLocaleDateString('fr-FR')
    const timeStr = date.toLocaleTimeString('fr-FR')
    const role = msg.role === 'user' ? 'Utilisateur' : 'Assistant'
    
    // Échapper les guillemets et retours à la ligne dans le contenu
    const content = msg.content
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .substring(0, 200) // Limiter à 200 chars pour CSV
    
    const liked = msg.liked ? 'Oui' : 'Non'
    const codeBlocks = msg.codeBlocks ? msg.codeBlocks.length : 0
    
    csv += `${index + 1},"${role}","${dateStr}","${timeStr}","${content}","${liked}",${codeBlocks}\n`
  })
  
  return csv
}

/**
 * Exporte une conversation complète en TXT simple
 */
export function exportConversationAsTXT(course: Course): string {
  const timestamp = new Date().toLocaleString('fr-FR')
  
  let txt = `═══════════════════════════════════════════════\n`
  txt += `  CONVERSATION - ${course.name.toUpperCase()}\n`
  txt += `═══════════════════════════════════════════════\n\n`
  txt += `Exporté le : ${timestamp}\n`
  txt += `Messages : ${course.messages.length}\n`
  txt += `Durée : ${Math.round(course.totalTimeSpent / 60)}h\n`
  txt += `Niveau : ${course.level}\n\n`
  txt += `───────────────────────────────────────────────\n\n`
  
  course.messages.forEach((msg, index) => {
    const date = new Date(msg.timestamp).toLocaleString('fr-FR')
    const role = msg.role === 'user' ? '[VOUS]' : '[IA]'
    
    txt += `${role} ${date}\n`
    txt += `${'─'.repeat(47)}\n`
    txt += `${msg.content}\n\n`
  })
  
  txt += `\n═══════════════════════════════════════════════\n`
  txt += `FIN DE LA CONVERSATION\n`
  txt += `═══════════════════════════════════════════════\n`
  
  return txt
}

/**
 * Télécharge le fichier exporté
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporte une conversation dans le format spécifié
 */
export function exportConversation(
  course: Course,
  format: 'markdown' | 'json' | 'csv' | 'txt' = 'markdown'
): void {
  const timestamp = new Date().toISOString().split('T')[0]
  const safeName = course.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  
  let content: string
  let filename: string
  let mimeType: string
  
  switch (format) {
    case 'markdown':
      content = exportConversationAsMarkdown(course)
      filename = `conversation_${safeName}_${timestamp}.md`
      mimeType = 'text/markdown'
      break
      
    case 'json':
      content = exportConversationAsJSON(course)
      filename = `conversation_${safeName}_${timestamp}.json`
      mimeType = 'application/json'
      break
      
    case 'csv':
      content = exportConversationAsCSV(course)
      filename = `conversation_${safeName}_${timestamp}.csv`
      mimeType = 'text/csv'
      break
      
    case 'txt':
      content = exportConversationAsTXT(course)
      filename = `conversation_${safeName}_${timestamp}.txt`
      mimeType = 'text/plain'
      break
      
    default:
      throw new Error(`Format non supporté: ${format}`)
  }
  
  downloadFile(content, filename, mimeType)
}

/**
 * Statistiques de la conversation
 */
export function getConversationStats(course: Course) {
  const messages = course.messages
  const userMessages = messages.filter(m => m.role === 'user')
  const aiMessages = messages.filter(m => m.role === 'assistant')
  const likedMessages = messages.filter(m => m.liked)
  
  // Calculer longueur moyenne
  const avgUserLength = userMessages.length > 0
    ? Math.round(userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length)
    : 0
  
  const avgAiLength = aiMessages.length > 0
    ? Math.round(aiMessages.reduce((sum, m) => sum + m.content.length, 0) / aiMessages.length)
    : 0
  
  // Trouver le message le plus long
  const longestMessage = messages.reduce((longest, msg) => 
    msg.content.length > longest.content.length ? msg : longest
  , messages[0])
  
  // Calculer activité par jour
  const messagesByDate: Record<string, number> = {}
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString('fr-FR')
    messagesByDate[date] = (messagesByDate[date] || 0) + 1
  })
  
  return {
    total: messages.length,
    userMessages: userMessages.length,
    aiMessages: aiMessages.length,
    likedMessages: likedMessages.length,
    avgUserLength,
    avgAiLength,
    longestMessage: longestMessage?.content.length || 0,
    daysActive: Object.keys(messagesByDate).length,
    messagesByDate
  }
}

