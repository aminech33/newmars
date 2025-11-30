import { Palette, Check } from 'lucide-react'
import { useState } from 'react'
import { useStore, AccentTheme } from '../store/useStore'

export function ThemePicker() {
  const { accentTheme, setAccentTheme } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  const themes: { key: AccentTheme; label: string; color: string; gradient: string }[] = [
    { key: 'indigo', label: 'Blue', color: '#5b7fff', gradient: 'from-[#5b7fff] to-[#4d6ee6]' },
    { key: 'cyan', label: 'Cyan', color: '#64d2ff', gradient: 'from-[#64d2ff] to-[#50b8e6]' },
    { key: 'emerald', label: 'Green', color: '#30d158', gradient: 'from-[#30d158] to-[#28b84a]' },
    { key: 'rose', label: 'Pink', color: '#ff375f', gradient: 'from-[#ff375f] to-[#e62e51]' },
    { key: 'violet', label: 'Purple', color: '#bf5af2', gradient: 'from-[#bf5af2] to-[#a64dd9]' },
    { key: 'amber', label: 'Orange', color: '#ff9f0a', gradient: 'from-[#ff9f0a] to-[#e68d09]' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-600 hover:text-zinc-400 transition-all duration-300 rounded-xl hover:bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        title="Changer le thème"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-48 bg-mars-surface rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-scale-in backdrop-blur-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs text-zinc-500 mb-3 px-2">Thème d'accent</p>
            <div className="space-y-1">
              {themes.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => {
                    setAccentTheme(theme.key)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800/50 transition-all duration-300 group"
                >
                  <div 
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}
                  >
                    {accentTheme === theme.key && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
