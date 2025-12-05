import { useState, useRef } from 'react'
import { Download, Upload, AlertTriangle, Check } from 'lucide-react'
import { downloadExport, importData, readFile } from '../utils/dataExport'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'

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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestion des données"
        size="md"
      >
        <div className="space-y-4">
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
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Download className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-200 mb-1">Exporter les données</h4>
                <p className="text-xs text-zinc-500 mb-3">
                  Téléchargez une copie de toutes vos données (tâches, événements, habitudes, etc.)
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleExport}
                >
                  Télécharger le backup
                </Button>
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
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
                <Button
                  variant="warning"
                  size="sm"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Sélectionner un fichier
                </Button>
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
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={handleCancelImport}
        onConfirm={handleConfirmImport}
        title="Confirmer l'import"
        message="Cette action remplacera toutes vos données actuelles par celles du fichier sélectionné. Êtes-vous sûr ?"
        confirmText="Confirmer l'import"
        variant="warning"
      />
    </>
  )
}
