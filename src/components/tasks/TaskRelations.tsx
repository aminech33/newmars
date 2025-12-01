import { Link2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { TaskRelationType } from '../../types/taskRelation'
import { getRelationLabel, getRelationIcon } from '../../utils/taskRelationUtils'

interface TaskRelationsProps {
  taskId: string
}

export function TaskRelations({ taskId }: TaskRelationsProps) {
  const { tasks, taskRelations, addTaskRelation, removeTaskRelation } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<TaskRelationType>('related')
  const [selectedTaskId, setSelectedTaskId] = useState('')

  const relations = taskRelations.filter(
    r => r.fromTaskId === taskId || r.toTaskId === taskId
  )

  const availableTasks = tasks.filter(t => t.id !== taskId)

  const handleAddRelation = () => {
    if (selectedTaskId) {
      addTaskRelation({
        fromTaskId: taskId,
        toTaskId: selectedTaskId,
        type: selectedType
      })
      setSelectedTaskId('')
      setIsAdding(false)
    }
  }

  const relationTypes: TaskRelationType[] = [
    'blocks',
    'blocked_by',
    'related',
    'duplicate',
    'parent',
    'child'
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400">Relations</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 text-zinc-600 hover:text-zinc-400 rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isAdding && (
        <div className="space-y-2 p-3 bg-zinc-900/50 rounded-xl">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TaskRelationType)}
            className="w-full bg-zinc-800 text-zinc-300 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-600"
          >
            {relationTypes.map(type => (
              <option key={type} value={type}>
                {getRelationIcon(type)} {getRelationLabel(type)}
              </option>
            ))}
          </select>
          
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-zinc-800 text-zinc-300 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-600"
          >
            <option value="">Sélectionner une tâche...</option>
            {availableTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddRelation}
            disabled={!selectedTaskId}
            className="w-full px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Ajouter la relation
          </button>
        </div>
      )}

      {relations.length > 0 ? (
        <div className="space-y-2">
          {relations.map(relation => {
            const isSource = relation.fromTaskId === taskId
            const relatedTaskId = isSource ? relation.toTaskId : relation.fromTaskId
            const relatedTask = tasks.find(t => t.id === relatedTaskId)
            
            if (!relatedTask) return null

            return (
              <div
                key={relation.id}
                className="flex items-center justify-between p-2 bg-zinc-900/30 rounded-lg group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getRelationIcon(relation.type)}</span>
                  <span className="text-xs text-zinc-500">{getRelationLabel(relation.type)}</span>
                  <span className="text-sm text-zinc-300 truncate max-w-[150px]">
                    {relatedTask.title}
                  </span>
                </div>
                <button
                  onClick={() => removeTaskRelation(relation.id)}
                  className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 text-center py-2">
          Aucune relation
        </p>
      )}
    </div>
  )
}
