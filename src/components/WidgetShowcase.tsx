import { useState } from 'react'
import { ArrowLeft, Search, Star, Sparkles, Zap, Layout, CheckCircle2, BookOpen, Clock, Heart, Activity, Brain, Library as LibraryIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { useSpring, config } from 'react-spring'
import { designPacks, type LibraryId, type CategoryId } from './widgetDesignPacks'

/**
 * 🎨 WIDGET SHOWCASE - Design Lab basé sur les widgets du Hub
 * 
 * 53 variations de design (6-8 par widget) pour tester différents styles visuels
 */

export function WidgetShowcase() {
  const { setView } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [selectedLibrary, setSelectedLibrary] = useState<'all' | LibraryId>('all')
  
  // Animation compteur
  const counterAnimation = useSpring({
    from: { number: 0 },
    to: { number: 2847 },
    config: config.slow
  })

  // Comptes dynamiques basés sur les packs de design
  const getCategoryCount = (cat: CategoryId) =>
    designPacks
      .filter(p => p.category === cat || cat === 'all')
      .reduce((sum, p) => sum + p.examples.length, 0)

  // Catégories métier du Hub
  const categories: { id: CategoryId; label: string; icon: typeof Layout; count: number }[] = [
    { id: 'all', label: 'All Widgets', icon: Layout, count: getCategoryCount('all') },
    { id: 'tasks', label: 'Tâches', icon: CheckCircle2, count: getCategoryCount('tasks') },
    { id: 'journal', label: 'Journal', icon: BookOpen, count: getCategoryCount('journal') },
    { id: 'pomodoro', label: 'Pomodoro', icon: Clock, count: getCategoryCount('pomodoro') },
    { id: 'habits', label: 'Habitudes', icon: Heart, count: getCategoryCount('habits') },
    { id: 'health', label: 'Santé', icon: Activity, count: getCategoryCount('health') },
    { id: 'learning', label: 'Apprentissage', icon: Brain, count: getCategoryCount('learning') },
    { id: 'library', label: 'Bibliothèque', icon: LibraryIcon, count: getCategoryCount('library') },
  ]

  const libraries = [
    { id: 'all', label: 'All', color: 'indigo' },
    { id: 'recharts', label: 'Recharts', color: 'blue' },
    { id: 'tremor', label: 'Tremor', color: 'purple' },
    { id: 'framer', label: 'Framer', color: 'pink' },
    { id: 'native', label: 'Native', color: 'emerald' }
  ]

  const DesignExampleCard = ({
    label,
    tag,
    library,
    children
  }: { label: string; tag: string; library: LibraryId; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.35)] hover:border-indigo-500/30 transition-all flex flex-col min-h-[320px]">
      {/* Header compact */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-950/30">
        <div className="text-xs text-zinc-300 font-semibold">{label}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 capitalize">{library}</span>
      </div>
      
      {/* Widget content - avec padding interne pour respirer */}
      <div className="flex-1 bg-zinc-950/50 p-4">{children}</div>
      
      {/* Footer tag */}
      <div className="px-3 py-1.5 border-t border-zinc-800/50 bg-zinc-950/30">
        <div className="text-[10px] text-indigo-400">{tag}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Header avec gradient animé */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAxNmMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTE2IDBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => setView('hub')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Widget Showcase
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              53 variations de design • <span className="text-indigo-400 font-semibold">Recharts</span>, <span className="text-purple-400 font-semibold">Tremor</span>, <span className="text-pink-400 font-semibold">Framer Motion</span> & <span className="text-emerald-400 font-semibold">Native</span>
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search widgets by name, category, or library..."
              className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Categories (Widgets du Hub)</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCategory === cat.id ? 'bg-white/20' : 'bg-zinc-800'
                    }`}>
                      {cat.count}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Libraries */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Libraries</h3>
            <div className="flex flex-wrap gap-2">
              {libraries.map((lib) => (
                <motion.button
                  key={lib.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLibrary(lib.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedLibrary === lib.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {lib.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Packs multi-design par widget */}
        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Widget Design Packs</h3>
            <p className="text-xs text-zinc-500">6-8 variations par widget</p>
          </div>
          <div className="space-y-5">
            {designPacks.map((pack, index) => {
              const visible = pack.examples.filter(ex => selectedLibrary === 'all' || ex.library === selectedLibrary)
              if (visible.length === 0) return null
              if (selectedCategory !== 'all' && selectedCategory !== pack.category) return null
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-indigo-400">{pack.category}</p>
                      <h4 className="text-lg font-semibold text-white">{pack.title}</h4>
                      <p className="text-sm text-zinc-500">{pack.description}</p>
                    </div>
                    <div className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full w-fit">+{visible.length} variations</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visible.map(example => (
                      <DesignExampleCard
                        key={example.id}
                        label={example.label}
                        tag={example.tag}
                        library={example.library}
                      >
                        {example.content}
                      </DesignExampleCard>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl">
            <div>
              <p className="text-2xl font-bold text-white">{designPacks.length}</p>
              <p className="text-xs text-zinc-500">Widgets du Hub</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-2xl font-bold text-white">{designPacks.reduce((sum, p) => sum + p.examples.length, 0)}</p>
              <p className="text-xs text-zinc-500">Design variations</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-zinc-500">Libraries</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

