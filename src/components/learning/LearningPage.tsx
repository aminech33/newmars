import { useState, useEffect, useCallback } from 'react'
import { useLearningData } from '../../hooks/useLearningData'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { CourseModal } from './CourseModal'
import { EmptyState } from './EmptyState'
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
    setActiveCourse,
    setSearchQuery,
    setFilterStatus,
    setSortBy,
    setIsTyping
  } = useLearningData()

  // Local UI state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'message'; id: string; courseId?: string } | null>(null)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  
  const { toast, showToast, hideToast } = useLocalToast()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+B / Ctrl+B: Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarHidden(prev => !prev)
      }
      
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

  const handleSendMessage = useCallback(async (content: string, codeContext?: { code: string; language: string }) => {
    if (!activeCourse) return

    // Add user message (visible dans le chat - sans le code)
    await sendMessage(activeCourse.id, content)
    
    // Generate AI response with streaming
    setIsTyping(true)
    
    try {
      // Build conversation history
      const conversationHistory = activeCourse.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      // Build optimized context
      let courseContext = ''
      const levelText = activeCourse.level === 'beginner' ? 'Débutant' : activeCourse.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'
      
      if (activeCourse.systemPrompt && activeCourse.systemPrompt.trim()) {
        courseContext = activeCourse.systemPrompt
      } else {
        courseContext = `Tu es un tuteur IA expert en ${activeCourse.name}. 
Niveau de l'élève: ${levelText}.
${activeCourse.description ? `Contexte: ${activeCourse.description}` : ''}
${activeCourse.topics && activeCourse.topics.length > 0 ? `Sujets: ${activeCourse.topics.map(t => t.name).join(', ')}` : ''}

Réponds de manière pédagogique et claire. Adapte-toi au niveau de l'élève.`
      }

      // Si du code est passé en contexte, construire le prompt approprié
      let userPrompt = content
      
      if (codeContext) {
        const { code, language } = codeContext
        
        // Détecter le type d'action
        if (content === '▶ Exécuter') {
          userPrompt = `Analyse ce code ${language.toUpperCase()} et donne-moi :
1. Ce que fait le code (explication simple)
2. Le résultat attendu de l'exécution
3. Les erreurs ou problèmes éventuels

CODE:
\`\`\`${language}
${code}
\`\`\`

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
        } else if (content === '💡 Aide sur mon code') {
          userPrompt = `J'ai besoin d'aide avec ce code ${language.toUpperCase()}. Analyse-le et dis-moi :
1. Ce qui pourrait être amélioré
2. Les erreurs potentielles
3. Des suggestions concrètes

CODE:
\`\`\`${language}
${code}
\`\`\`

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
        } else {
          // Question personnalisée avec contexte code
          userPrompt = `Ma question : ${content}

Contexte - mon code actuel (${language}):
\`\`\`${language}
${code}
\`\`\`

Réponds à ma question. Ne répète pas le code dans ta réponse sauf si nécessaire pour montrer une correction.`
        }
      }

      let fullResponse = ''
      
      // Use streaming to accumulate response
      await generateGeminiStreamingResponse(
        courseContext,
        userPrompt,
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

  const handleCopyMessage = useCallback(() => {
    showToast('Message copié !', 'success')
  }, [showToast])

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar - Course List (masquable avec Cmd+B) */}
      {!sidebarHidden && (
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
          onHideSidebar={() => setSidebarHidden(true)}
        />
      )}

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
            />
          </>
        ) : (
          // Empty State or Course Selection
          <EmptyState onCreateCourse={() => setShowCourseModal(true)} />
        )}
      </main>

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

