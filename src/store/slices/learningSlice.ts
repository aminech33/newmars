import { StateCreator } from 'zustand'
import { Course, Message, Flashcard, Note as LearningNote } from '../../types/learning'

export interface LearningSlice {
  learningCourses: Course[]
  addLearningCourse: (course: Course) => void
  updateLearningCourse: (id: string, updates: Partial<Course>) => void
  deleteLearningCourse: (id: string) => void
  addLearningMessage: (courseId: string, message: Message) => void
  deleteLearningMessage: (courseId: string, messageId: string) => void
  addLearningFlashcard: (courseId: string, flashcard: Flashcard) => void
  deleteLearningFlashcard: (courseId: string, flashcardId: string) => void
  addLearningNote: (courseId: string, note: LearningNote) => void
  deleteLearningNote: (courseId: string, noteId: string) => void
}

export const createLearningSlice: StateCreator<LearningSlice> = (set) => ({
  learningCourses: [],

  addLearningCourse: (course) => set((state) => ({
    learningCourses: [...state.learningCourses, course]
  })),

  updateLearningCourse: (id, updates) => set((state) => ({
    learningCourses: state.learningCourses.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    )
  })),

  deleteLearningCourse: (id) => set((state) => ({
    learningCourses: state.learningCourses.filter(c => c.id !== id)
  })),

  addLearningMessage: (courseId, message) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        messages: [...course.messages, message],
        updatedAt: Date.now()
      }
    })
  })),

  deleteLearningMessage: (courseId, messageId) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        messages: course.messages.filter(m => m.id !== messageId),
        updatedAt: Date.now()
      }
    })
  })),

  addLearningFlashcard: (courseId, flashcard) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        flashcards: [...course.flashcards, flashcard],
        updatedAt: Date.now()
      }
    })
  })),

  deleteLearningFlashcard: (courseId, flashcardId) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        flashcards: course.flashcards.filter(f => f.id !== flashcardId),
        updatedAt: Date.now()
      }
    })
  })),

  addLearningNote: (courseId, note) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        notes: [...course.notes, note],
        updatedAt: Date.now()
      }
    })
  })),

  deleteLearningNote: (courseId, noteId) => set((state) => ({
    learningCourses: state.learningCourses.map(course => {
      if (course.id !== courseId) return course
      return {
        ...course,
        notes: course.notes.filter(n => n.id !== noteId),
        updatedAt: Date.now()
      }
    })
  }))
})
