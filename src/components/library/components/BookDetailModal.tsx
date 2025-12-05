import { useState, useRef, useEffect, useCallback } from 'react'
import { X, BookOpen, Star, Clock, Play, Quote, FileText } from 'lucide-react'
import { Book, Quote as QuoteType, ReadingNote } from '../../../types/library'
import { getBookProgress, formatReadingTimeDetailed, formatDateShort } from '../../../utils/libraryFormatters'
import { Button } from '../../ui/Button'
import { Textarea } from '../../ui/Input'

type ModalTab = 'details' | 'quotes' | 'notes'

interface BookDetailModalProps {
  book: Book
  onClose: () => void
  onUpdate: (updates: Partial<Book>) => void
  onDelete: () => void
  onAddQuote: (quote: Omit<QuoteType, 'id' | 'addedAt'>) => void
  onDeleteQuote: (quoteId: string) => void
  onUpdateQuote: (quoteId: string, updates: Partial<QuoteType>) => void
  onAddNote: (note: Omit<ReadingNote, 'id' | 'addedAt'>) => void
  onDeleteNote: (noteId: string) => void
  onStartReading: () => void
  isReadingSession: boolean
}

export function BookDetailModal({ 
  book, 
  onClose, 
  onUpdate,
  onDelete,
  onAddQuote,
  onDeleteQuote,
  onUpdateQuote,
  onAddNote,
  onDeleteNote,
  onStartReading,
  isReadingSession
}: BookDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('details')
  const [isEditingProgress, setIsEditingProgress] = useState(false)
  const [currentPage, setCurrentPage] = useState(book.currentPage || 0)
  const [newQuote, setNewQuote] = useState('')
  const [newQuotePage, setNewQuotePage] = useState('')
  const [newNote, setNewNote] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [editQuoteText, setEditQuoteText] = useState('')
  const [editQuotePage, setEditQuotePage] = useState('')
  
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const progress = getBookProgress(book.currentPage, book.pages)

  // Fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAddQuote = useCallback(() => {
    if (!newQuote.trim()) return
    onAddQuote({ 
      text: newQuote.trim(), 
      page: newQuotePage ? parseInt(newQuotePage, 10) : undefined 
    })
    setNewQuote('')
    setNewQuotePage('')
  }, [newQuote, newQuotePage, onAddQuote])

  const handleAddNote = useCallback(() => {
    if (!newNote.trim()) return
    onAddNote({ content: newNote.trim() })
    setNewNote('')
  }, [newNote, onAddNote])

  const handleUpdateProgress = useCallback(() => {
    if (currentPage >= 0 && (!book.pages || currentPage <= book.pages)) {
      onUpdate({ currentPage })
    }
    setIsEditingProgress(false)
  }, [currentPage, book.pages, onUpdate])

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

  const handleStartEditQuote = useCallback((quoteId: string, text: string, page?: number) => {
    setEditingQuoteId(quoteId)
    setEditQuoteText(text)
    setEditQuotePage(page ? page.toString() : '')
  }, [])

  const handleSaveEditQuote = useCallback(() => {
    if (editingQuoteId && editQuoteText.trim()) {
      onUpdateQuote(editingQuoteId, {
        text: editQuoteText.trim(),
        page: editQuotePage ? parseInt(editQuotePage, 10) : undefined
      })
      setEditingQuoteId(null)
      setEditQuoteText('')
      setEditQuotePage('')
    }
  }, [editingQuoteId, editQuoteText, editQuotePage, onUpdateQuote])

  const handleCancelEditQuote = useCallback(() => {
    setEditingQuoteId(null)
    setEditQuoteText('')
    setEditQuotePage('')
  }, [])

  const tabs = [
    { id: 'details' as const, label: 'Détails', icon: BookOpen },
    { id: 'quotes' as const, label: `Citations (${book.quotes?.length || 0})`, icon: Quote },
    { id: 'notes' as const, label: `Notes (${book.notes?.length || 0})`, icon: FileText },
  ]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
      data-modal="true"
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
            <X className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
          
          <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
            <select
              value={book.status}
              onChange={(e) => handleStatusChange(e.target.value as Book['status'])}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/30 text-white border-none focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
              aria-label="Statut du livre"
            >
              <option value="to-read">📚 À lire</option>
              <option value="reading">📖 En lecture</option>
              <option value="completed">✓ Terminé</option>
              <option value="abandoned">✗ Abandonné</option>
            </select>
            
            {book.status === 'reading' && !isReadingSession && (
              <Button
                variant="warning"
                size="sm"
                icon={Play}
                onClick={onStartReading}
              >
                Lire
              </Button>
            )}
          </div>
          
          {book.totalReadingTime > 0 && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-full">
              <Clock className="w-3 h-3 text-white/70" aria-hidden="true" />
              <span className="text-xs text-white/90">{formatReadingTimeDetailed(book.totalReadingTime)}</span>
            </div>
          )}
        </div>
        
        {/* Titre */}
        <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-2">
          <h2 id="book-detail-title" className="text-xl md:text-2xl font-semibold text-zinc-100">
            {book.title}
          </h2>
          <p className="text-zinc-400">{book.author}</p>
        </div>
        
        {/* Onglets */}
        <div className="flex-shrink-0 px-4 md:px-6 border-b border-zinc-800 overflow-x-auto">
          <div className="flex gap-2 md:gap-4" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'details' ? 'Détails' : tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Contenu scrollable */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* Tab Détails */}
          {activeTab === 'details' && (
            <div 
              className="space-y-6"
              role="tabpanel"
              id="tabpanel-details"
              aria-labelledby="tab-details"
            >
              {/* Progression */}
              {book.pages && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm text-zinc-500">Progression</span>
                    {isEditingProgress ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentPage}
                          onChange={(e) => setCurrentPage(Math.min(book.pages!, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20 px-2 py-1 text-sm bg-zinc-800 text-zinc-200 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          max={book.pages}
                          min={0}
                          aria-label="Page actuelle"
                        />
                        <span className="text-zinc-500 text-sm">/ {book.pages}</span>
                        <Button size="sm" variant="warning" onClick={handleUpdateProgress}>
                          OK
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingProgress(false)}>
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsEditingProgress(true)}
                        className="text-sm text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                      >
                        {book.currentPage || 0} / {book.pages} pages
                      </button>
                    )}
                  </div>
                  <div 
                    className="h-3 bg-zinc-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progression de lecture"
                  >
                    <div 
                      className={`h-full bg-gradient-to-r ${book.coverColor} transition-colors duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-zinc-600 mt-1">{progress}%</p>
                </div>
              )}
              
              {/* Rating */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500 mr-2">Note :</span>
                <div role="radiogroup" aria-label="Noter ce livre" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onUpdate({ rating: star === book.rating ? undefined : star })}
                      className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-0.5"
                      role="radio"
                      aria-checked={star <= (book.rating || 0)}
                      aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                      <Star 
                        className={`w-5 h-5 ${star <= (book.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {book.genre && (
                  <div className="bg-zinc-800/50 rounded-lg px-4 py-3">
                    <span className="text-zinc-500 text-xs">Genre</span>
                    <p className="text-zinc-300">{book.genre}</p>
                  </div>
                )}
                <div className="bg-zinc-800/50 rounded-lg px-4 py-3">
                  <span className="text-zinc-500 text-xs">Sessions</span>
                  <p className="text-zinc-300">{book.sessionsCount || 0}</p>
                </div>
                {book.pages && (
                  <div className="bg-zinc-800/50 rounded-lg px-4 py-3">
                    <span className="text-zinc-500 text-xs">Pages</span>
                    <p className="text-zinc-300">{book.pages}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tab Citations */}
          {activeTab === 'quotes' && (
            <div 
              className="space-y-4"
              role="tabpanel"
              id="tabpanel-quotes"
              aria-labelledby="tab-quotes"
            >
              {/* Ajouter citation */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800">
                <Textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder="Ajouter une citation..."
                  rows={2}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-3">
                  <input
                    type="number"
                    value={newQuotePage}
                    onChange={(e) => setNewQuotePage(e.target.value)}
                    placeholder="Page"
                    className="w-20 px-2 py-1 text-xs bg-zinc-900 text-zinc-300 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    min={1}
                    max={book.pages || 10000}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddQuote}
                    disabled={!newQuote.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
              
              {/* Liste citations */}
              <div className="space-y-3" role="list" aria-label="Citations">
                {book.quotes?.map(quote => (
                  <div 
                    key={quote.id} 
                    className="bg-zinc-800/50 rounded-xl p-4 border-l-2 border-violet-500/50 group"
                    role="listitem"
                  >
                    {editingQuoteId === quote.id ? (
                      // Mode édition
                      <div className="space-y-2">
                        <textarea
                          value={editQuoteText}
                          onChange={(e) => setEditQuoteText(e.target.value)}
                          className="w-full bg-zinc-800 text-zinc-200 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-between">
                          <input
                            type="number"
                            value={editQuotePage}
                            onChange={(e) => setEditQuotePage(e.target.value)}
                            placeholder="Page"
                            className="w-20 px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            min={1}
                            max={book.pages || 10000}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={handleSaveEditQuote}>
                              Sauvegarder
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEditQuote}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Mode lecture
                      <>
                        <blockquote className="text-zinc-300 text-sm italic">"{quote.text}"</blockquote>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-600">
                            {quote.page && `Page ${quote.page}`}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => onUpdateQuote(quote.id, { isFavorite: !quote.isFavorite })}
                              className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 ${quote.isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                              aria-label={quote.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                              aria-pressed={quote.isFavorite}
                            >
                              <Star className={`w-3 h-3 ${quote.isFavorite ? 'fill-amber-400' : ''}`} aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleStartEditQuote(quote.id, quote.text, quote.page)}
                              className="p-1 text-zinc-600 hover:text-violet-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                              aria-label="Modifier cette citation"
                            >
                              <FileText className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => onDeleteQuote(quote.id)}
                              className="p-1 text-zinc-600 hover:text-rose-400 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                              aria-label="Supprimer cette citation"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {(!book.quotes || book.quotes.length === 0) && (
                  <p className="text-center text-zinc-600 py-8 text-sm">
                    Aucune citation pour le moment
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Tab Notes */}
          {activeTab === 'notes' && (
            <div 
              className="space-y-4"
              role="tabpanel"
              id="tabpanel-notes"
              aria-labelledby="tab-notes"
            >
              {/* Ajouter note */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ajouter une note..."
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex justify-end mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
              
              {/* Liste notes */}
              <div className="space-y-3" role="list" aria-label="Notes">
                {book.notes?.map(note => (
                  <div 
                    key={note.id} 
                    className="bg-zinc-800/50 rounded-xl p-4 group"
                    role="listitem"
                  >
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-600">
                        {formatDateShort(note.addedAt)}
                      </span>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                        aria-label="Supprimer cette note"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!book.notes || book.notes.length === 0) && (
                  <p className="text-center text-zinc-600 py-8 text-sm">
                    Aucune note pour le moment
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-t border-zinc-800">
          <Button
            variant={deleteConfirm ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleDelete}
          >
            {deleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
          </Button>
          <Button
            variant={book.isFavorite ? 'warning' : 'ghost'}
            size="sm"
            icon={Star}
            onClick={() => onUpdate({ isFavorite: !book.isFavorite })}
          >
            {book.isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </Button>
        </div>
      </div>
    </div>
  )
}
