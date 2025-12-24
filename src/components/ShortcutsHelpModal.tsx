import { Keyboard, Command } from 'lucide-react'
import { Modal } from './ui/Modal'

interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcutGroups = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Recherche globale' },
      { keys: ['⌘', 'H'], description: 'Retour au Hub' },
      { keys: ['⌘', 'T'], description: 'Aller aux Tâches' },
      { keys: ['⌘', 'P'], description: 'Aller aux Projets' },
      { keys: ['⌘', 'D'], description: 'Aller au Dashboard' },
      { keys: ['⌘', 'J'], description: 'Aller au Journal' },
      { keys: ['⌘', 'L'], description: 'Aller à la Bibliothèque' },
      { keys: ['⌘', 'I'], description: 'Aller à l\'IA' },
      { keys: ['Esc'], description: 'Retour / Fermer modal' },
    ]
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Nouvel élément (contextuel)' },
      { keys: ['⌘', 'Z'], description: 'Annuler' },
      { keys: ['⌘', '⇧', 'Z'], description: 'Refaire' },
      { keys: ['?'], description: 'Afficher cette aide' },
    ]
  },
  {
    title: 'Dans les pages',
    shortcuts: [
      { keys: ['1', '2', '3'], description: 'Changer d\'onglet' },
      { keys: ['M', 'W', 'D'], description: 'Vue Mois/Semaine/Jour (Calendrier)' },
      { keys: ['←', '→'], description: 'Navigation temporelle' },
    ]
  }
]

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Keyboard className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Raccourcis clavier
          </h2>
          <p className="text-xs text-zinc-500">
            Naviguez plus rapidement dans l'application
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Command className="w-3.5 h-3.5" />
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-sm text-zinc-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd 
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded border border-zinc-600 min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded mx-1">?</kbd> ou <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded mx-1">⌘/</kbd> pour afficher cette aide
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Esc</kbd> pour fermer
          </span>
        </div>
      </div>
    </Modal>
  )
}
