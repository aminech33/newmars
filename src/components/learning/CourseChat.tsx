import { memo, useState, useCallback, useEffect } from 'react'
import { Course } from '../../types/learning'
import { SplitViewContainer } from './SplitViewContainer'
import { EditorPanel } from './EditorPanel'
import { ChatPanel } from './ChatPanel'
import { CourseActions } from './CourseActions'
import { LinkedTasks } from './LinkedTasks'
import { CourseStatsCard } from './CourseStatsCard'
import { ArchiveManager } from './ArchiveManager'
import { QuizPanel } from './QuizPanel'
import { TopicsSelector } from './TopicsSelector'
import { useStore } from '../../store/useStore'
import { useTopicSwitch } from '../../hooks/useTopicSwitch'
import { useCodeExecution } from '../../hooks/useCodeExecution'
import { useKnowledgeBase } from '../../hooks/useKnowledgeBase'
import { useMessageArchiving } from '../../hooks/useMessageArchiving'
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
  
  // 🧠 Knowledge Base - Charge les concepts au début
  const { concepts, loadConcepts, stats } = useKnowledgeBase()
  
  // 📦 Archivage automatique des messages
  const { needsArchiving, stats: archiveStats } = useMessageArchiving(course.id)
  
  const [isTyping] = useState(false)
  const language = course.programmingLanguage || 'python'
  const [editorCode, setEditorCode] = useState(() => getStarterCode(language, course.name))
  const [includeCode, setIncludeCode] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showTasks, setShowTasks] = useState(false)
  const [showStats, setShowStats] = useState(false)
  
  // 🎯 États pour Quiz/Topics
  const [showTopicsSelector, setShowTopicsSelector] = useState(false)
  const [showQuizPanel, setShowQuizPanel] = useState(false)
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null)
  
  // Terminal context capture
  const [terminalCommands, setTerminalCommands] = useState<string[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string>('')
  
  // Session ID stable pour le terminal (basé sur le courseId)
  const terminalSessionId = `course-${course.id}`
  
  // 🧠 Charger la base de connaissances au montage
  useEffect(() => {
    loadConcepts(course.id)
    console.log(`🧠 Knowledge Base: Chargement des concepts pour ${course.name}`)
  }, [course.id, loadConcepts, course.name])
  
  // Log quand les concepts sont chargés
  useEffect(() => {
    if (concepts.length > 0) {
      console.log(`✅ Knowledge Base: ${concepts.length} concepts chargés`)
      console.log(`📊 Stats: Maîtrise moyenne ${stats?.avgMastery}/5, ${stats?.mastered} maîtrisés`)
    }
  }, [concepts.length, stats])
  
  // 📦 Notification si archivage nécessaire
  useEffect(() => {
    if (needsArchiving && archiveStats) {
      console.log(`⚠️ ${archiveStats.active} messages actifs - Archivage recommandé`)
    }
  }, [needsArchiving, archiveStats])
  
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

  // Gestion de l'envoi avec contexte code + terminal + knowledge base
  const handleSendMessage = useCallback((content: string, codeContext?: { code: string; language: string }) => {
    // 🧠 Rechercher concepts pertinents (recherche locale, pas d'API call)
    const query = content.toLowerCase()
    const relevantConcepts = concepts
      .filter(c => 
        query.includes(c.concept.toLowerCase()) ||
        c.keywords.some(k => query.includes(k.toLowerCase()))
      )
      .sort((a, b) => a.masteryLevel - b.masteryLevel) // Prioriser concepts moins maîtrisés
      .slice(0, 5) // Top 5 concepts pertinents
    
    // Enrichir le message avec le contexte de connaissances
    let enrichedContent = content
    if (relevantConcepts.length > 0) {
      const knowledgeContext = `\n\n[CONTEXTE - L'étudiant connaît: ${relevantConcepts.map(c => 
        `${c.concept} (maîtrise ${c.masteryLevel}/5, vu ${c.timesReferenced}x)`
      ).join(', ')}. Ne ré-explique pas ce qu'il maîtrise bien (≥3). Construis sur ses connaissances.]`
      
      enrichedContent = content + knowledgeContext
      
      console.log(`🧠 Contexte enrichi avec ${relevantConcepts.length} concepts pertinents`)
    }
    
    // Préparer le contexte terminal si disponible
    const terminalCtx = hasTerminal && (terminalCommands.length > 0 || terminalOutput.trim())
      ? { recentCommands: terminalCommands, recentOutput: terminalOutput }
      : undefined
    
    // Inclure le code uniquement si on a un éditeur ET que l'option est activée
    if (hasEditor && includeCode && editorCode.trim() && !codeContext) {
      onSendMessage(enrichedContent, { code: editorCode, language }, terminalCtx)
    } else {
      onSendMessage(content, codeContext, terminalCtx)
    }
  }, [hasEditor, hasTerminal, includeCode, editorCode, language, terminalCommands, terminalOutput, onSendMessage])

  // Handler pour exécuter le code
  const handleRunCode = useCallback(async () => {
    await executeCode(editorCode, language)
  }, [executeCode, editorCode, language])

  // 🎯 Handler pour démarrer une session de quiz
  const handleStartQuizSession = useCallback(async (selectedTopics: string[], useInterleaving: boolean) => {
    try {
      const response = await fetch('http://localhost:8000/api/learning/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          user_id: 'current-user',
          topic_ids: selectedTopics,
          use_interleaving: useInterleaving
        })
      })
      
      if (!response.ok) throw new Error('Failed to start session')
      
      const data = await response.json()
      setQuizSessionId(data.session_id)
      setShowTopicsSelector(false)
      setShowQuizPanel(true)
      
      addToast(`✅ Session démarrée${useInterleaving ? ' avec interleaving' : ''}`, 'success')
    } catch (error) {
      console.error('Error starting quiz session:', error)
      addToast('❌ Erreur lors du démarrage de la session', 'error')
    }
  }, [course.id, addToast])

  // 🎯 Handler pour terminer le quiz
  const handleQuizComplete = useCallback(() => {
    setShowQuizPanel(false)
    setQuizSessionId(null)
    addToast('🎉 Session terminée !', 'success')
  }, [addToast])

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
      onStartQuiz={() => setShowTopicsSelector(true)}
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
        
        {/* 🎯 Modal TopicsSelector */}
        {showTopicsSelector && course.topics && course.topics.length > 0 && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Démarrer une session de quiz</h2>
                <button
                  onClick={() => setShowTopicsSelector(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <TopicsSelector
                courseId={course.id}
                topics={course.topics}
                onStartSession={handleStartQuizSession}
              />
            </div>
          </div>
        )}

        {/* 🎯 Panel Quiz */}
        {showQuizPanel && quizSessionId && (
          <div className="absolute inset-0 bg-zinc-900 z-20">
            <QuizPanel sessionId={quizSessionId} onComplete={handleQuizComplete} />
          </div>
        )}
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
      
      {/* Gestionnaire d'archivage */}
      {course.messages.length > 30 && (
        <div className="border-b border-zinc-800/50 p-3 bg-zinc-950/50">
          <ArchiveManager courseId={course.id} />
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
      
      {/* 🎯 Modal TopicsSelector */}
      {showTopicsSelector && course.topics && course.topics.length > 0 && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Démarrer une session de quiz</h2>
              <button
                onClick={() => setShowTopicsSelector(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <TopicsSelector
              courseId={course.id}
              topics={course.topics}
              onStartSession={handleStartQuizSession}
            />
          </div>
        </div>
      )}

      {/* 🎯 Panel Quiz */}
      {showQuizPanel && quizSessionId && (
        <div className="absolute inset-0 bg-zinc-900 z-20">
          <QuizPanel sessionId={quizSessionId} onComplete={handleQuizComplete} />
        </div>
      )}
    </div>
  )
})
