/**
 * 🗣️ Store Zustand pour les langues
 */

import { StateCreator } from 'zustand'
import { LanguageCourse, LanguageMessage, VocabularyWord, TargetLanguage, LanguageLevel, LANGUAGE_INFO } from '../../types/languages'

export interface LanguagesSlice {
  // State
  languageCourses: LanguageCourse[]
  
  // Actions
  createLanguageCourse: (data: {
    targetLanguage: TargetLanguage
    level: LanguageLevel
    name?: string
  }) => void
  
  updateLanguageCourse: (courseId: string, data: Partial<LanguageCourse>) => void
  deleteLanguageCourse: (courseId: string) => void
  
  // Messages
  addLanguageMessage: (courseId: string, message: Omit<LanguageMessage, 'id' | 'timestamp'>) => void
  
  // Vocabulary
  addVocabularyWord: (courseId: string, word: Omit<VocabularyWord, 'id' | 'addedAt' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'lastReviewed'>) => void
  updateVocabularyWord: (courseId: string, wordId: string, data: Partial<VocabularyWord>) => void
  
  // Exercises
  markExerciseCompleted: (courseId: string, exerciseId: string) => void
}

export const createLanguagesSlice: StateCreator<LanguagesSlice> = (set) => ({
  languageCourses: [],
  
  createLanguageCourse: (data) => set((state) => {
    const languageInfo = LANGUAGE_INFO[data.targetLanguage]
    const now = Date.now()
    
    const newCourse: LanguageCourse = {
      id: `lang-${now}-${Math.random().toString(36).substr(2, 9)}`,
      targetLanguage: data.targetLanguage,
      nativeLanguage: 'french',
      level: data.level,
      name: data.name || `${languageInfo.name} ${data.level}`,
      icon: languageInfo.flag,
      
      isRTL: languageInfo.isRTL,
      usesPinyin: languageInfo.usesPinyin,
      usesRomaji: languageInfo.usesRomaji,
      
      conversationMinutes: 0,
      exercisesCompleted: 0,
      wordsLearned: 0,
      readingMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalTimeSpent: 0,
      
      messages: [],
      vocabulary: [],
      completedExercises: [],
      
      createdAt: now,
      lastActiveAt: now
    }
    
    return {
      languageCourses: [...state.languageCourses, newCourse]
    }
  }),
  
  updateLanguageCourse: (courseId, data) => set((state) => ({
    languageCourses: state.languageCourses.map(course =>
      course.id === courseId
        ? { ...course, ...data, lastActiveAt: Date.now() }
        : course
    )
  })),
  
  deleteLanguageCourse: (courseId) => set((state) => ({
    languageCourses: state.languageCourses.filter(course => course.id !== courseId)
  })),
  
  addLanguageMessage: (courseId, message) => set((state) => ({
    languageCourses: state.languageCourses.map(course =>
      course.id === courseId
        ? {
            ...course,
            messages: [
              ...course.messages,
              {
                ...message,
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now()
              }
            ],
            lastActiveAt: Date.now()
          }
        : course
    )
  })),
  
  addVocabularyWord: (courseId, word) => set((state) => ({
    languageCourses: state.languageCourses.map(course =>
      course.id === courseId
        ? {
            ...course,
            vocabulary: [
              ...course.vocabulary,
              {
                ...word,
                id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
                nextReview: Date.now() + 24 * 60 * 60 * 1000, // 1 jour
                lastReviewed: 0,
                addedAt: Date.now()
              }
            ],
            wordsLearned: course.wordsLearned + 1,
            lastActiveAt: Date.now()
          }
        : course
    )
  })),
  
  updateVocabularyWord: (courseId, wordId, data) => set((state) => ({
    languageCourses: state.languageCourses.map(course =>
      course.id === courseId
        ? {
            ...course,
            vocabulary: course.vocabulary.map((word: VocabularyWord) =>
              word.id === wordId ? { ...word, ...data } : word
            ),
            lastActiveAt: Date.now()
          }
        : course
    )
  })),
  
  markExerciseCompleted: (courseId, exerciseId) => set((state) => ({
    languageCourses: state.languageCourses.map(course =>
      course.id === courseId && !course.completedExercises.includes(exerciseId)
        ? {
            ...course,
            completedExercises: [...course.completedExercises, exerciseId],
            exercisesCompleted: course.exercisesCompleted + 1,
            lastActiveAt: Date.now()
          }
        : course
    )
  }))
})

