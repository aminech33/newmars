/**
 * Utilitaires pour l'export et l'import des données utilisateur
 */

// Clé localStorage utilisée par le store
const STORAGE_KEY = 'newmars-storage'

export interface ExportData {
  version: string
  exportedAt: string
  data: Record<string, unknown>
}

/**
 * Exporte toutes les données du localStorage en JSON
 */
export function exportData(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    throw new Error('Aucune donnée à exporter')
  }

  const exportPayload: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: JSON.parse(stored)
  }

  return JSON.stringify(exportPayload, null, 2)
}

/**
 * Télécharge les données en fichier JSON
 */
export function downloadExport(): void {
  const jsonData = exportData()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `newmars-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Valide les données importées
 */
export function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  if (typeof obj.version !== 'string') return false
  if (typeof obj.exportedAt !== 'string') return false
  if (!obj.data || typeof obj.data !== 'object') return false
  
  return true
}

/**
 * Importe les données depuis un fichier JSON
 */
export function importData(jsonString: string): void {
  let parsed: unknown
  
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Format JSON invalide')
  }

  if (!validateImportData(parsed)) {
    throw new Error('Structure de données invalide')
  }

  // Sauvegarder les données actuelles en backup
  const currentData = localStorage.getItem(STORAGE_KEY)
  if (currentData) {
    localStorage.setItem(`${STORAGE_KEY}-backup-${Date.now()}`, currentData)
  }

  // Importer les nouvelles données
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data))
}

/**
 * Lit un fichier et retourne son contenu
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Impossible de lire le fichier'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

