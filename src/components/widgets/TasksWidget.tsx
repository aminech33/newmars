import { memo, useMemo } from 'react'
import { ArrowRight, CheckSquare } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface TasksWidgetProps {
  widget: Widget
}

export const TasksWidget = memo(function TasksWidget({ widget }: TasksWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, setView } = useStore()
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Tâches" currentSize={size}>
        <button
          onClick={() => setView('tasks')}
          className="flex flex-col items-center justify-center h-full text-center group"
        >
          {/* Mini tableau avec checkboxes */}
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center mb-2"
              style={{
                background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
                boxShadow: '0 2px 8px rgba(63, 81, 181, 0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <CheckSquare className="w-8 h-8" style={{ color: '#3f51b5' }} />
            </div>
            {pendingTasks.length > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ff5252 0%, #f44336 100%)',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(244, 67, 54, 0.4)'
                }}
              >
                {pendingTasks.length}
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-600">Tâches</p>
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="📋 Tâches en cours"
      currentSize={size}
      onClick={() => setView('tasks')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('tasks')
          }}
          className="text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      {/* Fond papier ligné style bloc-notes */}
      <div 
        className="h-full rounded-lg p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
          backgroundImage: `
            linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 29px,
              rgba(63, 81, 181, 0.1) 29px,
              rgba(63, 81, 181, 0.1) 30px
            )
          `,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {/* Ligne rouge verticale à gauche (style cahier) */}
        <div 
          className="absolute left-8 top-0 bottom-0 w-px"
          style={{ background: 'rgba(244, 67, 54, 0.3)' }}
        />
        
        <div className="space-y-2 overflow-auto h-full pl-6">
          {pendingTasks.slice(0, size === 'large' ? 6 : 3).map((task, index) => (
            <div 
              key={task.id} 
              className="flex items-start gap-3 py-1 group"
              style={{ 
                fontFamily: '"Segoe UI", sans-serif',
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Checkbox dessinée */}
              <div 
                className="w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 transition-colors group-hover:border-indigo-400"
                style={{ borderColor: '#9fa8da' }}
              />
              <span 
                className="text-sm text-gray-700 line-clamp-2 flex-1"
                style={{ color: '#424242' }}
              >
                {task.title}
              </span>
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3" style={{ filter: 'grayscale(0.3)' }}>✅</div>
              <p className="text-gray-600 text-sm font-medium mb-1">Tout est fait !</p>
              <p className="text-gray-400 text-xs">Profitez de ce moment</p>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
})
