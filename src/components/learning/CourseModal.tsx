import { useState } from 'react'
import { Course, CreateCourseData } from '../../types/learning'
import { Modal } from '../ui/Modal'
import { CourseForm } from './CourseForm'
import { LanguageCourseForm } from './LanguageCourseForm'
import { Code, Languages } from 'lucide-react'

interface CourseModalProps {
  isOpen: boolean
  course?: Course | null
  onClose: () => void
  onSubmit: (data: CreateCourseData) => void
}

export function CourseModal({ isOpen, course, onClose, onSubmit }: CourseModalProps) {
  const [courseType, setCourseType] = useState<'programming' | 'language' | null>(null)
  const isEditMode = !!course

  const handleSubmit = (data: CreateCourseData) => {
    onSubmit(data)
    onClose()
    setCourseType(null) // Reset for next time
  }

  const handleClose = () => {
    onClose()
    setCourseType(null) // Reset for next time
  }

  // If editing, skip type selection
  if (isEditMode) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Modifier le cours"
        size="lg"
      >
        <CourseForm
          course={course}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    )
  }

  // Show selected form
  if (courseType === 'programming') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Nouveau cours de programmation"
        size="lg"
      >
        <CourseForm
          course={null}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    )
  }

  if (courseType === 'language') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Nouvelle langue"
        size="lg"
      >
        <LanguageCourseForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    )
  }

  // Type selection screen
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Quel type de cours ?"
      size="md"
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-zinc-400 mb-6">
          Choisis ce que tu veux apprendre
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Programming */}
          <button
            onClick={() => setCourseType('programming')}
            className="group p-6 rounded-xl border-2 border-zinc-800 bg-zinc-950 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-emerald-500/20 transition-colors">
              <Code className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Programmation</h3>
            <p className="text-xs text-zinc-500">
              Python, JavaScript, etc.
            </p>
          </button>

          {/* Languages */}
          <button
            onClick={() => setCourseType('language')}
            className="group p-6 rounded-xl border-2 border-zinc-800 bg-zinc-950 hover:border-pink-500 hover:bg-pink-500/5 transition-all hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-pink-500/20 transition-colors">
              <Languages className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Langues</h3>
            <p className="text-xs text-zinc-500">
              Espagnol, Arabe, etc.
            </p>
          </button>
        </div>
      </div>
    </Modal>
  )
}
