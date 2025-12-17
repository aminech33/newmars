import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { downloadExport, importData, readFile } from '../utils/dataExport'
import { 
  ArrowLeft, 
  Palette, 
  Bell, 
  Timer, 
  Database, 
  Target, 
  Keyboard, 
  Monitor, 
  Shield, 
  Info,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  ExternalLink,
  Github,
  Heart,
  Check,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react'

type SettingsSection = 'appearance' | 'data' | 'advanced'

const sections = [
  { id: 'appearance', label: 'Apparence', icon: Palette, color: 'violet' },
  { id: 'data', label: 'Données', icon: Database, color: 'cyan' },
  { id: 'advanced', label: 'Avancé', icon: SettingsIcon, color: 'zinc' },
] as const

const colorClasses: Record<string, string> = {
  violet: 'text-violet-400 bg-violet-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  cyan: 'text-cyan-400 bg-cyan-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  indigo: 'text-indigo-400 bg-indigo-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  orange: 'text-orange-400 bg-orange-500/10',
  zinc: 'text-zinc-400 bg-zinc-500/10',
}

// Composant Toggle Switch
function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-indigo-500' : 'bg-zinc-700'
      }`}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// Composant Slider
function Slider({ value, onChange, min, max, step = 1, label }: { 
  value: number; 
  onChange: (v: number) => void; 
  min: number; 
  max: number; 
  step?: number;
  label?: string 
}) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      aria-label={label}
    />
  )
}

// Composant Section Card
function SettingCard({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// Composant Row Setting
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { setView, accentTheme, setAccentTheme, readingGoal, setReadingGoal, addToast } = useStore()
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
  
  // États locaux pour les paramètres essentiels
  const [darkMode, setDarkMode] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [confettiEnabled, setConfettiEnabled] = useState(false) // Désactivé par défaut
  
  // Export/Import
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleExport = () => {
    try {
      downloadExport()
      setExportStatus('success')
      setExportMessage('Export téléchargé avec succès !')
      addToast('Données exportées', 'success')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch (error) {
      setExportStatus('error')
      setExportMessage(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    }
  }
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (confirm('Cette action remplacera toutes vos données actuelles. Continuer ?')) {
      try {
        const content = await readFile(file)
        importData(content)
        setExportStatus('success')
        setExportMessage('Import réussi ! Rechargement...')
        addToast('Données importées', 'success')
        setTimeout(() => window.location.reload(), 1500)
      } catch (error) {
        setExportStatus('error')
        setExportMessage(error instanceof Error ? error.message : 'Erreur lors de l\'import')
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  // Palette d'accents limitée et mature
  const accentColors = [
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { id: 'emerald', label: 'Émeraude', class: 'bg-emerald-500' },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="text-sm text-zinc-500 mb-6">
              Réglages essentiels pour la lisibilité et le confort visuel.
            </div>

            <SettingCard title="Thème">
              <SettingRow label="Mode sombre">
                <Toggle enabled={darkMode} onChange={setDarkMode} label="Mode sombre" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Couleur d'accent">
              <div className="flex gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccentTheme(color.id as any)}
                    className={`w-12 h-12 rounded-xl ${color.class} transition-all duration-200 ${
                      accentTheme === color.id 
                        ? 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-zinc-900 scale-105' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={color.label}
                    aria-label={color.label}
                  />
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Confort">
              <SettingRow 
                label="Animations" 
                description="Transitions et mouvements visuels (réduction possible pour accessibilité)"
              >
                <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} label="Animations" />
              </SettingRow>
            </SettingCard>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-4">
            {/* Status message */}
            {exportStatus !== 'idle' && (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                exportStatus === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {exportStatus === 'success' ? (
                  <Check className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{exportMessage}</p>
              </div>
            )}
            
            <SettingCard title="Exporter / Importer" description="Sauvegardez ou restaurez vos données">
              <div className="space-y-3">
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm text-zinc-200">Exporter les données</p>
                      <p className="text-xs text-zinc-500">Télécharger en JSON</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <p className="text-sm text-zinc-200">Importer des données</p>
                      <p className="text-xs text-zinc-500">Restaurer depuis un fichier</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </SettingCard>

            <SettingCard title="Zone de danger" description="Actions irréversibles">
              <button 
                onClick={() => {
                  if (confirm('⚠️ ATTENTION: Cette action supprimera TOUTES vos données (tâches, habitudes, journal, etc.). Cette action est IRRÉVERSIBLE. Continuer ?')) {
                    localStorage.clear()
                    addToast('Données réinitialisées', 'info')
                    setTimeout(() => window.location.reload(), 1000)
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="text-sm text-red-400">Réinitialiser toutes les données</p>
                    <p className="text-xs text-red-400/60">Cette action est irréversible</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </SettingCard>
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="text-sm text-zinc-500 mb-6">
              Options secondaires et fonctionnalités expérimentales.
            </div>

            <SettingCard title="Effets visuels">
              <SettingRow 
                label="Confettis" 
                description="Animations lors des accomplissements (désactivé par défaut)"
              >
                <Toggle enabled={confettiEnabled} onChange={setConfettiEnabled} label="Confettis" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Application">
              <div className="text-center py-6 border-b border-zinc-800/50">
                <p className="text-sm text-zinc-400">Version 1.0.0</p>
              </div>
            </SettingCard>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Standard */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('hub')}
            className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <SettingsIcon className="w-4 h-4 text-teal-400" />
          <h1 className="text-lg font-semibold text-zinc-200">Paramètres</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0 border-r border-zinc-800/50 p-4 overflow-y-auto">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-zinc-800 text-zinc-100' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? colorClasses[section.color] : 'bg-zinc-800/50'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

