/**
 * 🎓 Learning Slice - Cours et apprentissage
 */

import { StateCreator } from 'zustand'
import { Course, Message, Note as LearningNote } from '../../types/learning'

export interface LearningSlice {
  learningCourses: Course[]
  addLearningCourse: (course: Course) => void
  updateLearningCourse: (id: string, updates: Partial<Course>) => void
  deleteLearningCourse: (id: string) => void
  addLearningMessage: (courseId: string, message: Message) => void
  deleteLearningMessage: (courseId: string, messageId: string) => void
  addLearningNote: (courseId: string, note: LearningNote) => void
  deleteLearningNote: (courseId: string, noteId: string) => void
}

export const createLearningSlice: StateCreator<
  LearningSlice,
  [['zustand/persist', unknown]],
  [],
  LearningSlice
> = (set) => ({
  learningCourses: [],

  addLearningCourse: (course) => {
    set((s) => ({ learningCourses: [...s.learningCourses, course] }))
  },

  updateLearningCourse: (id, updates) => {
    set((s) => ({
      learningCourses: s.learningCourses.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    }))
  },

  deleteLearningCourse: (id) => {
    set((s) => ({ learningCourses: s.learningCourses.filter((c) => c.id !== id) }))
  },

  addLearningMessage: (courseId, message) => {
    set((s) => ({
      learningCourses: s.learningCourses.map((c) =>
        c.id === courseId ? { ...c, messages: [...c.messages, message] } : c
      )
    }))
  },

  deleteLearningMessage: (courseId, messageId) => {
    set((s) => ({
      learningCourses: s.learningCourses.map((c) =>
        c.id === courseId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      )
    }))
  },

  addLearningNote: (courseId, note) => {
    set((s) => ({
      learningCourses: s.learningCourses.map((c) =>
        c.id === courseId ? { ...c, notes: [...c.notes, note] } : c
      )
    }))
  },

  deleteLearningNote: (courseId, noteId) => {
    set((s) => ({
      learningCourses: s.learningCourses.map((c) =>
        c.id === courseId
          ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) }
          : c
      )
    }))
  },
})
