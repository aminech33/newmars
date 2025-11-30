import { Plus } from 'lucide-react'

interface TaskFABProps {
  onClick: () => void
}

export function TaskFAB({ onClick }: TaskFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 md:hidden"
      aria-label="Nouvelle tâche"
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}

