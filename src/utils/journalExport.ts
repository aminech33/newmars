import { JournalEntry } from '../types/journal'

// Export entries to Markdown
export const exportToMarkdown = (entries: JournalEntry[]): string => {
  if (entries.length === 0) {
    return '# Mon Journal\n\nAucune entrée à exporter.'
  }

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let markdown = '# Mon Journal\n\n'
  markdown += `*Exporté le ${new Date().toLocaleDateString('fr-FR')}*\n\n`
  markdown += `**Total d'entrées :** ${entries.length}\n\n`
  markdown += '---\n\n'

  sortedEntries.forEach(entry => {
    markdown += `## ${entry.date} ${entry.moodEmoji || ''}\n\n`

    if (entry.mainGoal) {
      markdown += `**🎯 Objectif du jour :** ${entry.mainGoal}\n\n`
    }

    if (entry.gratitude && entry.gratitude.length > 0) {
      markdown += `**💝 Gratitudes :**\n`
      entry.gratitude.forEach((g, i) => {
        markdown += `${i + 1}. ${g}\n`
      })
      markdown += '\n'
    }

    markdown += `**📝 Réflexion :**\n\n${entry.reflection}\n\n`

    if (entry.learned) {
      markdown += `**💡 J'ai appris :** ${entry.learned}\n\n`
    }

    if (entry.victory) {
      markdown += `**🏆 Victoire :** ${entry.victory}\n\n`
    }

    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags :** ${entry.tags.map(t => `#${t}`).join(', ')}\n\n`
    }

    markdown += '---\n\n'
  })

  return markdown
}

// Export entries to JSON
export const exportToJSON = (entries: JournalEntry[]): string => {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, null, 2)
}

// Download file
export const downloadFile = (content: string, filename: string, mimeType: string) => {
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

// Export to Markdown file
export const exportJournalToMarkdown = (entries: JournalEntry[], filename?: string) => {
  const markdown = exportToMarkdown(entries)
  const date = new Date().toISOString().split('T')[0]
  downloadFile(
    markdown,
    filename || `journal-${date}.md`,
    'text/markdown'
  )
}

// Export to JSON file
export const exportJournalToJSON = (entries: JournalEntry[], filename?: string) => {
  const json = exportToJSON(entries)
  const date = new Date().toISOString().split('T')[0]
  downloadFile(
    json,
    filename || `journal-${date}.json`,
    'application/json'
  )
}

