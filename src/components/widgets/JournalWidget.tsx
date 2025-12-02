import { memo, useMemo } from 'react'
import { BookOpen, TrendingUp, Star, ArrowRight, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { getTodayEntry, calculateJournalStats } from '../../utils/journalUtils'

interface JournalWidgetProps {
  widget: Widget
}

export const JournalWidget = memo(function JournalWidget({ widget }: JournalWidgetProps) {
  const { id, size = 'small' } = widget
  const { setView, journalEntries } = useStore()
  
  const todayEntry = getTodayEntry(journalEntries)
  const stats = useMemo(() => calculateJournalStats(journalEntries), [journalEntries])
  const recentEntries = journalEntries.slice(-5).reverse()

  // SMALL - Mood first with decorative frame
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('journal')}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          
          {/* FULL DECORATIVE FRAME BORDER - ENHANCED */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="none">
            {/* Corner ornaments - MORE elaborate */}
            {/* Top-left corner */}
            <path d="M 5,5 L 35,5 M 5,5 L 5,35" stroke="white" strokeWidth="2" opacity="0.25" strokeLinecap="round"/>
            <path d="M 8,8 L 28,8 M 8,8 L 8,28" stroke="white" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
            <path d="M 12,12 L 22,12 M 12,12 L 12,22" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="2" fill="white" opacity="0.3"/>
            <path d="M 20,8 Q 18,10 20,12" stroke="white" strokeWidth="0.5" opacity="0.2" fill="none"/>
            
            {/* Top-right corner */}
            <path d="M 195,5 L 165,5 M 195,5 L 195,35" stroke="white" strokeWidth="2" opacity="0.25" strokeLinecap="round"/>
            <path d="M 192,8 L 172,8 M 192,8 L 192,28" stroke="white" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
            <path d="M 188,12 L 178,12 M 188,12 L 188,22" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
            <circle cx="190" cy="10" r="2" fill="white" opacity="0.3"/>
            <path d="M 180,8 Q 182,10 180,12" stroke="white" strokeWidth="0.5" opacity="0.2" fill="none"/>
            
            {/* Bottom-left corner */}
            <path d="M 5,195 L 35,195 M 5,195 L 5,165" stroke="white" strokeWidth="2" opacity="0.25" strokeLinecap="round"/>
            <path d="M 8,192 L 28,192 M 8,192 L 8,172" stroke="white" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
            <path d="M 12,188 L 22,188 M 12,188 L 12,178" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
            <circle cx="10" cy="190" r="2" fill="white" opacity="0.3"/>
            <path d="M 20,192 Q 18,190 20,188" stroke="white" strokeWidth="0.5" opacity="0.2" fill="none"/>
            
            {/* Bottom-right corner */}
            <path d="M 195,195 L 165,195 M 195,195 L 195,165" stroke="white" strokeWidth="2" opacity="0.25" strokeLinecap="round"/>
            <path d="M 192,192 L 172,192 M 192,192 L 192,172" stroke="white" strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
            <path d="M 188,188 L 178,188 M 188,188 L 188,178" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
            <circle cx="190" cy="190" r="2" fill="white" opacity="0.3"/>
            <path d="M 180,192 Q 182,190 180,188" stroke="white" strokeWidth="0.5" opacity="0.2" fill="none"/>
            
            {/* Side decorative elements */}
            <circle cx="8" cy="100" r="1.5" fill="white" opacity="0.25"/>
            <circle cx="192" cy="100" r="1.5" fill="white" opacity="0.25"/>
            <circle cx="100" cy="8" r="1.5" fill="white" opacity="0.25"/>
            <circle cx="100" cy="192" r="1.5" fill="white" opacity="0.25"/>
            
            {/* Decorative curves between corners */}
            <path d="M 40,8 Q 100,6 160,8" stroke="white" strokeWidth="0.5" opacity="0.1" fill="none"/>
            <path d="M 40,192 Q 100,194 160,192" stroke="white" strokeWidth="0.5" opacity="0.1" fill="none"/>
            <path d="M 8,40 Q 6,100 8,160" stroke="white" strokeWidth="0.5" opacity="0.1" fill="none"/>
            <path d="M 192,40 Q 194,100 192,160" stroke="white" strokeWidth="0.5" opacity="0.1" fill="none"/>
          </svg>

          {/* Decorative feather - top right corner */}
          <svg className="absolute top-6 right-6 w-8 h-8 opacity-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 3v18M9 6c0 0 1.5-1.5 3-1.5s3 1.5 3 1.5M9 10c0 0 1.5-1.5 3-1.5s3 1.5 3 1.5M9 14c0 0 1.5-1.5 3-1.5s3 1.5 3 1.5M9 18c0 0 1.5-1 3-1s3 1 3 1"/>
          </svg>
          
          {/* Centered title - beautiful calligraphy */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/20 to-white/20"></div>
            <div className="text-3xl font-normal text-zinc-100 tracking-wide" style={{ 
              fontFamily: "'Great Vibes', 'Dancing Script', 'Tangerine', cursive",
              textShadow: '0 0 15px rgba(255,255,255,0.15)',
              letterSpacing: '0.05em'
            }}>
              Journal
            </div>
            <div className="w-10 h-px bg-gradient-to-l from-transparent via-white/20 to-white/20"></div>
          </div>

          {/* CONTENT - centered with padding */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-8">
            <div className="text-center flex flex-col items-center gap-2">
              {todayEntry ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div className="text-sm text-zinc-300 font-medium">Entrée créée ✓</div>
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div className="text-sm text-zinc-500">Pas d'entrée</div>
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Streak badge at bottom - with ornate frame */}
          {stats.currentStreak > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="relative px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                {/* Corner ornaments on badge */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M 2,2 L 8,2 M 2,2 L 2,8" stroke="white" strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
                  <path d="M 98,2 L 92,2 M 98,2 L 98,8" stroke="white" strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
                  <path d="M 2,38 L 8,38 M 2,38 L 2,32" stroke="white" strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
                  <path d="M 98,38 L 92,38 M 98,38 L 98,32" stroke="white" strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
                </svg>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <span className="text-xs text-zinc-400 font-medium">{stats.currentStreak} jours</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM - Today's entry summary
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title=""
        currentSize={size}
        onClick={() => setView('journal')}
      >
        <div className="h-full flex flex-col gap-3">
          {/* Today's Entry Card */}
          {todayEntry ? (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-4xl">{todayEntry.moodEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white mb-0.5">Aujourd'hui</div>
                  <div className="text-xs text-zinc-400">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
              
              {todayEntry.mainGoal && (
                <div className="mb-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-violet-400 uppercase font-semibold tracking-wide">Objectif</span>
                  <p className="text-xs text-zinc-300 mt-0.5">{todayEntry.mainGoal}</p>
                </div>
              )}
              
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {todayEntry.reflection}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium mb-1">Pas d'entrée aujourd'hui</p>
              <p className="text-xs text-zinc-600">Commencez votre journée</p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto grid grid-cols-3 gap-2">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-lg">🔥</div>
              <div className="text-base font-bold text-white tabular-nums">{stats.currentStreak}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Série</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <TrendingUp className="w-4 h-4 text-violet-400 mx-auto mb-0.5" />
              <div className="text-base font-bold text-white tabular-nums">{stats.totalEntries}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Entrées</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <Star className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
              <div className="text-base font-bold text-white tabular-nums">{stats.favoriteCount}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Favoris</div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // LARGE - Full view with recent entries
  return (
    <WidgetContainer 
      id={id} 
      title=""
      currentSize={size}
      onClick={() => setView('journal')}
    >
      <div className="h-full flex flex-col gap-3">
        {/* Today's Entry */}
        {todayEntry ? (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-5xl">{todayEntry.moodEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-white mb-0.5">Aujourd'hui</div>
                <div className="text-xs text-zinc-500">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
            
            {todayEntry.mainGoal && (
              <div className="mb-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[10px] text-violet-400 uppercase font-semibold tracking-wide">Objectif du jour</span>
                <p className="text-sm text-zinc-300 mt-1">{todayEntry.mainGoal}</p>
              </div>
            )}
            
            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
              {todayEntry.reflection}
            </p>
          </div>
        ) : (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
            <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">Pas d'entrée aujourd'hui</p>
            <p className="text-xs text-zinc-600 mb-3">Prenez un moment pour écrire vos pensées</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setView('journal')
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-white/10"
            >
              Écrire maintenant
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-white tabular-nums">{stats.currentStreak}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Jours</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{stats.totalEntries}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Entrées</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{stats.favoriteCount}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Favoris</div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="flex-1 overflow-auto">
          <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">
            Entrées récentes
          </div>
          <div className="space-y-2">
            {recentEntries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{entry.moodEmoji}</span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  {entry.isFavorite && <Star className="w-3 h-3 text-amber-400 ml-auto" />}
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {entry.reflection}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
