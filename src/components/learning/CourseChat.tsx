import { memo, useState, useCallback, useEffect } from 'react'
import { Course } from '../../types/learning'
import { SplitViewContainer } from './SplitViewContainer'
import { EditorPanel } from './EditorPanel'
import { ChatPanel } from './ChatPanel'
import { CourseActions } from './CourseActions'
import { LinkedTasks } from './LinkedTasks'
import { CourseStatsCard } from './CourseStatsCard'
import { useStore } from '../../store/useStore'
import { useTopicSwitch } from '../../hooks/useTopicSwitch'
import { useCodeExecution } from '../../hooks/useCodeExecution'
import { getStarterCode } from '../../utils/codeTemplates'

interface CourseChatProps {
  course: Course
  onSendMessage: (content: string, codeContext?: { code: string; language: string }, terminalContext?: { recentCommands: string[]; recentOutput: string }) => void
  onCopyMessage: (messageId: string) => void
}

export const CourseChat = memo(function CourseChat({
  course,
  onSendMessage,
  onCopyMessage
}: CourseChatProps) {
  const { addToast, tasks } = useStore()
  
  const [isTyping] = useState(false)
  const language = course.programmingLanguage || 'python'
  const [editorCode, setEditorCode] = useState(() => getStarterCode(language, course.name))
  const [includeCode, setIncludeCode] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showTasks, setShowTasks] = useState(false)
  const [showStats, setShowStats] = useState(false)
  
  // Terminal context capture
  const [terminalCommands, setTerminalCommands] = useState<string[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string>('')
  
  // Session ID stable pour le terminal (basé sur le courseId)
  const terminalSessionId = `course-${course.id}`
  
  // Topic switch detection (pour interleaving feedback)
  useTopicSwitch(course.messages, (from, to) => {
    addToast(`🔄 Switch: ${from} → ${to}`, 'info')
  })

  // Exécution de code
  const { executeCode, isExecuting, result: execResult, statusMessage } = useCodeExecution()

  // Masquer les suggestions après la première interaction
  useEffect(() => {
    if (course.messages.length > 0) {
      setShowSuggestions(false)
    }
  }, [course.messages.length])

  const codeEnv = course.codeEnvironment || 'none'
  const showSplitView = codeEnv !== 'none'
  const hasEditor = codeEnv === 'editor' || codeEnv === 'both'
  const hasTerminal = codeEnv === 'terminal' || codeEnv === 'both'
  
  // Callbacks pour capturer l'activité du terminal
  const handleTerminalCommand = useCallback((command: string) => {
    setTerminalCommands(prev => [...prev, command].slice(-10)) // Garder les 10 dernières
  }, [])
  
  const handleTerminalOutput = useCallback((output: string) => {
    setTerminalOutput(output)
  }, [])

  // Gestion de l'envoi avec contexte code + terminal
  const handleSendMessage = useCallback((content: string, codeContext?: { code: string; language: string }) => {
    // Préparer le contexte terminal si disponible
    const terminalCtx = hasTerminal && (terminalCommands.length > 0 || terminalOutput.trim())
      ? { recentCommands: terminalCommands, recentOutput: terminalOutput }
      : undefined
    
    // Inclure le code uniquement si on a un éditeur ET que l'option est activée
    if (hasEditor && includeCode && editorCode.trim() && !codeContext) {
      onSendMessage(content, { code: editorCode, language }, terminalCtx)
    } else {
      onSendMessage(content, codeContext, terminalCtx)
    }
  }, [hasEditor, hasTerminal, includeCode, editorCode, language, terminalCommands, terminalOutput, onSendMessage])

  // Handler pour exécuter le code
  const handleRunCode = useCallback(async () => {
    await executeCode(editorCode, language)
  }, [executeCode, editorCode, language])

  // Tâches liées
  const linkedTasks = course.linkedProjectId 
    ? tasks.filter(t => t.projectId === course.linkedProjectId)
    : []

  // Actions communes
  const actions = (
    <CourseActions
      showTasks={showTasks}
      showStats={showStats}
      onToggleTasks={() => setShowTasks(!showTasks)}
      onToggleStats={() => setShowStats(!showStats)}
      tasksCount={linkedTasks.length}
    />
  )

  // Modal tâches (commun aux deux modes)
  const tasksModal = showTasks && course.linkedProjectId && (
    <div className="absolute inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-10">
      <LinkedTasks
        projectId={course.linkedProjectId}
        onClose={() => setShowTasks(false)}
      />
    </div>
  )

  // En mode split view (code ou terminal)
  if (showSplitView) {
    return (
      <div className="h-full flex flex-col bg-black">
        {showStats && (
          <div className="border-b border-zinc-800/50 p-4 bg-zinc-950/50">
            <CourseStatsCard course={course} />
          </div>
        )}
        
        <SplitViewContainer
          leftPanel={
            <EditorPanel
              code={editorCode}
              language={language}
              onCodeChange={setEditorCode}
              mode={codeEnv}
              terminalSessionId={terminalSessionId}
              onTerminalCommand={handleTerminalCommand}
              onTerminalOutput={handleTerminalOutput}
              onRunCode={handleRunCode}
              isExecuting={isExecuting}
              execResult={execResult}
              execStatus={statusMessage}
            />
          }
          rightPanel={
            <ChatPanel
              course={course}
              isTyping={isTyping}
              includeCode={hasEditor ? includeCode : false}
              showSuggestions={showSuggestions}
              onSendMessage={handleSendMessage}
              onCopyMessage={onCopyMessage}
              onIncludeCodeChange={setIncludeCode}
              onShowSuggestionsChange={setShowSuggestions}
              codeContext={hasEditor ? { code: editorCode, language } : undefined}
              headerActions={actions}
            />
          }
        />
        {tasksModal}
      </div>
    )
  }

  // Mode chat simple (sans code/terminal)
  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {showStats && (
        <div className="border-b border-zinc-800/50 p-4 bg-zinc-950/50">
          <CourseStatsCard course={course} />
        </div>
      )}

      <ChatPanel
        course={course}
        isTyping={isTyping}
        includeCode={false}
        showSuggestions={showSuggestions}
        onSendMessage={handleSendMessage}
        onCopyMessage={onCopyMessage}
        onIncludeCodeChange={() => {}}
        onShowSuggestionsChange={setShowSuggestions}
        headerActions={actions}
      />
      {tasksModal}
    </div>
  )
})
