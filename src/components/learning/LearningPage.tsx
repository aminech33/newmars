import { useState, useEffect, useCallback } from 'react'
import { useLearningData } from '../../hooks/useLearningData'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { CourseHeader } from './CourseHeader'
import { CourseModal } from './CourseModal'
import { EmptyState } from './EmptyState'
import { LearningFAB } from './LearningFAB'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Toast, ToastType } from '../ui/Toast'
import { CreateCourseData, Course } from '../../types/learning'

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

// Simulated AI Response (à remplacer par une vraie API)
const generateAIResponse = async (courseContext: string, userMessage: string): Promise<string> => {
  // Simulation d'un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // Réponses simulées basées sur le contexte
  const responses = [
    `Excellente question sur ${courseContext} ! Voici ce que je peux te dire :

**Concept clé** : ${userMessage.split(' ').slice(0, 3).join(' ')}...

Pour bien comprendre cela, il faut d'abord savoir que :
1. Les fondamentaux sont essentiels
2. La pratique régulière est la clé
3. N'hésite pas à expérimenter

Veux-tu que j'approfondisse un point en particulier ?`,
    
    `Je vois que tu t'intéresses à "${userMessage.slice(0, 50)}..."

Voici une explication structurée :

\`\`\`javascript
// Exemple de code
const example = "Hello World";
console.log(example);
\`\`\`

**Points importants :**
- Premier point crucial
- Deuxième élément à retenir
- Troisième aspect pratique

Est-ce que c'est plus clair maintenant ?`,

    `C'est un sujet fascinant ! Laisse-moi t'expliquer...

Dans le contexte de ${courseContext}, on peut distinguer plusieurs aspects :

1. **Théorie** : La base conceptuelle
2. **Pratique** : L'application concrète
3. **Maîtrise** : L'expertise avancée

Tu es à quel niveau actuellement ? Je peux adapter mes explications.`
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

export function LearningPage() {
  const {
    uiState,
    courses,
    filteredCourses,
    activeCourse,
    stats,
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
    
    // Generate AI response
    setIsTyping(true)
    try {
      const response = await generateAIResponse(activeCourse.name, content)
      addAIResponse(activeCourse.id, response)
    } catch (error) {
      showToast('Erreur lors de la génération de la réponse', 'error')
    } finally {
      setIsTyping(false)
    }
  }, [activeCourse, sendMessage, setIsTyping, addAIResponse, showToast])

  const handleCopyMessage = useCallback((messageId: string) => {
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
    // TODO: Implement quick chat without course
    showToast('Fonctionnalité à venir', 'info')
  }, [showToast])

  const handleFlashcards = useCallback(() => {
    // TODO: Implement flashcard review mode
    showToast('Fonctionnalité à venir', 'info')
  }, [showToast])

  const hasCourses = courses.length > 0

  return (
    <div className="h-full flex bg-zinc-950">
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
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeCourse ? (
          <>
            {/* Course Header */}
            <CourseHeader
              course={activeCourse}
              onBack={() => setActiveCourse(null)}
              onSettings={handleSettingsCourse}
              onArchive={handleArchiveCourse}
              onDelete={() => handleDeleteCourse(activeCourse.id)}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={uiState.sidebarCollapsed}
            />

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
          </>
        ) : (
          // Empty State or Course Selection
          <EmptyState onCreateCourse={() => setShowCourseModal(true)} />
        )}
      </main>

      {/* Mobile FAB */}
      <LearningFAB
        onNewCourse={() => setShowCourseModal(true)}
        onQuickChat={handleQuickChat}
        onFlashcards={handleFlashcards}
      />

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
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
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

