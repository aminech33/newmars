import { useState, useRef, useEffect, useCallback } from 'react'
import { X, BookOpen, Star, FileText, GraduationCap, Clock } from 'lucide-react'
import { Book, ReadingNote } from '../../../types/library'
import { getBookProgress, formatReadingTimeDetailed } from '../../../utils/libraryFormatters'
import { Button } from '../../ui/Button'
import { GenreBadge } from './GenreBadge'
import { CoverSearchWidget } from './CoverSearchWidget'
import { ProgressEditor } from './ProgressEditor'
import { NotesSection } from './NotesSection'
import { useStore } from '../../../store/useStore'

type ModalTab = 'details' | 'notes'

interface BookDetailModalProps {
  book: Book
  onClose: () => void
  onUpdate: (updates: Partial<Book>) => void
  onDelete: () => void
  onAddNote: (note: Omit<ReadingNote, 'id' | 'addedAt'>) => void
  onDeleteNote: (noteId: string) => void
}

// Genres considérés comme "techniques/éducatifs"
const TECHNICAL_GENRES = [
  'programming', 'science', 'mathematics', 'technology', 
  'education', 'business', 'psychology', 'philosophy',
  'self-help', 'non-fiction', 'technical', 'computer-science'
]

export function BookDetailModal({ 
  book, 
  onClose, 
  onUpdate,
  onDelete,
  onAddNote,
  onDeleteNote
}: BookDetailModalProps) {
  const { addLearningCourse, setView, addToast, projects, addProject } = useStore()
  
  const [activeTab, setActiveTab] = useState<ModalTab>('details')
  const [isEditingProgress, setIsEditingProgress] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const progress = getBookProgress(book.currentPage, book.pages)
  const isTechnicalBook = book.genre && TECHNICAL_GENRES.some(g => 
    book.genre?.toLowerCase().includes(g)
  )
  
  // Créer un cours depuis ce livre
  const handleCreateCourse = useCallback(() => {
    const projectName = `📚 ${book.title}`
    const existingProject = projects.find(p => p.name === projectName)
    
    const projectId = existingProject?.id || addProject({
      name: projectName,
      color: '#8b5cf6',
      icon: '📚'
    })
    
    const now = Date.now()
    const newCourse = {
      id: `course-${now}`,
      name: book.title,
      description: `Cours basé sur "${book.title}" de ${book.author}`,
      icon: '📖',
      color: book.coverColor || 'from-violet-500 to-purple-500',
      level: 'intermediate' as const,
      status: 'active' as const,
      linkedProjectId: projectId,
      codeEnvironment: 'none' as const,
      messages: [],
      flashcards: [],
      notes: [],
      totalTimeSpent: 0,
      lastActiveAt: now,
      streak: 0,
      longestStreak: 0,
      totalReviews: 0,
      sessionsCount: 0,
      messagesCount: 0,
      currentMastery: 0,
      progress: 0,
      createdAt: now,
      updatedAt: now
    }
    
    addLearningCourse(newCourse)
    addToast(`Cours "${book.title}" créé !`, 'success')
    onClose()
    setView('learning')
  }, [book, projects, addProject, addLearningCourse, addToast, onClose, setView])

  // Fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleStatusChange = useCallback((newStatus: Book['status']) => {
    const updates: Partial<Book> = { status: newStatus }
    
    if (newStatus === 'reading' && !book.startedAt) {
      updates.startedAt = Date.now()
    }
    if (newStatus === 'completed') {
      updates.finishedAt = Date.now()
      if (book.pages) updates.currentPage = book.pages
    }
    
    onUpdate(updates)
  }, [book.startedAt, book.pages, onUpdate])

  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      onDelete()
    } else {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 3000)
    }
  }, [deleteConfirm, onDelete])

  const tabs = [
    { id: 'details' as const, label: 'Détails', icon: BookOpen },
    { id: 'notes' as const, label: `Notes (${book.notes?.length || 0})`, icon: FileText },
  ]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header coloré */}
        <div className={`flex-shrink-0 h-28 md:h-32 bg-gradient-to-br ${book.coverColor} relative`}>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
            <select
              value={book.status}
              onChange={(e) => handleStatusChange(e.target.value as Book['status'])}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/30 text-white border-none focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
            >
              <option value="to-read">📚 À lire</option>
              <option value="reading">📖 En lecture</option>
              <option value="completed">✓ Terminé</option>
              <option value="abandoned">✗ Abandonné</option>
            </select>
            
            {isTechnicalBook && (
              <Button
                variant="primary"
                size="sm"
                icon={GraduationCap}
                onClick={handleCreateCourse}
                title="Créer un cours d'apprentissage"
              >
                Créer cours
              </Button>
            )}
          </div>
          
          {book.totalReadingTime > 0 && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-full">
              <Clock className="w-3 h-3 text-white/70" />
              <span className="text-xs text-white/90">{formatReadingTimeDetailed(book.totalReadingTime)}</span>
            </div>
          )}
        </div>
        
        {/* Titre */}
        <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-2">
          <h2 id="book-detail-title" className="text-xl md:text-2xl font-semibold text-zinc-100">
            {book.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-400">{book.author}</p>
            {book.genre && (
              <>
                <span className="text-zinc-700">•</span>
                <GenreBadge genreId={book.genre} size="sm" />
              </>
            )}
          </div>
        </div>
        
        {/* Onglets */}
        <div className="flex-shrink-0 px-4 md:px-6 border-b border-zinc-800">
          <div className="flex gap-4" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Progression */}
              {book.pages && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Progression</h3>
                  {isEditingProgress ? (
                    <ProgressEditor
                      book={book}
                      onUpdate={(currentPage) => {
                        onUpdate({ currentPage })
                        setIsEditingProgress(false)
                      }}
                      onCancel={() => setIsEditingProgress(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingProgress(true)}
                      className="w-full text-left p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-300">
                          Page {book.currentPage || 0} / {book.pages}
                        </span>
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-400">{progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Note */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Note</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onUpdate({ rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (book.rating || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700 hover:text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recherche couverture */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Couverture</h3>
                <CoverSearchWidget
                  bookTitle={book.title}
                  bookAuthor={book.author}
                  onApplyCover={(coverUrl) => onUpdate({ coverUrl })}
                />
              </div>

              {/* Supprimer */}
              <div className="pt-4 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className={deleteConfirm ? 'bg-rose-500/20 text-rose-400' : ''}
                >
                  {deleteConfirm ? 'Confirmer la suppression ?' : 'Supprimer ce livre'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <NotesSection
              notes={book.notes}
              onAddNote={(content) => onAddNote({ content })}
              onDeleteNote={onDeleteNote}
            />
          )}
        </div>
      </div>
    </div>
  )
}
