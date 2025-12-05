import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// Fichiers critiques qui NE DOIVENT JAMAIS être vides
const criticalFiles = [
  'src/store/useStore.ts',
  'src/App.tsx',
  'src/main.tsx',
  'src/components/HubV2.tsx',
  'src/components/myday/MyDayPage.tsx',
  'src/components/widgets/JournalWidget.tsx',
  'src/components/WidgetGrid.tsx',
  'src/components/WidgetPicker.tsx',
  'src/components/tasks/TasksPage.tsx',
  'src/components/calendar/CalendarPage.tsx',
  'src/components/health/HealthPage.tsx',
  'src/components/learning/LearningPage.tsx',
  'src/types/journal.ts',
  'src/types/taskRelation.ts',
  'src/types/calendar.ts',
  'src/types/health.ts',
  'src/types/learning.ts',
  'src/types/widgets.ts',
  'src/utils/journalUtils.ts',
  'src/utils/taskRelationUtils.ts',
  'src/utils/calendarIntelligence.ts',
  'src/utils/healthIntelligence.ts',
  'src/utils/taskIntelligence.ts',
  'src/utils/libraryFormatters.ts',
  'src/components/library/LibraryPage.tsx'
]

let hasErrors = false
let hasWarnings = false

console.log('🔍 Validation des fichiers critiques...\n')

for (const file of criticalFiles) {
  const filePath = path.join(rootDir, file)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERREUR: Fichier manquant: ${file}`)
    hasErrors = true
    continue
  }
  
  const content = fs.readFileSync(filePath, 'utf-8').trim()
  const lines = content.split('\n').length
  
  if (content.length === 0) {
    console.error(`❌ ERREUR: Fichier vide: ${file}`)
    hasErrors = true
  } else if (lines < 5) {
    console.warn(`⚠️  ATTENTION: Fichier suspect (${lines} lignes): ${file}`)
    hasWarnings = true
  } else {
    console.log(`✅ OK (${lines} lignes): ${file}`)
  }
}

console.log('\n' + '='.repeat(70))

if (hasErrors) {
  console.error('\n❌ VALIDATION ÉCHOUÉE - Des fichiers sont manquants ou vides!')
  console.error('   Action requise: Restaurez les fichiers depuis Git ou un backup\n')
  process.exit(1)
} else if (hasWarnings) {
  console.warn('\n⚠️  VALIDATION AVEC AVERTISSEMENTS - Vérifiez les fichiers suspects')
  console.warn('   Continuez avec prudence\n')
  process.exit(0)
} else {
  console.log('\n✅ VALIDATION RÉUSSIE - Tous les fichiers sont OK!')
  console.log('   Vous pouvez continuer en toute sécurité\n')
  process.exit(0)
}


