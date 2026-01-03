/**
 * 🗣️ Language Course Form - Formulaire pour cours de langue
 */

import { useState } from 'react'
import { CreateCourseData } from '../../types/learning'
import { TargetLanguage, LanguageLevel, LANGUAGE_INFO, LEVEL_INFO } from '../../types/languages'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'

interface LanguageCourseFormProps {
  onSubmit: (data: CreateCourseData) => void
  onCancel: () => void
}

export function LanguageCourseForm({ onSubmit, onCancel }: LanguageCourseFormProps) {
  const { createLanguageCourse } = useStore()
  
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('spanish')
  const [level, setLevel] = useState<LanguageLevel>('A1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const languageInfo = LANGUAGE_INFO[targetLanguage]
    
    // Create language course in languagesSlice
    createLanguageCourse({
      targetLanguage,
      level
    })
    
    // Also create a regular course for display in Learning page
    // This allows languages to appear in the same list
    const courseData: CreateCourseData = {
      name: `${languageInfo.name} ${level}`,
      description: `Apprendre ${languageInfo.nativeName}`,
      icon: languageInfo.flag,
      color: 'pink',
      level: 'beginner', // Map to course level
      codeEnvironment: 'none',
      systemPrompt: `Tu es un professeur de ${languageInfo.nativeName} bienveillant.`,
      // Add metadata to identify this as a language course
      metadata: {
        isLanguageCourse: true,
        targetLanguage,
        languageLevel: level
      }
    }
    
    onSubmit(courseData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Language selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Quelle langue veux-tu apprendre ?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(LANGUAGE_INFO) as TargetLanguage[]).map((lang) => {
            const info = LANGUAGE_INFO[lang]
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setTargetLanguage(lang)}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  targetLanguage === lang
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="text-3xl mb-2">{info.flag}</div>
                <div className="text-sm font-medium text-white">{info.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{info.nativeName}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Level selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Ton niveau actuel
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LEVEL_INFO) as LanguageLevel[]).map((lvl) => {
            const info = LEVEL_INFO[lvl]
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`p-3 rounded-lg border transition-all ${
                  level === lvl
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="text-sm font-semibold text-white">{lvl}</div>
                <div className="text-xs text-zinc-400 mt-1">{info.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
        >
          Créer le cours
        </Button>
      </div>
    </form>
  )
}


