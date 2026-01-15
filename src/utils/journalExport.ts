import { JournalEntry } from '../types/journal'

type ExportFormat = 'json' | 'markdown' | 'txt' | 'html'

/**
 * Exporte les entrées de journal dans différents formats
 */
export function exportJournal(entries: JournalEntry[], format: ExportFormat = 'markdown'): void {
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let content: string
  let filename: string
  let mimeType: string

  switch (format) {
    case 'json':
      content = exportAsJSON(sortedEntries)
      filename = `journal-export-${getDateString()}.json`
      mimeType = 'application/json'
      break
    case 'txt':
      content = exportAsText(sortedEntries)
      filename = `journal-export-${getDateString()}.txt`
      mimeType = 'text/plain'
      break
    case 'html':
      content = exportAsHTML(sortedEntries)
      filename = `journal-export-${getDateString()}.html`
      mimeType = 'text/html'
      break
    case 'markdown':
    default:
      content = exportAsMarkdown(sortedEntries)
      filename = `journal-export-${getDateString()}.md`
      mimeType = 'text/markdown'
      break
  }

  downloadFile(content, filename, mimeType)
}

/**
 * Ouvre l'export HTML dans une nouvelle fenêtre pour impression PDF
 */
export function exportJournalForPrint(entries: JournalEntry[]): void {
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const html = exportAsHTML(sortedEntries)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

function getDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function exportAsJSON(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2)
}

