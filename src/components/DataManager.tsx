import { useState, useRef } from 'react'
import { Download, Upload, AlertTriangle, Check, X } from 'lucide-react'
import { downloadExport, importData, readFile } from '../utils/dataExport'

interface DataManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function DataManager({ isOpen, onClose }: DataManagerProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleExport = () => {
    try {
      downloadExport()
      setStatus('success')
      setMessage('Export téléchargé avec succès !')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setPendingFile(file)
    setShowConfirm(true)
  }

  const handleConfirmImport = async () => {
    if (!pendingFile) return

    try {
      const content = await readFile(pendingFile)
      importData(content)
      setStatus('success')
      setMessage('Import réussi ! Rechargement...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l\'import')
    } finally {
      setShowConfirm(false)
      setPendingFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancelImport = () => {
    setShowConfirm(false)
    setPendingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-mars-surface border border-zinc-800 rounded-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-200">Gestion des données</h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status message */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              status === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-rose-500/10 text-rose-400'
            }`}>
              {status === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Export */}
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Download className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-200 mb-1">Exporter les données</h4>
                <p className="text-xs text-zinc-500 mb-3">
                  Téléchargez une copie de toutes vos données (tâches, événements, habitudes, etc.)
                </p>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                >
                  Télécharger le backup
                </button>
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-200 mb-1">Importer des données</h4>
                <p className="text-xs text-zinc-500 mb-3">
                  Restaurez vos données à partir d'un fichier de backup précédent
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  Sélectionner un fichier
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-zinc-900/30 rounded-lg text-xs text-zinc-500">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              L'import remplacera toutes vos données actuelles. Une sauvegarde automatique sera créée avant l'import.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-mars-surface border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-lg font-medium text-zinc-200">Confirmer l'import</h4>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Cette action remplacera toutes vos données actuelles par celles du fichier sélectionné. Êtes-vous sûr ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                Confirmer l'import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

