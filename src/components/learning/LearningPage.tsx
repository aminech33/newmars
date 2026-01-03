import { useState, useCallback } from 'react'
import { useLearningData } from '../../hooks/useLearningData'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { CourseModal } from './CourseModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Toast, ToastType } from '../ui/Toast'
import { CreateCourseData, Course } from '../../types/learning'
import { CoursesTab } from './CoursesTab'

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

export function LearningPage() {
  const learningData = useLearningData()
  const {
    filteredCourses,
    activeCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePinCourse,
    archiveCourse,
    sendMessage,
    sendMessageWithStreaming,
    deleteMessage,
    setActiveCourse,
    setIsTyping
  } = learningData

  // Local UI state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'message'; id: string; courseId?: string } | null>(null)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  
  const { toast, showToast, hideToast } = useLocalToast()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: () => setSidebarHidden(prev => !prev),
    onNewCourse: () => setShowCourseModal(true),
    onEscape: () => {
      if (showCourseModal) setShowCourseModal(false)
      else if (confirmDelete) setConfirmDelete(null)
      else if (activeCourse && window.innerWidth < 1024) setActiveCourse(null)
    },
    isModalOpen: showCourseModal,
    isConfirmOpen: !!confirmDelete,
    activeCourse
  })

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

  const handleSendMessage = useCallback(async (
    content: string, 
    codeContext?: { code: string; language: string },
    terminalContext?: { recentCommands: string[]; recentOutput: string }
  ) => {
    if (!activeCourse) return

    await sendMessage(activeCourse.id, content)
    setIsTyping(true)
    
    try {
      const fullResponse = await sendMessageWithStreaming(
        activeCourse.id,
        content,
        codeContext,
        terminalContext
      )
      
      // Ajouter la réponse IA au store
      const aiMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: fullResponse,
        timestamp: Date.now()
      }
      
      learningData.courses.find(c => c.id === activeCourse.id)?.messages.push(aiMessage)
      
      // 🧠 V1.9.0: Tracking automatique de l'usage des concepts
      // Détecte l'utilisation active de concepts pour mettre à jour leur mastery
      try {
        await fetch('http://localhost:8000/api/knowledge/track-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: activeCourse.id,
            user_message: content,
            code_context: codeContext?.code || null
          })
        })
        console.log('✅ Concept usage tracked')
      } catch (trackError) {
        // Non-bloquant si erreur
        console.warn('⚠️ Could not track concept usage:', trackError)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      showToast(errorMessage, 'error')
    } finally {
      setIsTyping(false)
    }
  }, [activeCourse, sendMessage, sendMessageWithStreaming, setIsTyping, showToast, learningData.courses])

  const handleCopyMessage = useCallback(() => {
    showToast('Message copié !', 'success')
  }, [showToast])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-medium text-zinc-200">Apprentissage</h1>
          <div className="flex-1" />
        </div>
      </header>

      {/* Contenu */}
      <CoursesTab
        filteredCourses={filteredCourses}
        activeCourse={activeCourse}
        activeCourseId={activeCourse?.id || null}
        sidebarCollapsed={false}
        sidebarHidden={sidebarHidden}
        setActiveCourse={setActiveCourse}
        setSidebarHidden={setSidebarHidden}
        onCreateCourse={() => setShowCourseModal(true)}
          onEditCourse={(course) => {
            setEditingCourse(course)
            setShowCourseModal(true)
          }}
          onDeleteCourse={(courseId) => setConfirmDelete({ type: 'course', id: courseId })}
          onPinCourse={togglePinCourse}
          onArchiveCourse={archiveCourse}
          onSendMessage={handleSendMessage}
          onCopyMessage={handleCopyMessage}
        />

      {/* Modals */}
      <CourseModal
        isOpen={showCourseModal}
        course={editingCourse}
        onClose={() => {
          setShowCourseModal(false)
          setEditingCourse(null)
        }}
        onSubmit={handleCreateCourse}
      />

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
