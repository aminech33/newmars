import { memo, useMemo } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface CalendarWidgetProps {
  widget: Widget
}

export const CalendarWidget = memo(function CalendarWidget({ widget }: CalendarWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, events, setView } = useStore()
  
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today])
  
  const tasksWithDates = useMemo(() => tasks.filter(t => t.dueDate && !t.completed), [tasks])
  const upcomingEvents = useMemo(() => events.filter(e => !e.completed).length, [events])

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Calendrier" currentSize={size} onClick={() => setView('calendar')}>
        {/* Mini calendrier style page arrachée */}
        <div className="flex flex-col items-center justify-center h-full">
          <div 
            className="relative w-20 h-20 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #fff 0%, #fafafa 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {/* Haut rouge du calendrier */}
            <div 
              className="h-5 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #ef5350 0%, #e53935 100%)'
              }}
            >
              <div className="flex gap-2">
                <div className="w-1 h-1 bg-white/60 rounded-full" />
                <div className="w-1 h-1 bg-white/60 rounded-full" />
              </div>
            </div>
            
            {/* Date */}
            <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100% - 20px)' }}>
              <p className="text-3xl font-bold" style={{ color: '#212121' }}>{today.getDate()}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: '#757575' }}>
                {today.toLocaleDateString('fr-FR', { month: 'short' })}
              </p>
            </div>
            
            {/* Badge événements */}
            {upcomingEvents > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(30, 136, 229, 0.4)'
                }}
              >
                {upcomingEvents}
              </div>
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  const days = useMemo(() => {
    const count = size === 'large' ? 7 : 3
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [today, size])

  return (
    <WidgetContainer id={id} title="📅 Cette semaine" currentSize={size} onClick={() => setView('calendar')}>
      {/* Fond papier calendrier */}
      <div 
        className="h-full rounded-lg p-3 relative"
        style={{
          background: 'linear-gradient(180deg, #fff 0%, #f8f8f8 100%)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <div className="space-y-2 overflow-auto h-full">
          {days.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
            const isToday = dateStr === todayStr
            
            return (
              <div 
                key={dateStr} 
                className="p-2 rounded-lg transition-all"
                style={{
                  background: isToday 
                    ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                    : 'transparent',
                  border: isToday ? '2px solid #42a5f5' : '1px solid #eeeeee',
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {/* Petit calendrier iconique */}
                    <div 
                      className="w-8 h-8 rounded flex flex-col items-center justify-center"
                      style={{
                        background: isToday ? '#1e88e5' : '#bdbdbd',
                        color: 'white'
                      }}
                    >
                      <span className="text-xs font-bold leading-none">{date.getDate()}</span>
                      <span className="text-[8px] uppercase leading-none">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}
                      </span>
                    </div>
                    
                    <span 
                      className="text-xs font-medium"
                      style={{ color: isToday ? '#1565c0' : '#616161' }}
                    >
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </span>
                  </div>
                  
                  {dayTasks.length > 0 && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: '#fff3e0',
                        color: '#e65100'
                      }}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                
                {dayTasks.length > 0 && (
                  <div className="space-y-0.5 ml-10">
                    {dayTasks.slice(0, 2).map((task) => (
                      <p 
                        key={task.id} 
                        className="text-xs truncate"
                        style={{ color: '#757575' }}
                      >
                        • {task.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          {tasksWithDates.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">✨</div>
              <p style={{ color: '#616161' }} className="text-sm font-medium mb-1">Aucune échéance</p>
              <p style={{ color: '#9e9e9e' }} className="text-xs">Tout est sous contrôle</p>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
})
