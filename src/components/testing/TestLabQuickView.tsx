import { useState, useMemo } from 'react'
import { X, Play, CheckCircle2, XCircle, Clock, FlaskConical, ExternalLink, AlertTriangle, LucideIcon } from 'lucide-react'
import { ALL_TEST_MODULES } from '../../data/testScenarios'
import { TestResult } from '../../types/testing'

interface TestLabQuickViewProps {
  isOpen: boolean
  onClose: () => void
  onOpenFullLab: () => void
  testResults: Record<string, TestResult>
  onRunTest: (testId: string) => void
  onRunModule: (moduleId: string) => void
}

export function TestLabQuickView({
  isOpen,
  onClose,
  onOpenFullLab,
  testResults,
  onRunTest,
  onRunModule
}: TestLabQuickViewProps) {
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

  if (!isOpen) return null

  console.log('🔍 TestLabQuickView rendu - isOpen:', isOpen)

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99998] p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Test Lab - Vue Rapide</h2>
              <p className="text-xs text-zinc-500">Tests de l'application</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenFullLab}
              className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Ouvrir le Test Lab complet"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b border-zinc-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-300">{stats.total}</div>
            <div className="text-xs text-zinc-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.passed}</div>
            <div className="text-xs text-zinc-600">Réussis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-400">{stats.failed}</div>
            <div className="text-xs text-zinc-600">Échecs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-zinc-600">En attente</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedModule ? (
            // Liste des modules
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Modules de tests</h3>
              {ALL_TEST_MODULES.map((module) => {
                const moduleTests = module.scenarios
                const modulePassed = moduleTests.filter(t => testResults[t.id]?.status === 'pass').length
                const moduleFailed = moduleTests.filter(t => testResults[t.id]?.status === 'fail').length
                const moduleTotal = moduleTests.length
                const progress = moduleTotal > 0 ? ((modulePassed / moduleTotal) * 100).toFixed(0) : '0'

                return (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {typeof module.icon === 'string' ? (
                          <span className="text-sm">{module.icon}</span>
                        ) : (
                          <module.icon className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                          {module.name}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600">{moduleTotal} tests</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-zinc-500">{progress}%</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      {modulePassed > 0 && (
                        <span className="text-emerald-400">✓ {modulePassed}</span>
                      )}
                      {moduleFailed > 0 && (
                        <span className="text-rose-400">✗ {moduleFailed}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            // Liste des tests du module sélectionné
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  ← Retour aux modules
                </button>
                <button
                  onClick={() => onRunModule(selectedModule.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Lancer tous
                </button>
              </div>

              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                {typeof selectedModule.icon === 'string' ? (
                  <span className="text-base">{selectedModule.icon}</span>
                ) : (
                  <selectedModule.icon className="w-4 h-4" />
                )}
                {selectedModule.name}
              </h3>

              <div className="space-y-2">
                {selectedModule.scenarios.map((test) => {
                  const result = testResults[test.id]
                  const status = result?.status || 'pending'
                  
                  const statusConfig: Record<string, { icon: LucideIcon, color: string, bg: string, border: string }> = {
                    pass: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                    fail: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                    running: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    pending: { icon: AlertTriangle, color: 'text-zinc-600', bg: 'bg-zinc-800/30', border: 'border-zinc-800' },
                    skip: { icon: AlertTriangle, color: 'text-zinc-600', bg: 'bg-zinc-800/30', border: 'border-zinc-800' },
                    monitoring: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                    todo: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    useless: { icon: XCircle, color: 'text-zinc-600', bg: 'bg-zinc-800/30', border: 'border-zinc-800' }
                  }

                  const config = statusConfig[status] || statusConfig.pending
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                            <span className="text-sm text-zinc-300">{test.name}</span>
                          </div>
                          {test.description && (
                            <p className="text-xs text-zinc-500 ml-5">{test.description}</p>
                          )}
                          {result?.error && (
                            <p className="text-xs text-rose-400 ml-5 mt-1">
                              Erreur: {result.error}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onRunTest(test.id)}
                          disabled={status === 'running'}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                          title="Lancer ce test"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={onOpenFullLab}
            className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            Ouvrir le Test Lab complet
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