function exportAsMarkdown(entries: JournalEntry[]): string {
  const lines: string[] = [
    '# Mon Journal',
    '',
    `> Exporté le ${formatDate(getDateString())}`,
    `> ${entries.length} entrée${entries.length > 1 ? 's' : ''}`,
    '',
    '---',
    ''
  ]

  entries.forEach(entry => {
    lines.push(`## ${formatDate(entry.date)} ${entry.moodEmoji || ''}`)
    lines.push('')

    if (entry.intention || entry.mainGoal) {
      lines.push(`**Réflexion du jour :** ${entry.intention || entry.mainGoal}`)
      lines.push('')
    }

    if (entry.action) {
      lines.push(`**Action :** ${entry.action}`)
      lines.push('')
    }

    // Nouvelles sections structurées
    if (entry.gratitudeText) {
      lines.push('### 💗 Gratitude')
      lines.push(entry.gratitudeText)
      lines.push('')
    }

    if (entry.learningText) {
      lines.push('### 💡 Apprentissage')
      lines.push(entry.learningText)
      lines.push('')
    }

    if (entry.victoryText) {
      lines.push('### 🏆 Victoire')
      lines.push(entry.victoryText)
      lines.push('')
    }

    if (entry.freeNotes) {
      lines.push('### Notes')
      lines.push(entry.freeNotes)
      lines.push('')
    }

    if (entry.reflection && entry.reflection !== entry.intention) {
      lines.push('### Réflexion')
      lines.push(entry.reflection)
      lines.push('')
    }

    // Legacy gratitude array
    if (entry.gratitude && entry.gratitude.length > 0) {
      lines.push('### Gratitudes')
      entry.gratitude.forEach(g => lines.push(`- ${g}`))
      lines.push('')
    }

    if (entry.tags && entry.tags.length > 0) {
      lines.push(`**Tags :** ${entry.tags.map(t => `#${t}`).join(' ')}`)
      lines.push('')
    }

    if (entry.isFavorite) {
      lines.push('⭐ *Entrée favorite*')
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

function exportAsHTML(entries: JournalEntry[]): string {
  const entriesHTML = entries.map(entry => {
    const sections: string[] = []

    if (entry.intention || entry.mainGoal) {
      sections.push(`
        <div class="section main">
          <p>${escapeHtml(entry.intention || entry.mainGoal || '')}</p>
        </div>
      `)
    }

    if (entry.gratitudeText) {
      sections.push(`
        <div class="section gratitude">
          <h4>💗 Gratitude</h4>
          <p>${escapeHtml(entry.gratitudeText)}</p>
        </div>
      `)
    }

    if (entry.learningText) {
      sections.push(`
        <div class="section learning">
          <h4>💡 Apprentissage</h4>
          <p>${escapeHtml(entry.learningText)}</p>
        </div>
      `)
    }

    if (entry.victoryText) {
      sections.push(`
        <div class="section victory">
          <h4>🏆 Victoire</h4>
          <p>${escapeHtml(entry.victoryText)}</p>
        </div>
      `)
    }

    if (entry.freeNotes) {
      sections.push(`
        <div class="section notes">
          <h4>Notes</h4>
          <p>${escapeHtml(entry.freeNotes)}</p>
        </div>
      `)
    }

    const tagsHTML = entry.tags && entry.tags.length > 0
      ? `<div class="tags">${entry.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join(' ')}</div>`
      : ''

    const favoriteHTML = entry.isFavorite ? '<span class="favorite">⭐ Favori</span>' : ''

    return `
      <article class="entry">
        <header>
          <span class="mood">${entry.moodEmoji || '🙂'}</span>
          <div class="date-info">
            <h3>${formatDate(entry.date)}</h3>
            ${favoriteHTML}
          </div>
        </header>
        ${sections.join('')}
        ${tagsHTML}
      </article>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mon Journal - Export ${formatDate(getDateString())}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    header.main-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    header.main-header h1 { font-size: 2em; margin-bottom: 8px; }
    header.main-header p { color: #666; }
    .entry {
      margin-bottom: 32px;
      padding: 24px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      page-break-inside: avoid;
    }
    .entry header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .mood { font-size: 2.5em; }
    .date-info h3 { font-size: 1.1em; font-weight: 600; }
    .favorite {
      display: inline-block;
      font-size: 0.75em;
      color: #f59e0b;
      margin-top: 4px;
    }
    .section { margin-bottom: 16px; }
    .section.main p { font-size: 1.1em; line-height: 1.7; }
    .section h4 {
      font-size: 0.9em;
      font-weight: 600;
      margin-bottom: 8px;
      color: #444;
    }
    .section.gratitude { background: #fdf2f8; padding: 12px 16px; border-radius: 8px; }
    .section.gratitude h4 { color: #be185d; }
    .section.learning { background: #fffbeb; padding: 12px 16px; border-radius: 8px; }
    .section.learning h4 { color: #b45309; }
    .section.victory { background: #ecfdf5; padding: 12px 16px; border-radius: 8px; }
    .section.victory h4 { color: #047857; }
    .section p { white-space: pre-wrap; }
    .tags { margin-top: 16px; }
    .tag {
      display: inline-block;
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.8em;
      color: #6b7280;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    @media print {
      body { padding: 20px; }
      .entry { border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <header class="main-header">
    <h1>📖 Mon Journal</h1>
    <p>Exporté le ${formatDate(getDateString())} • ${entries.length} entrée${entries.length > 1 ? 's' : ''}</p>
  </header>
  <main>
    ${entriesHTML}
  </main>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

function exportAsText(entries: JournalEntry[]): string {
  const lines: string[] = [
    'MON JOURNAL',
    `Exporté le ${formatDate(getDateString())}`,
    `${entries.length} entrée${entries.length > 1 ? 's' : ''}`,
    '',
    '=' .repeat(50),
    ''
  ]

  entries.forEach(entry => {
    lines.push(formatDate(entry.date).toUpperCase())
    lines.push(`Humeur : ${entry.moodEmoji || 'Non renseignée'}`)
    lines.push('')

    if (entry.intention || entry.mainGoal) {
      lines.push(`Intention : ${entry.intention || entry.mainGoal}`)
    }

    if (entry.action) {
      lines.push(`Action : ${entry.action}`)
    }

    if (entry.freeNotes) {
      lines.push('')
      lines.push('Notes :')
      lines.push(entry.freeNotes)
    }

    if (entry.reflection) {
      lines.push('')
      lines.push('Réflexion :')
      lines.push(entry.reflection)
    }

    lines.push('')
    lines.push('-'.repeat(50))
    lines.push('')
  })

  return lines.join('\n')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
