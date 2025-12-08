import { useState, useMemo } from 'react'
import { X, Play, CheckCircle2, XCircle, Clock, FlaskConical, ExternalLink, AlertTriangle, LucideIcon } from 'lucide-react'
import { ALL_TEST_MODULES } from '../../data/testScenarios'
import { TestResult } from '../../types/testing'

interface TestLabMiniWindowProps {
  isOpen: boolean
  onClose: () => void
  onOpenFullLab: () => void
  testResults: Record<string, TestResult>
  onRunTest: (testId: string) => void
  onRunModule: (moduleId: string) => void
  bubblePosition: { x: number, y: number }
}

export function TestLabMiniWindow({
  isOpen,
  onClose,
  onOpenFullLab,
  testResults,
  onRunTest,
  onRunModule,
  bubblePosition
}: TestLabMiniWindowProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  // Statistiques rapides
  const stats = useMemo(() => {
    const allTests = Object.values(testResults)
    return {
      total: allTests.length,
      passed: allTests.filter(t => t.status === 'pass').length,
      failed: allTests.filter(t => t.status === 'fail').length,
      pending: allTests.filter(t => t.status === 'pending').length
    }
  }, [testResults])

  const selectedModule = ALL_TEST_MODULES.find(m => m.id === selectedModuleId)

  console.log('🪟 TestLabMiniWindow appelé - isOpen:', isOpen, 'bubblePosition:', bubblePosition)

  if (!isOpen) return null

  console.log('🪟 TestLabMiniWindow rendu - Position bulle:', bubblePosition)

  // Positionner la fenêtre à côté de la bulle
  const windowX = bubblePosition.x + 80 // 80px = largeur de la bulle + marge
  const windowY = bubblePosition.y

  console.log('🪟 Position fenêtre:', { windowX, windowY })

  return (
    <div
      className="fixed bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden"
      style={{
        position: 'fixed',
        left: `${windowX}px`,
        top: `${windowY}px`,
        width: '320px',
        maxHeight: '500px',
        zIndex: 99998,
        pointerEvents: 'auto',
        display: 'block'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-zinc-800 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h2 className="text-xs font-bold text-white">Test Lab</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullLab}
            className="p-1 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700 rounded transition-colors"
            title="Ouvrir en plein écran"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats compactes */}
      <div className="grid grid-cols-4 gap-1.5 p-2 border-b border-zinc-800 bg-zinc-800/30">
        <div className="text-center">
          <div className="text-sm font-bold text-zinc-300">{stats.total}</div>
          <div className="text-[10px] text-zinc-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-emerald-400">{stats.passed}</div>
          <div className="text-[10px] text-zinc-600">OK</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-rose-400">{stats.failed}</div>
          <div className="text-[10px] text-zinc-600">KO</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-amber-400">{stats.pending}</div>
          <div className="text-[10px] text-zinc-600">...</div>
        </div>
      </div>

      {/* Content scrollable */}
      <div className="overflow-y-auto p-2 max-h-[380px]">
        {!selectedModule ? (
          // Liste des modules
          <div className="space-y-1.5">
            {ALL_TEST_MODULES.map((module) => {
              const moduleTests = module.scenarios
              const modulePassed = moduleTests.filter(t => testResults[t.id]?.status === 'pass').length
              const moduleTotal = moduleTests.length
              const progress = moduleTotal > 0 ? ((modulePassed / moduleTotal) * 100).toFixed(0) : '0'

              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className="w-full p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {typeof module.icon === 'string' ? (
                        <span className="text-xs">{module.icon}</span>
                      ) : (
                        <module.icon className="w-3 h-3 text-zinc-400" />
                      )}
                      <span className="text-xs font-medium text-zinc-300">
                        {module.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-600">{moduleTotal}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{progress}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          // Tests du module
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSelectedModuleId(null)}
                className="text-[10px] text-zinc-400 hover:text-white"
              >
                ← Retour
              </button>
              <button
                onClick={() => onRunModule(selectedModule.id)}
                className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px]"
              >
                <Play className="w-2.5 h-2.5" />
                Tous
              </button>
            </div>

            <div className="space-y-1">
              {selectedModule.scenarios.map((test) => {
                const result = testResults[test.id]
                const status = result?.status || 'pending'
                
                const statusConfig: Record<string, { icon: LucideIcon, color: string, bg: string }> = {
                  pass: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  fail: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  running: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  pending: { icon: AlertTriangle, color: 'text-zinc-600', bg: 'bg-zinc-800/30' },
                  skip: { icon: AlertTriangle, color: 'text-zinc-600', bg: 'bg-zinc-800/30' },
                  monitoring: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  todo: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  useless: { icon: XCircle, color: 'text-zinc-600', bg: 'bg-zinc-800/30' }
                }

                const config = statusConfig[status] || statusConfig.pending
                const StatusIcon = config.icon

                return (
                  <div
                    key={test.id}
                    className={`p-1.5 rounded ${config.bg} flex items-center gap-1.5`}
                  >
                    <StatusIcon className={`w-3 h-3 flex-shrink-0 ${config.color}`} />
                    <span className="text-[10px] text-zinc-300 flex-1 truncate">{test.name}</span>
                    <button
                      onClick={() => onRunTest(test.id)}
                      disabled={status === 'running'}
                      className="p-0.5 text-zinc-400 hover:text-indigo-400 rounded transition-colors disabled:opacity-50"
                    >
                      <Play className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

