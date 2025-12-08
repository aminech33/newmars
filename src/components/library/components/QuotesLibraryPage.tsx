import { useState, useMemo } from 'react'
import { ArrowLeft, Search, Star, FileText, X, Plus, BookOpen } from 'lucide-react'
import { Book, Quote } from '../../../types/library'
import { Button } from '../../ui/Button'
import { Textarea } from '../../ui/Input'

interface QuotesLibraryPageProps {
  books: Book[]
  onBack: () => void
  onAddQuote: (bookId: string, quote: Omit<Quote, 'id' | 'addedAt'>) => void
  onUpdateQuote: (bookId: string, quoteId: string, updates: Partial<Quote>) => void
  onDeleteQuote: (bookId: string, quoteId: string) => void
}

type QuoteWithBook = Quote & {
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookCoverColor: string
}

type FilterOption = 'all' | 'favorites' | 'recent'

export function QuotesLibraryPage({ 
  books, 
  onBack, 
  onAddQuote, 
  onUpdateQuote, 
  onDeleteQuote 
}: QuotesLibraryPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOption, setFilterOption] = useState<FilterOption>('all')
  const [selectedBookId, setSelectedBookId] = useState<string>('all')
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [editQuoteText, setEditQuoteText] = useState('')
  const [editQuotePage, setEditQuotePage] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuoteBookId, setNewQuoteBookId] = useState('')
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuotePage, setNewQuotePage] = useState('')

  // Agrégation de toutes les citations avec leurs livres
  const allQuotes = useMemo<QuoteWithBook[]>(() => {
    const quotes: QuoteWithBook[] = []
    books.forEach(book => {
      if (book.quotes) {
        book.quotes.forEach(quote => {
          quotes.push({
            ...quote,
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCoverColor: book.coverColor
          })
        })
      }
    })
    return quotes.sort((a, b) => b.addedAt - a.addedAt)
  }, [books])

  // Filtrage et recherche
  const filteredQuotes = useMemo(() => {
    let result = allQuotes

    // Filtre par livre
    if (selectedBookId !== 'all') {
      result = result.filter(q => q.bookId === selectedBookId)
    }

    // Filtre par favoris / récent
    if (filterOption === 'favorites') {
      result = result.filter(q => q.isFavorite)
    } else if (filterOption === 'recent') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      result = result.filter(q => q.addedAt > weekAgo)
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(q =>
        q.text.toLowerCase().includes(query) ||
        q.bookTitle.toLowerCase().includes(query) ||
        q.bookAuthor.toLowerCase().includes(query)
      )
    }

    return result
  }, [allQuotes, selectedBookId, filterOption, searchQuery])

  const handleStartEditQuote = (quoteId: string, text: string, page?: number) => {
    setEditingQuoteId(quoteId)
    setEditQuoteText(text)
    setEditQuotePage(page ? page.toString() : '')
  }

  const handleSaveEditQuote = (bookId: string, quoteId: string) => {
    if (!editQuoteText.trim()) return
    
    const updates: Partial<Quote> = {
      text: editQuoteText.trim()
    }
    
    if (editQuotePage) {
      updates.page = parseInt(editQuotePage)
    }
    
    onUpdateQuote(bookId, quoteId, updates)
    setEditingQuoteId(null)
    setEditQuoteText('')
    setEditQuotePage('')
  }

  const handleCancelEditQuote = () => {
    setEditingQuoteId(null)
    setEditQuoteText('')
    setEditQuotePage('')
  }

  const handleOpenAddModal = () => {
    setShowAddModal(true)
    setNewQuoteBookId(books.length > 0 ? books[0].id : '')
  }

  const handleAddNewQuote = () => {
    if (!newQuoteText.trim() || !newQuoteBookId) return

    const quote: Omit<Quote, 'id' | 'addedAt'> = {
      text: newQuoteText.trim(),
      page: newQuotePage ? parseInt(newQuotePage) : undefined,
      isFavorite: false
    }

    onAddQuote(newQuoteBookId, quote)
    setShowAddModal(false)
    setNewQuoteText('')
    setNewQuotePage('')
    setNewQuoteBookId('')
  }

  const stats = {
    total: allQuotes.length,
    favorites: allQuotes.filter(q => q.isFavorite).length,
    booksWithQuotes: new Set(allQuotes.map(q => q.bookId)).size
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950/20">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Retour à la bibliothèque"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Bibliothèque de Citations</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {stats.total} citations • {stats.booksWithQuotes} livres • {stats.favorites} favoris
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              disabled={books.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une citation
            </Button>
          </div>

          {/* Recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les citations..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Filtre par livre */}
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">Tous les livres</option>
              {books.filter(b => b.quotes && b.quotes.length > 0).map(book => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.quotes?.length || 0})
                </option>
              ))}
            </select>

            {/* Filtre par type */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterOption('all')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  filterOption === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterOption('favorites')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                  filterOption === 'favorites'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Favoris
              </button>
              <button
                onClick={() => setFilterOption('recent')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  filterOption === 'recent'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Récentes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des citations */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg mb-2">
                {searchQuery || filterOption !== 'all' || selectedBookId !== 'all'
                  ? 'Aucune citation trouvée'
                  : 'Aucune citation pour le moment'}
              </p>
              <p className="text-zinc-600 text-sm">
                {searchQuery || filterOption !== 'all' || selectedBookId !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Ajoutez des citations depuis vos livres'}
              </p>
            </div>
          ) : (
            filteredQuotes.map(quote => (
              <div
                key={`${quote.bookId}-${quote.id}`}
                className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 overflow-hidden group hover:border-violet-500/30 transition-all"
              >
                {editingQuoteId === quote.id ? (
                  // Mode édition
                  <div className="p-5 space-y-3">
                    <textarea
                      value={editQuoteText}
                      onChange={(e) => setEditQuoteText(e.target.value)}
                      className="w-full bg-zinc-800 text-zinc-200 px-4 py-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                      rows={4}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={editQuotePage}
                        onChange={(e) => setEditQuotePage(e.target.value)}
                        placeholder="Page"
                        className="w-24 px-3 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        min={1}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => handleSaveEditQuote(quote.bookId, quote.id)}
                        >
                          Sauvegarder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancelEditQuote}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mode lecture
                  <>
                    {/* En-tête avec info du livre */}
                    <div 
                      className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between"
                      style={{ 
                        background: `linear-gradient(90deg, ${quote.bookCoverColor}15 0%, transparent 100%)` 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: quote.bookCoverColor }}
                        />
                        <div>
                          <h3 className="text-sm font-medium text-zinc-300">
                            {quote.bookTitle}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {quote.bookAuthor}
                          </p>
                        </div>
                      </div>
                      {quote.page && (
                        <span className="text-xs text-zinc-600 font-mono">
                          p. {quote.page}
                        </span>
                      )}
                    </div>

                    {/* Citation */}
                    <div className="px-5 py-4">
                      <blockquote className="text-zinc-300 text-base leading-relaxed italic border-l-2 border-violet-500/50 pl-4">
                        "{quote.text}"
                      </blockquote>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                        <span className="text-xs text-zinc-600">
                          {new Date(quote.addedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onUpdateQuote(quote.bookId, quote.id, { isFavorite: !quote.isFavorite })}
                            className={`p-2 rounded-lg transition-colors ${
                              quote.isFavorite
                                ? 'text-amber-400 hover:bg-amber-500/10'
                                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'
                            }`}
                            aria-label={quote.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          >
                            <Star className={`w-4 h-4 ${quote.isFavorite ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleStartEditQuote(quote.id, quote.text, quote.page)}
                            className="p-2 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                            aria-label="Modifier cette citation"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette citation ?')) {
                                onDeleteQuote(quote.bookId, quote.id)
                              }
                            }}
                            className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            aria-label="Supprimer cette citation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'ajout de citation */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Ajouter une citation</h2>

            <div className="space-y-4">
              {/* Sélection du livre */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Livre
                </label>
                <select
                  value={newQuoteBookId}
                  onChange={(e) => setNewQuoteBookId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.author}
                    </option>
                  ))}
                </select>
              </div>

              {/* Texte de la citation */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Citation
                </label>
                <Textarea
                  value={newQuoteText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewQuoteText(e.target.value)}
                  placeholder="Entrez la citation..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              {/* Numéro de page */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Page (optionnel)
                </label>
                <input
                  type="number"
                  value={newQuotePage}
                  onChange={(e) => setNewQuotePage(e.target.value)}
                  placeholder="Numéro de page"
                  className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  min={1}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNewQuote}
                disabled={!newQuoteText.trim() || !newQuoteBookId}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

