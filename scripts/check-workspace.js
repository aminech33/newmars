import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.join(__dirname, '..')

console.log('🔍 Vérification du Workspace\n')
console.log('='.repeat(70))

// Vérifier le workspace actuel
const currentDir = process.cwd()
console.log(`\n📂 Workspace actuel: ${currentDir}`)

const expectedDir = 'C:\\Users\\amine\\.cursor\\worktrees\\newmars-1\\iku'
const isCorrectWorkspace = currentDir.toLowerCase() === expectedDir.toLowerCase()

if (isCorrectWorkspace) {
  console.log('✅ Vous êtes dans le bon workspace!')
} else {
  console.error('❌ ATTENTION: Vous n\'êtes PAS dans le bon workspace!')
  console.error(`   Attendu: ${expectedDir}`)
  console.error(`   Actuel:  ${currentDir}`)
  console.error('\n⚠️  Changez de dossier avant de continuer!')
  process.exit(1)
}

// Vérifier les workspaces en double
const cursorWorkspaces = path.join(process.env.USERPROFILE, '.cursor', 'worktrees')
if (fs.existsSync(cursorWorkspaces)) {
  const workspaces = fs.readdirSync(cursorWorkspaces)
    .filter(f => f.includes('newmars'))
  
  if (workspaces.length > 0) {
    console.warn('\n⚠️  ATTENTION: Workspaces en double détectés!')
    workspaces.forEach(ws => {
      console.warn(`   - ${path.join(cursorWorkspaces, ws)}`)
    })
    console.warn('\n💡 Recommandation: Supprimez ces workspaces pour éviter la confusion')
    console.warn('   Commande: Remove-Item -Recurse -Force "' + cursorWorkspaces + '\\newmars*"')
  } else {
    console.log('✅ Aucun workspace en double détecté')
  }
}

// Vérifier Git
const gitDir = path.join(projectDir, '.git')
if (fs.existsSync(gitDir)) {
  console.log('✅ Repository Git détecté')
  
  // Vérifier le statut Git
  try {
    const { execSync } = await import('child_process')
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    const modifiedFiles = status.trim().split('\n').filter(l => l).length
    
    if (modifiedFiles > 0) {
      console.warn(`⚠️  ${modifiedFiles} fichier(s) modifié(s) non commité(s)`)
      console.warn('   Pensez à faire un commit régulièrement!')
    } else {
      console.log('✅ Aucune modification en attente')
    }
  } catch (error) {
    console.warn('⚠️  Impossible de vérifier le statut Git')
  }
} else {
  console.error('❌ ATTENTION: Pas de repository Git détecté!')
  console.error('   Initialisez Git avec: git init')
}

console.log('\n' + '='.repeat(70))
console.log('\n✅ Vérification terminée!\n')


