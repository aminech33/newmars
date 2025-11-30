import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.join(__dirname, '..')
const backupDir = path.join(process.env.USERPROFILE, 'newmars-backups')
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
const backupPath = path.join(backupDir, `backup-${timestamp}`)

console.log('📦 Système de Backup Automatique\n')
console.log('='.repeat(70))

// Créer le dossier de backup
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
  console.log(`✅ Dossier de backup créé: ${backupDir}`)
}

console.log(`\n📂 Source: ${projectDir}`)
console.log(`📦 Destination: ${backupPath}`)
console.log('\n⏳ Copie en cours...\n')

try {
  // Copier tout le projet (sauf node_modules, .git, dist)
  execSync(
    `robocopy "${projectDir}" "${backupPath}" /E /XD node_modules .git dist .cursor /XF *.log *.tsbuildinfo /NFL /NDL /NJH /NJS /nc /ns /np`,
    { stdio: 'inherit' }
  )
  
  console.log('\n✅ Backup créé avec succès!')
  
  // Calculer la taille du backup
  const getSize = (dir) => {
    let size = 0
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
      const filePath = path.join(dir, file.name)
      if (file.isDirectory()) {
        size += getSize(filePath)
      } else {
        size += fs.statSync(filePath).size
      }
    }
    return size
  }
  
  const sizeInMB = (getSize(backupPath) / (1024 * 1024)).toFixed(2)
  console.log(`📊 Taille: ${sizeInMB} MB`)
  
} catch (error) {
  // Robocopy exit codes 0-7 are success
  if (error.status > 7) {
    console.error('❌ Erreur lors du backup:', error.message)
    process.exit(1)
  }
}

// Garder seulement les 7 derniers backups
console.log('\n🗑️  Nettoyage des anciens backups...')
const backups = fs.readdirSync(backupDir)
  .filter(f => f.startsWith('backup-'))
  .map(f => ({
    name: f,
    path: path.join(backupDir, f),
    time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time)

if (backups.length > 7) {
  const toDelete = backups.slice(7)
  toDelete.forEach(backup => {
    fs.rmSync(backup.path, { recursive: true, force: true })
    console.log(`   🗑️  Supprimé: ${backup.name}`)
  })
  console.log(`✅ ${toDelete.length} ancien(s) backup(s) supprimé(s)`)
} else {
  console.log('✅ Aucun ancien backup à supprimer')
}

console.log('\n' + '='.repeat(70))
console.log(`\n✅ BACKUP TERMINÉ!`)
console.log(`📁 Emplacement: ${backupPath}`)
console.log(`📊 Total de backups: ${backups.length}`)
console.log('\n💡 Conseil: Exécutez ce script régulièrement pour protéger votre travail\n')


