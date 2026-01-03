import { useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Note } from '../types/learning'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Hook pour la gestion des notes de cours
 */
export function useCourseNotes() {
  const {
    addLearningNote,
    deleteLearningNote
  } = useStore()

  // ============================================
  // ACTIONS - NOTES
  // ============================================

  const createNote = useCallback((
    courseId: string,
    title: string,
    content: string,
    messageId?: string
  ): Note => {
    const note: Note = {
      id: generateId(),
      courseId,
      title: title.trim(),
      content: content.trim(),
      tags: [],
      createdFromMessageId: messageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    }

    addLearningNote(courseId, note)
    return note
  }, [addLearningNote])

  const deleteNote = useCallback((courseId: string, noteId: string) => {
    deleteLearningNote(courseId, noteId)
  }, [deleteLearningNote])

  return {
    createNote,
    deleteNote
  }
}

