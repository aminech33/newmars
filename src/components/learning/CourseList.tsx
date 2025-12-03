import { memo, useState } from 'react'
import { Search, Plus, Pin, Archive, MoreVertical, Trash2, Edit2, Filter, SortAsc } from 'lucide-react'
import { Course, CourseStatus } from '../../types/learning'
import { Tooltip } from '../ui/Tooltip'

interface CourseListProps {
  courses: Course[]
  activeCourseId: string | null
  searchQuery: string
  filterStatus: CourseStatus | 'all'
  sortBy: 'recent' | 'name' | 'progress' | 'streak'
  collapsed: boolean
  onSelectCourse: (courseId: string) => void
  onSearchChange: (query: string) => void
  onFilterChange: (status: CourseStatus | 'all') => void
  onSortChange: (sort: 'recent' | 'name' | 'progress' | 'streak') => void
  onCreateCourse: () => void
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
  onPinCourse: (courseId: string) => void
  onArchiveCourse: (courseId: string) => void
}

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
}

const STATUS_FILTERS: { value: CourseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'paused', label: 'En pause' },
  { value: 'completed', label: 'Terminés' },
  { value: 'archived', label: 'Archivés' }
]

const SORT_OPTIONS: { value: 'recent' | 'name' | 'progress' | 'streak'; label: string }[] = [
  { value: 'recent', label: 'Récents' },
  { value: 'name', label: 'Nom' },
  { value: 'progress', label: 'Progression' },
  { value: 'streak', label: 'Streak' }
]

export const CourseList = memo(function CourseList({
  courses,
  activeCourseId,
  searchQuery,
  filterStatus,
  sortBy,
  collapsed,
  onSelectCourse,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onPinCourse,
  onArchiveCourse
}: CourseListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  if (collapsed) {
    return (
      <div className="w-16 bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col items-center py-4 gap-2">
        <Tooltip content="Nouveau cours (Ctrl+N)" side="right">
          <button
            onClick={onCreateCourse}
            className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all"
            aria-label="Nouveau cours"
          >
            <Plus className="w-5 h-5" />
          </button>
        </Tooltip>
        
        <div className="w-8 h-px bg-zinc-800 my-2" />
        
        {courses.slice(0, 8).map((course) => (
          <Tooltip key={course.id} content={course.name} side="right">
            <button
              onClick={() => onSelectCourse(course.id)}
              className={`p-3 rounded-xl transition-all ${
                activeCourseId === course.id
                  ? COLOR_CLASSES[course.color] || COLOR_CLASSES.indigo
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              aria-label={course.name}
              aria-current={activeCourseId === course.id ? 'page' : undefined}
            >
              <span className="text-lg">{course.icon}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    )
  }

  return (
    <aside 
      className="w-64 lg:w-72 xl:w-80 2xl:w-96 bg-zinc-900/30 border-r border-zinc-800/50 flex flex-col h-full transition-all duration-300"
      role="navigation"
      aria-label="Liste des cours"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-200">Mes Cours</h2>
          <Tooltip content="Nouveau cours (Ctrl+N)">
            <button
              onClick={onCreateCourse}
              className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all"
              aria-label="Nouveau cours"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un cours..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            aria-label="Rechercher un cours"
          />
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              showFilters || filterStatus !== 'all'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            aria-expanded={showFilters}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtres
            {filterStatus !== 'all' && (
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => {
              const currentIndex = SORT_OPTIONS.findIndex(o => o.value === sortBy)
              const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length
              onSortChange(SORT_OPTIONS[nextIndex].value)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
            aria-label={`Tri: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}
          >
            <SortAsc className="w-3.5 h-3.5" />
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-zinc-800/30 rounded-xl animate-fade-in">
            <p className="text-xs text-zinc-500 mb-2">Statut</p>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => onFilterChange(filter.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    filterStatus === filter.value
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                  aria-pressed={filterStatus === filter.value}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-2" role="list">
        {courses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-zinc-400 text-sm mb-2">Aucun cours</p>
            <p className="text-zinc-600 text-xs mb-4">
              {searchQuery ? 'Aucun résultat pour cette recherche' : 'Créez votre premier cours pour commencer'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateCourse}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all text-sm"
              >
                Créer un cours
              </button>
            )}
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              role="listitem"
              className={`relative group mb-1 rounded-2xl transition-all ${
                activeCourseId === course.id
                  ? 'bg-zinc-800/70'
                  : 'hover:bg-zinc-800/40'
              }`}
            >
              <button
                onClick={() => onSelectCourse(course.id)}
                className="w-full p-3 text-left"
                aria-current={activeCourseId === course.id ? 'page' : undefined}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-xl ${COLOR_CLASSES[course.color] || COLOR_CLASSES.indigo}`}>
                    <span className="text-lg">{course.icon}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-200 truncate">
                        {course.name}
                      </h3>
                      {course.pinnedAt && (
                        <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" aria-label="Épinglé" />
                      )}
                    </div>
                    
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {course.messagesCount} messages
                    </p>
                    
                    {/* Progress bar */}
                    {course.progress > 0 && (
                      <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500/60 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2">
                      {course.streak > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          🔥 {course.streak}j
                        </span>
                      )}
                      {course.flashcards.length > 0 && (
                        <span className="text-xs text-zinc-600">
                          📇 {course.flashcards.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Actions Menu */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === course.id ? null : course.id)
                  }}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all"
                  aria-label="Options du cours"
                  aria-expanded={menuOpenId === course.id}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpenId === course.id && (
                  <div 
                    className="absolute right-0 top-8 w-40 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-10 animate-scale-in"
                    role="menu"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditCourse(course)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2"
                      role="menuitem"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPinCourse(course.id)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2"
                      role="menuitem"
                    >
                      <Pin className="w-4 h-4" />
                      {course.pinnedAt ? 'Désépingler' : 'Épingler'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchiveCourse(course.id)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2"
                      role="menuitem"
                    >
                      <Archive className="w-4 h-4" />
                      Archiver
                    </button>
                    <div className="h-px bg-zinc-700 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteCourse(course.id)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      role="menuitem"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>{courses.length} cours</span>
          <span>{courses.filter(c => c.status === 'active').length} actifs</span>
        </div>
      </div>
    </aside>
  )
})

