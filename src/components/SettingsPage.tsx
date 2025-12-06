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

type SettingsSection = 'appearance' | 'notifications' | 'pomodoro' | 'data' | 'goals' | 'shortcuts' | 'app' | 'privacy' | 'about'

const sections = [
  { id: 'appearance', label: 'Apparence', icon: Palette, color: 'violet' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'amber' },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer, color: 'rose' },
  { id: 'data', label: 'Données', icon: Database, color: 'cyan' },
  { id: 'goals', label: 'Objectifs', icon: Target, color: 'emerald' },
  { id: 'shortcuts', label: 'Raccourcis', icon: Keyboard, color: 'indigo' },
  { id: 'app', label: 'Application', icon: Monitor, color: 'blue' },
  { id: 'privacy', label: 'Confidentialité', icon: Shield, color: 'orange' },
  { id: 'about', label: 'À propos', icon: Info, color: 'zinc' },
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
  
  // États locaux pour les paramètres (à connecter au store plus tard)
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [pomodoroWork, setPomodoroWork] = useState(25)
  const [pomodoroBreak, setPomodoroBreak] = useState(5)
  const [pomodoroLongBreak, setPomodoroLongBreak] = useState(15)
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(4)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [booksGoal, setBooksGoal] = useState(readingGoal?.targetBooks || 12)
  const [pomodoroGoal, setPomodoroGoal] = useState(4)
  const [launchAtStartup, setLaunchAtStartup] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  
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
  
  const handleBooksGoalChange = (value: number) => {
    setBooksGoal(value)
    setReadingGoal({ year: new Date().getFullYear(), targetBooks: value })
  }

  const accentColors = [
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { id: 'emerald', label: 'Émeraude', class: 'bg-emerald-500' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
    { id: 'amber', label: 'Ambre', class: 'bg-amber-500' },
  ]

  const shortcuts = [
    { key: '⌘/Ctrl + T', action: 'Ouvrir les tâches' },
    { key: '⌘/Ctrl + J', action: 'Ouvrir Ma Journée' },
    { key: '⌘/Ctrl + P', action: 'Ouvrir Pomodoro' },
    { key: '⌘/Ctrl + L', action: 'Ouvrir la bibliothèque' },
    { key: '⌘/Ctrl + I', action: 'Ouvrir l\'assistant IA' },
    { key: '⌘/Ctrl + D', action: 'Ouvrir le Dashboard' },
    { key: '⌘/Ctrl + K', action: 'Recherche rapide' },
    { key: 'Esc', action: 'Retour au Hub' },
    { key: '1-9', action: 'Navigation rapide (Dashboard)' },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Thème" description="Personnalisez l'apparence de l'application">
              <SettingRow label="Mode sombre" description="Activer le thème sombre">
                <Toggle enabled={darkMode} onChange={setDarkMode} label="Mode sombre" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Couleur d'accent" description="Choisissez votre couleur préférée">
              <div className="flex gap-3 flex-wrap">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccentTheme(color.id as any)}
                    className={`w-10 h-10 rounded-xl ${color.class} transition-transform hover:scale-110 ${
                      accentTheme === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Interface" description="Ajustez l'interface à vos préférences">
              <SettingRow label="Animations" description="Activer les animations et transitions">
                <Toggle enabled={true} onChange={() => {}} label="Animations" />
              </SettingRow>
              <SettingRow label="Confettis" description="Afficher des confettis lors des accomplissements">
                <Toggle enabled={true} onChange={() => {}} label="Confettis" />
              </SettingRow>
            </SettingCard>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingCard title="Notifications" description="Gérez vos alertes et rappels">
              <SettingRow label="Activer les notifications" description="Recevoir des notifications de l'application">
                <Toggle enabled={notifications} onChange={setNotifications} label="Notifications" />
              </SettingRow>
              <SettingRow label="Sons" description="Jouer un son pour les notifications">
                <Toggle enabled={soundEnabled} onChange={setSoundEnabled} label="Sons" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Rappels" description="Configurez vos rappels automatiques">
              <SettingRow label="Rappels Pomodoro" description="Notification à la fin de chaque session">
                <Toggle enabled={true} onChange={() => {}} label="Rappels Pomodoro" />
              </SettingRow>
              <SettingRow label="Rappels d'habitudes" description="Rappel quotidien pour vos habitudes">
                <Toggle enabled={true} onChange={() => {}} label="Rappels habitudes" />
              </SettingRow>
              <SettingRow label="Rappels de deadline" description="Alerte avant l'échéance des tâches">
                <Toggle enabled={true} onChange={() => {}} label="Rappels deadline" />
              </SettingRow>
            </SettingCard>
          </div>
        )

      case 'pomodoro':
        return (
          <div className="space-y-4">
            <SettingCard title="Durées" description="Personnalisez vos sessions de travail">
              <SettingRow label={`Travail: ${pomodoroWork} min`} description="Durée d'une session de travail">
                <div className="w-32">
                  <Slider value={pomodoroWork} onChange={setPomodoroWork} min={15} max={60} step={5} />
                </div>
              </SettingRow>
              <SettingRow label={`Pause courte: ${pomodoroBreak} min`} description="Durée de la pause entre les sessions">
                <div className="w-32">
                  <Slider value={pomodoroBreak} onChange={setPomodoroBreak} min={3} max={15} />
                </div>
              </SettingRow>
              <SettingRow label={`Pause longue: ${pomodoroLongBreak} min`} description="Durée de la pause après plusieurs sessions">
                <div className="w-32">
                  <Slider value={pomodoroLongBreak} onChange={setPomodoroLongBreak} min={10} max={30} step={5} />
                </div>
              </SettingRow>
              <SettingRow label={`Sessions avant pause longue: ${sessionsBeforeLong}`} description="Nombre de sessions avant la grande pause">
                <div className="w-32">
                  <Slider value={sessionsBeforeLong} onChange={setSessionsBeforeLong} min={2} max={6} />
                </div>
              </SettingRow>
            </SettingCard>

            <SettingCard title="Sons" description="Sons de notification Pomodoro">
              <SettingRow label="Son de fin de session" description="Jouer un son à la fin de chaque session">
                <Toggle enabled={soundEnabled} onChange={setSoundEnabled} label="Son fin session" />
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

      case 'goals':
        return (
          <div className="space-y-4">
            <SettingCard title="Objectifs quotidiens" description="Définissez vos objectifs personnels">
              <SettingRow label={`Calories: ${calorieGoal} kcal`} description="Objectif calorique journalier">
                <div className="w-32">
                  <Slider value={calorieGoal} onChange={setCalorieGoal} min={1200} max={4000} step={100} />
                </div>
              </SettingRow>
              <SettingRow label={`Sessions Pomodoro: ${pomodoroGoal}`} description="Sessions de focus par jour">
                <div className="w-32">
                  <Slider value={pomodoroGoal} onChange={setPomodoroGoal} min={1} max={12} />
                </div>
              </SettingRow>
            </SettingCard>

            <SettingCard title="Objectifs annuels" description="Vos grands objectifs">
              <SettingRow label={`Livres à lire: ${booksGoal}`} description="Nombre de livres par an (sauvegardé automatiquement)">
                <div className="w-32">
                  <Slider value={booksGoal} onChange={handleBooksGoalChange} min={1} max={52} />
                </div>
              </SettingRow>
            </SettingCard>
          </div>
        )

      case 'shortcuts':
        return (
          <div className="space-y-4">
            <SettingCard title="Raccourcis clavier" description="Naviguez plus rapidement">
              <div className="space-y-1">
                {shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-400">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </SettingCard>
          </div>
        )

      case 'app':
        return (
          <div className="space-y-4">
            <SettingCard title="Démarrage" description="Comportement au lancement">
              <SettingRow label="Lancer au démarrage" description="Ouvrir IKU au démarrage de Windows">
                <Toggle enabled={launchAtStartup} onChange={setLaunchAtStartup} label="Démarrage auto" />
              </SettingRow>
              <SettingRow label="Minimiser dans la barre" description="Réduire dans la zone de notification">
                <Toggle enabled={minimizeToTray} onChange={setMinimizeToTray} label="Minimiser" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Mises à jour" description="Gardez IKU à jour">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                  <div className="text-left">
                    <p className="text-sm text-zinc-200">Vérifier les mises à jour</p>
                    <p className="text-xs text-zinc-500">Version actuelle: 1.0.0</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </SettingCard>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-4">
            <SettingCard title="Mode hors-ligne" description="Contrôlez vos données">
              <SettingRow label="Mode hors-ligne uniquement" description="Désactiver toute synchronisation cloud">
                <Toggle enabled={offlineMode} onChange={setOfflineMode} label="Hors-ligne" />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Cache" description="Données temporaires">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-zinc-400" />
                  <div className="text-left">
                    <p className="text-sm text-zinc-200">Effacer le cache</p>
                    <p className="text-xs text-zinc-500">Libérer de l'espace</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </SettingCard>
          </div>
        )

      case 'about':
        return (
          <div className="space-y-4">
            <SettingCard title="IKU" description="Votre hub de productivité personnel">
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100">IKU</h3>
                <p className="text-sm text-zinc-500">Version 1.0.0</p>
              </div>
            </SettingCard>

            <SettingCard title="Liens" description="Ressources et support">
              <div className="space-y-2">
                <a href="#" className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-zinc-400" />
                    <span className="text-sm text-zinc-200">GitHub</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </a>
                <a href="#" className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-rose-400" />
                    <span className="text-sm text-zinc-200">Soutenir le projet</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </a>
              </div>
            </SettingCard>

            <div className="text-center text-xs text-zinc-600 py-4">
              Fait avec ❤️ pour la productivité
            </div>
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

