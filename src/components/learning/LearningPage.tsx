import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, GraduationCap, Clock, BookOpen, Flame, Timer, Settings, Archive, Trash2, PanelLeft, PanelLeftClose } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useLearningData } from '../../hooks/useLearningData'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { CourseModal } from './CourseModal'
import { EmptyState } from './EmptyState'
import { LearningFAB } from './LearningFAB'
import { ProjectWidget } from './ProjectWidget'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Toast, ToastType } from '../ui/Toast'
import { CreateCourseData, Course } from '../../types/learning'
import { generateGeminiStreamingResponse } from '../../utils/geminiAI'

// Hook local pour les toasts (sans Provider)
function useLocalToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])
  
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])
  
  return { toast, showToast, hideToast }
}

// REMOVED: Simulated AI Response - Now using real Gemini API

export function LearningPage() {
  const { setView, projects, addToast } = useStore()
  
  const {
    uiState,
    filteredCourses,
    activeCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePinCourse,
    archiveCourse,
    sendMessage,
    addAIResponse,
    deleteMessage,
    toggleMessageLike,
    createFlashcard,
    createNote,
    setActiveCourse,
    setSearchQuery,
    setFilterStatus,
    setSortBy,
    toggleSidebar,
    setIsTyping
  } = useLearningData()

  // Local UI state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'message'; id: string; courseId?: string } | null>(null)
  
  const { toast, showToast, hideToast } = useLocalToast()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New course
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        setShowCourseModal(true)
      }
      
      // Escape: Close modals or deselect course
      if (e.key === 'Escape') {
        if (showCourseModal) {
          setShowCourseModal(false)
        } else if (confirmDelete) {
          setConfirmDelete(null)
        } else if (activeCourse && window.innerWidth < 1024) {
          setActiveCourse(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCourseModal, confirmDelete, activeCourse, setActiveCourse])

  // Handlers
  const handleCreateCourse = useCallback((data: CreateCourseData) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, data)
      showToast('Cours mis à jour', 'success')
    } else {
      createCourse(data)
      showToast('Cours créé !', 'success')
    }
    setEditingCourse(null)
  }, [editingCourse, updateCourse, createCourse, showToast])

  const handleEditCourse = useCallback((course: Course) => {
    setEditingCourse(course)
    setShowCourseModal(true)
  }, [])

  const handleDeleteCourse = useCallback((courseId: string) => {
    setConfirmDelete({ type: 'course', id: courseId })
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return
    
    if (confirmDelete.type === 'course') {
      deleteCourse(confirmDelete.id)
      showToast('Cours supprimé', 'info')
    } else if (confirmDelete.type === 'message' && confirmDelete.courseId) {
      deleteMessage(confirmDelete.courseId, confirmDelete.id)
    }
    
    setConfirmDelete(null)
  }, [confirmDelete, deleteCourse, deleteMessage, showToast])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeCourse) return

    // Add user message
    await sendMessage(activeCourse.id, content)
    
    // Generate AI response with streaming
    setIsTyping(true)
    
    try {
      // Build conversation history
      const conversationHistory = activeCourse.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      // Build optimized context - prioritize user's system prompt
      let courseContext = ''
      
      if (activeCourse.systemPrompt && activeCourse.systemPrompt.trim()) {
        // User defined their own instructions - use them as primary context
        courseContext = activeCourse.systemPrompt
      } else {
        // Fallback to default context
        const levelText = activeCourse.level === 'beginner' ? 'Débutant' : activeCourse.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'
        courseContext = `Tu es un tuteur IA expert en ${activeCourse.name}. 
Niveau de l'élève: ${levelText}.
${activeCourse.description ? `Contexte: ${activeCourse.description}` : ''}
${activeCourse.topics && activeCourse.topics.length > 0 ? `Sujets: ${activeCourse.topics.map(t => t.name).join(', ')}` : ''}

Réponds de manière pédagogique et claire. Adapte-toi au niveau de l'élève.`
      }

      let fullResponse = ''
      
      // Use streaming to accumulate response
      await generateGeminiStreamingResponse(
        courseContext,
        content,
        conversationHistory,
        (chunk) => {
          fullResponse += chunk
        }
      )
      
      // Add the complete AI response
      addAIResponse(activeCourse.id, fullResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      showToast(errorMessage, 'error')
    } finally {
      setIsTyping(false)
    }
  }, [activeCourse, sendMessage, setIsTyping, addAIResponse, showToast])

  const handleCopyMessage = useCallback((_messageId: string) => {
    showToast('Message copié !', 'success')
  }, [showToast])

  const handleLikeMessage = useCallback((messageId: string) => {
    if (!activeCourse) return
    toggleMessageLike(activeCourse.id, messageId)
  }, [activeCourse, toggleMessageLike])

  const handleSaveAsNote = useCallback((messageId: string) => {
    if (!activeCourse) return
    const message = activeCourse.messages.find(m => m.id === messageId)
    if (message) {
      createNote(activeCourse.id, 'Note depuis conversation', message.content, messageId)
      showToast('Sauvegardé en note !', 'success')
    }
  }, [activeCourse, createNote, showToast])

  const handleCreateFlashcard = useCallback((messageId: string) => {
    if (!activeCourse) return
    const message = activeCourse.messages.find(m => m.id === messageId)
    if (message) {
      // Simple extraction: first line as question, rest as answer
      const lines = message.content.split('\n')
      const front = lines[0].replace(/[*#]/g, '').trim()
      const back = lines.slice(1).join('\n').trim() || 'À compléter...'
      
      createFlashcard(activeCourse.id, front, back, messageId)
      showToast('Flashcard créée !', 'success')
    }
  }, [activeCourse, createFlashcard, showToast])

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!activeCourse) return
    setConfirmDelete({ type: 'message', id: messageId, courseId: activeCourse.id })
  }, [activeCourse])

  const handleArchiveCourse = useCallback(() => {
    if (!activeCourse) return
    archiveCourse(activeCourse.id)
    showToast('Cours archivé', 'info')
  }, [activeCourse, archiveCourse, showToast])

  const handleSettingsCourse = useCallback(() => {
    if (!activeCourse) return
    setEditingCourse(activeCourse)
    setShowCourseModal(true)
  }, [activeCourse])

  const handleQuickChat = useCallback(() => {
    // Quick chat: naviguer vers l'assistant IA général
    setView('ai')
    showToast('Assistant IA ouvert', 'success')
  }, [setView, showToast])

  const handleFlashcards = useCallback(() => {
    // Flashcards: afficher un toast informatif (feature optionnelle)
    showToast('Les flashcards sont générées dans chaque cours', 'info')
  }, [showToast])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Unified */}
      <header className="flex-shrink-0 px-4 py-1.5 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Navigation + Course Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => activeCourse ? setActiveCourse(null) : setView('hub')}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors flex-shrink-0"
              aria-label={activeCourse ? 'Retour aux cours' : 'Retour au hub'}
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            
            {!activeCourse ? (
              <>
                <GraduationCap className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <h1 className="text-base font-semibold text-zinc-200">Apprentissage</h1>
                <span className="text-xs text-zinc-500">{filteredCourses.length} cours</span>
              </>
            ) : (
              <>
                {/* Toggle Sidebar Button */}
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-[background-color] duration-200 flex-shrink-0"
                  aria-label={uiState.sidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
                >
                  {uiState.sidebarCollapsed ? (
                    <PanelLeft className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
                
                {/* Course Icon & Name */}
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                  activeCourse.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                  activeCourse.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                  activeCourse.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                  activeCourse.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                  activeCourse.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  activeCourse.color === 'violet' ? 'bg-violet-500/20 text-violet-400' :
                  activeCourse.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-teal-500/20 text-teal-400'
                }`}>
                  <span className="text-base">{activeCourse.icon}</span>
                </div>
                <h1 className="text-sm font-semibold text-zinc-100 truncate">{activeCourse.name}</h1>
                
                {/* Progress indicator */}
                {activeCourse.progress > 0 && (
                  <span className="text-xs text-zinc-500 flex-shrink-0">{activeCourse.progress}%</span>
                )}
              </>
            )}
          </div>

          {/* Right: Stats + Actions (only when course is active) */}
          {activeCourse && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Stats (hidden on mobile) */}
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.floor(activeCourse.totalTimeSpent / 60) > 0 ? `${Math.floor(activeCourse.totalTimeSpent / 60)}h` : `${activeCourse.totalTimeSpent}min`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{activeCourse.messagesCount}</span>
                </div>
                {activeCourse.streak > 0 && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="font-medium">{activeCourse.streak}</span>
                  </div>
                )}
              </div>

              <div className="hidden md:block w-px h-4 bg-zinc-800" />

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    const linkedProject = projects.find(p => p.id === activeCourse.linkedProjectId)
                    if (!linkedProject) {
                      addToast('⚠️ Aucun projet lié à ce cours', 'warning')
                      return
                    }
                    localStorage.setItem('pomodoro-preselect', JSON.stringify({
                      projectId: activeCourse.linkedProjectId,
                      projectName: linkedProject.name,
                      taskTitle: `Étudier ${activeCourse.name}`,
                      courseId: activeCourse.id,
                      courseName: activeCourse.name
                    }))
                    addToast(`🍅 Pomodoro prêt pour "${activeCourse.name}"`, 'success')
                    setView('pomodoro')
                  }}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Démarrer un Pomodoro"
                >
                  <Timer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleSettingsCourse}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Paramètres"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleArchiveCourse}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Archiver"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteCourse(activeCourse.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Course List */}
        <CourseList
        courses={filteredCourses}
        activeCourseId={uiState.activeCourseId}
        searchQuery={uiState.searchQuery}
        filterStatus={uiState.filterStatus}
        sortBy={uiState.sortBy}
        collapsed={uiState.sidebarCollapsed}
        onSelectCourse={setActiveCourse}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterStatus}
        onSortChange={setSortBy}
        onCreateCourse={() => setShowCourseModal(true)}
        onEditCourse={handleEditCourse}
        onDeleteCourse={handleDeleteCourse}
        onPinCourse={togglePinCourse}
        onArchiveCourse={archiveCourse}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full">
        {activeCourse ? (
          <>
            {/* Chat Area */}
            <CourseChat
              course={activeCourse}
              isTyping={uiState.isTyping}
              onSendMessage={handleSendMessage}
              onCopyMessage={handleCopyMessage}
              onLikeMessage={handleLikeMessage}
              onSaveAsNote={handleSaveAsNote}
              onCreateFlashcard={handleCreateFlashcard}
              onDeleteMessage={handleDeleteMessage}
            />

            {/* Widget Projet (flottant en bas-droite) */}
            <ProjectWidget course={activeCourse} />
          </>
        ) : (
          // Empty State or Course Selection
          <EmptyState onCreateCourse={() => setShowCourseModal(true)} />
        )}
      </main>
      </div>

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        course={editingCourse}
        onClose={() => {
          setShowCourseModal(false)
          setEditingCourse(null)
        }}
        onSubmit={handleCreateCourse}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.type === 'course' ? 'Supprimer le cours ?' : 'Supprimer le message ?'}
        message={
          confirmDelete?.type === 'course'
            ? 'Cette action est irréversible. Tous les messages, notes et flashcards seront perdus.'
            : 'Ce message sera définitivement supprimé.'
        }
        confirmText="Supprimer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}

