import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, HardDrive, Clock, RefreshCw, Check } from 'lucide-react'
import {
  listBackups,
  getBackupStats,
  performAutoBackup,
  restoreBackup,
  deleteBackup,
  deleteAllBackups,
  exportBackupToFile,
  importBackupFromFile,
  type BackupInfo,
} from '../../utils/autoBackup'
import { useStore } from '../../store/useStore'

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const { addToast } = useStore()

  // Charger les backups
  const loadBackups = () => {
    setBackups(listBackups())
    setStats(getBackupStats())
  }

  useEffect(() => {
    loadBackups()
  }, [])

  // Créer un backup manuel
  const handleCreateBackup = async () => {
    setIsCreating(true)
    
    try {
      const success = performAutoBackup()
      
      if (success) {
        addToast('✅ Backup créé avec succès', 'success')
        loadBackups()
      } else {
        addToast('❌ Erreur lors de la création du backup', 'error')
      }
    } catch (error) {
      console.error('Erreur création backup:', error)
      addToast('❌ Erreur lors de la création du backup', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  // Restaurer un backup
  const handleRestoreBackup = async (backupId: string) => {
    const confirmed = window.confirm(
      '⚠️ Restaurer ce backup remplacera toutes vos données actuelles.\n\nContinuer ?'
    )
    
    if (!confirmed) return
    
    setIsRestoring(backupId)
    
    try {
      const success = restoreBackup(backupId)
      
      if (success) {
        addToast('✅ Backup restauré avec succès', 'success')
        // Recharger la page pour appliquer les changements
        setTimeout(() => window.location.reload(), 1000)
      } else {
        addToast('❌ Erreur lors de la restauration', 'error')
      }
    } catch (error) {
      console.error('Erreur restauration backup:', error)
      addToast('❌ Erreur lors de la restauration', 'error')
    } finally {
      setIsRestoring(null)
    }
  }

  // Supprimer un backup
  const handleDeleteBackup = (backupId: string) => {
    const confirmed = window.confirm('Supprimer ce backup ?')
    if (!confirmed) return
    
    const success = deleteBackup(backupId)
    
    if (success) {
      addToast('🗑️ Backup supprimé', 'success')
      loadBackups()
    } else {
      addToast('❌ Erreur lors de la suppression', 'error')
    }
  }

  // Supprimer tous les backups
  const handleDeleteAllBackups = () => {
    const confirmed = window.confirm(
      '⚠️ Supprimer TOUS les backups ?\n\nCette action est irréversible.'
    )
    if (!confirmed) return
    
    const count = deleteAllBackups()
    addToast(`🗑️ ${count} backups supprimés`, 'success')
    loadBackups()
  }

  // Exporter vers fichier
  const handleExportToFile = (backupId?: string) => {
    exportBackupToFile(backupId)
    addToast('📥 Backup exporté', 'success')
  }

  // Importer depuis fichier
  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const confirmed = window.confirm(
      '⚠️ Importer ce backup remplacera toutes vos données actuelles.\n\nContinuer ?'
    )
    
    if (!confirmed) {
      event.target.value = ''
      return
    }
    
    try {
      const success = await importBackupFromFile(file)
      
      if (success) {
        addToast('✅ Backup importé avec succès', 'success')
        loadBackups()
        // Recharger la page pour appliquer les changements
        setTimeout(() => window.location.reload(), 1000)
      } else {
        addToast('❌ Erreur lors de l\'importation', 'error')
      }
    } catch (error) {
      console.error('Erreur import backup:', error)
      addToast('❌ Erreur lors de l\'importation', 'error')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">💾 Backups</h2>
        <p className="text-gray-400">
          Sauvegardez et restaurez vos données automatiquement
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Statistiques
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Backups</div>
              <div className="text-white text-2xl font-bold">{stats.count}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Taille totale</div>
              <div className="text-white text-2xl font-bold">{stats.totalSize}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Dernier backup</div>
              <div className="text-white text-sm font-medium">{stats.lastBackup}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Backup automatique</div>
              <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                <Check className="w-4 h-4" />
                Actif (quotidien)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isCreating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <HardDrive className="w-4 h-4" />
          )}
          Créer backup maintenant
        </button>

        <button
          onClick={() => handleExportToFile()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter vers fichier
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          Importer depuis fichier
          <input
            type="file"
            accept=".json"
            onChange={handleImportFromFile}
            className="hidden"
          />
        </label>

        {backups.length > 0 && (
          <button
            onClick={handleDeleteAllBackups}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Tout supprimer
          </button>
        )}
      </div>

      {/* Liste des backups */}
      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="p-4 border-b border-zinc-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Backups disponibles ({backups.length})
          </h3>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aucun backup disponible. Créez-en un pour sécuriser vos données.
          </div>
        ) : (
          <div className="divide-y divide-zinc-700">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {new Date(backup.date).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Taille : {backup.size}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportToFile(backup.id)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      title="Exporter vers fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isRestoring === backup.id}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Restaurer ce backup"
                    >
                      {isRestoring === backup.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Supprimer ce backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">ℹ️ Informations</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Les backups sont créés automatiquement chaque jour</li>
          <li>• Les 7 derniers backups sont conservés</li>
          <li>• Vous pouvez exporter un backup vers un fichier pour le sauvegarder ailleurs</li>
          <li>• La restauration remplace toutes vos données actuelles</li>
        </ul>
      </div>
    </div>
  )
}

