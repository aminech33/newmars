import { useState, useEffect } from 'react'
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, AlertTriangle, Zap, Download, RotateCcw, Eye, Archive, Shield } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { ALL_TEST_MODULES, runAllAutoTests, initMonitorSnapshot } from '../../data/testScenarios'
import { TestResult, TestRunResults } from '../../types/testing'
import { useTestBackup } from '../../hooks/useTestBackup'

export function TestLabPage() {
  const { setView } = useStore()
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['tasks']))
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'ongoing' | 'archived' | 'useless'>('ongoing')

  // 🛡️ SYSTÈME DE BACKUP AUTOMATIQUE MULTI-NIVEAUX
  const { exportBackup, saveBackup } = useTestBackup(testResults, setTestResults)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR')
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)])
  }

  const toggleTestResult = (testId: string, newStatus: 'pass' | 'fail' | 'todo' | 'useless') => {
    const current = testResults[testId]
    if (current?.status === newStatus) {
      // Si on reclique sur le même statut, on le remet en pending
      const newResults = { ...testResults }
      delete newResults[testId]
      setTestResults(newResults)
      addLog(`⏳ ${testId}: Remis en pending`)
    } else {
      // Sinon on applique le nouveau statut
      const statusMessages = {
        pass: '✅ Testé - Fonctionne',
        fail: '❌ Testé - Ne fonctionne pas',
        todo: '📋 À faire',
        useless: '🚫 Inutile'
      }
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          status: newStatus,
          message: statusMessages[newStatus],
          timestamp: Date.now()
        }
      }))
      addLog(`${statusMessages[newStatus]} - ${testId}`)
    }
  }

  const navigateToModule = (moduleName: string) => {
    const moduleMap: Record<string, string> = {
      'Tasks': 'tasks',
      'Calendar': 'calendar',
      'Health': 'health',
      'Library': 'library',
      'Learning': 'learning',
      'Journal': 'myday',
      'Habits': 'myday',
      'Pomodoro': 'pomodoro',
      'Dashboard': 'dashboard',
      'Widgets': 'hub',
      'AI': 'ai'
    }
    const view = moduleMap[moduleName]
    if (view) {
      setView(view)
      addLog(`🔄 Navigation vers ${moduleName}`)
    }
  }

  const resetResults = async () => {
    if (confirm('⚠️ Réinitialiser tous les résultats de tests ?\n\nUn backup sera créé automatiquement.')) {
      // 🛡️ SAUVEGARDER AVANT DE SUPPRIMER !
      await exportBackup()
      addLog('💾 Backup automatique créé avant reset')
      
      setTestResults({})
      localStorage.removeItem('iku-test-results')
      addLog('🔄 Résultats réinitialisés')
    }
  }

  const exportResults = () => {
    const data: TestRunResults = {
      timestamp: new Date().toISOString(),
      totalTests: ALL_TEST_MODULES.flatMap((m: any) => m.scenarios).length,
      passed: passedCount,
      failed: failedCount,
      pending: pendingCount,
      skipped: Object.values(testResults).filter(r => r.status === 'skip').length,
      todo: todoCount,
      useless: uselessCount,
      duration: Object.values(testResults).reduce((sum, r) => sum + (r.duration || 0), 0),
      results: testResults
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iku-test-results-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addLog('📥 Résultats exportés en JSON')
  }

  const exportTextReport = () => {
    const date = new Date().toLocaleString('fr-FR')
    let report = `═══════════════════════════════════════════════════════════
🧪 IKU - RAPPORT DE TEST
═══════════════════════════════════════════════════════════

📅 Date: ${date}

📊 RÉSUMÉ GLOBAL
───────────────────────────────────────────────────────────
✅ Tests OK        : ${passedCount}
❌ Tests Failed    : ${failedCount}
📋 À faire         : ${todoCount}
🚫 Inutiles        : ${uselessCount}
⏳ Pending         : ${pendingCount}
───────────────────────────────────────────────────────────
📈 Total           : ${totalTests}
💯 Progression     : ${progressPercent}%

═══════════════════════════════════════════════════════════
📋 DÉTAIL PAR MODULE
═══════════════════════════════════════════════════════════

`

    ALL_TEST_MODULES.forEach((module: any) => {
      const moduleTests = module.scenarios
      const modulePassed = moduleTests.filter((t: any) => testResults[t.id]?.status === 'pass').length
      const moduleFailed = moduleTests.filter((t: any) => testResults[t.id]?.status === 'fail').length
      const moduleTodo = moduleTests.filter((t: any) => testResults[t.id]?.status === 'todo').length
      const moduleUseless = moduleTests.filter((t: any) => testResults[t.id]?.status === 'useless').length
      const moduleProgress = moduleTests.length > 0 ? Math.round((modulePassed / moduleTests.length) * 100) : 0

      report += `\n${module.icon} ${module.name.toUpperCase()}\n`
      report += `${'─'.repeat(60)}\n`
      report += `✅ OK: ${modulePassed}  ❌ Fail: ${moduleFailed}  📋 À faire: ${moduleTodo}  🚫 Inutile: ${moduleUseless}  💯 ${moduleProgress}%\n\n`

      moduleTests.forEach((test: any) => {
        const result = testResults[test.id]
        let status = '⏳ PENDING'
        if (result?.status === 'pass') status = '✅ OK'
        else if (result?.status === 'fail') status = '❌ FAIL'
        else if (result?.status === 'todo') status = '📋 À FAIRE'
        else if (result?.status === 'useless') status = '🚫 INUTILE'

        report += `  ${status} - ${test.name}\n`
        report += `     ${test.description}\n`
        if (result?.status === 'fail') {
          report += `     ⚠️  Nécessite correction\n`
        }
        report += `\n`
      })
    })

    report += `═══════════════════════════════════════════════════════════
📝 NOTES
═══════════════════════════════════════════════════════════

Tests critiques : Priorité haute pour V1
Tests high      : Importants pour UX complète
Tests medium    : Fonctionnalités secondaires
Tests low       : Nice-to-have

═══════════════════════════════════════════════════════════
Rapport généré par IKU Test Lab
${date}
═══════════════════════════════════════════════════════════
`

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iku-rapport-tests-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addLog('📄 Rapport texte exporté')
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  // Calcul des stats globales
  const totalTests = ALL_TEST_MODULES.flatMap((m: any) => m.scenarios).length
  const autoTestsCount = ALL_TEST_MODULES.flatMap((m: any) => m.scenarios).filter((s: any) => s.autoTest).length
  const passedCount = Object.values(testResults).filter(r => r.status === 'pass').length
  const failedCount = Object.values(testResults).filter(r => r.status === 'fail').length
  const todoCount = Object.values(testResults).filter(r => r.status === 'todo').length
  const uselessCount = Object.values(testResults).filter(r => r.status === 'useless').length
  const pendingCount = totalTests - passedCount - failedCount - todoCount - uselessCount
  const progressPercent = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0

  const getStatusIcon = (testId: string) => {
    const result = testResults[testId]
    if (result?.status === 'pass') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    }
    if (result?.status === 'fail') {
      return <XCircle className="w-5 h-5 text-rose-400" />
    }
    if (result?.status === 'todo') {
      return <Clock className="w-5 h-5 text-blue-400" />
    }
    if (result?.status === 'useless') {
      return <AlertTriangle className="w-5 h-5 text-zinc-600" />
    }
    return <div className="w-5 h-5 rounded border-2 border-zinc-600" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-amber-400'
      case 'low': return 'text-zinc-500'
      default: return 'text-zinc-400'
    }
  }

  return (
    <div className="h-screen w-full bg-mars-bg overflow-hidden flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('hub')}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  🧪 Test Lab
                </h1>
                <p className="text-sm text-zinc-400">
                  Test interactif de toutes les fonctionnalités
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Auto-backup actif</span>
              </div>
              <button
                onClick={exportBackup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Export manuel de sauvegarde"
              >
                <Shield className="w-4 h-4" />
                Backup
              </button>
              <button
                onClick={resetResults}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={exportTextReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Rapport TXT
              </button>
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Onglets En cours / Archivés / Inutile */}
          <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                activeTab === 'ongoing'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              En cours
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                activeTab === 'archived'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Archive className="w-4 h-4" />
              Archivés ({passedCount})
            </button>
            <button
              onClick={() => setActiveTab('useless')}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                activeTab === 'useless'
                  ? 'bg-zinc-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Inutile ({uselessCount})
            </button>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-7 gap-3">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{totalTests}</div>
              <div className="text-xs text-zinc-400">Total</div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-400">{passedCount}</div>
              <div className="text-xs text-zinc-400">✅ OK</div>
            </div>
            <div className="bg-rose-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-rose-400">{failedCount}</div>
              <div className="text-xs text-zinc-400">❌ Fail</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{todoCount}</div>
              <div className="text-xs text-zinc-400">📋 À faire</div>
            </div>
            <div className="bg-zinc-600/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-zinc-500">{uselessCount}</div>
              <div className="text-xs text-zinc-400">🚫 Inutile</div>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-zinc-400">{pendingCount}</div>
              <div className="text-xs text-zinc-400">⏳ Pending</div>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-cyan-400">{progressPercent}%</div>
              <div className="text-xs text-zinc-400">Progress</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-6">
        {/* Tests list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {ALL_TEST_MODULES.map((module: any) => {
            const moduleTests = module.scenarios
            
            // Filtrer selon la vue (archivés / en cours / inutile)
            let filteredTests = moduleTests
            if (activeTab === 'archived') {
              // Vue archivés : SEULEMENT les tests terminés ✅
              filteredTests = moduleTests.filter((t: any) => testResults[t.id]?.status === 'pass')
            } else if (activeTab === 'useless') {
              // Vue inutile : SEULEMENT les tests marqués inutile 🚫
              filteredTests = moduleTests.filter((t: any) => testResults[t.id]?.status === 'useless')
            } else {
              // Vue "en cours" : Pending, Fail, À faire (pas pass ni useless)
              filteredTests = moduleTests.filter((t: any) => {
                const result = testResults[t.id]
                // On affiche si : pas de résultat OU résultat = fail/todo
                return !result || (result.status !== 'pass' && result.status !== 'useless')
              })
            }
            
            const modulePassed = moduleTests.filter((t: any) => testResults[t.id]?.status === 'pass').length
            const moduleFailed = moduleTests.filter((t: any) => testResults[t.id]?.status === 'fail').length
            const isExpanded = expandedModules.has(module.id)

            // Ne pas afficher le module si aucun test à afficher
            if (filteredTests.length === 0) {
              return null
            }

            return (
              <div key={module.id} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{module.icon}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {activeTab === 'archived' && `${filteredTests.length} archivés`}
                        {activeTab === 'useless' && `${filteredTests.length} inutiles`}
                        {activeTab === 'ongoing' && `${filteredTests.length} en cours`}
                        {` • ${modulePassed}/${moduleTests.length} complétés`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-zinc-500">
                      {Math.round((modulePassed / moduleTests.length) * 100)}%
                    </div>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Module tests */}
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-2">
                    {filteredTests.map((test: any) => {
                      const result = testResults[test.id]
                      const currentStatus = result?.status

                      return (
                        <div
                          key={test.id}
                          className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getStatusIcon(test.id)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium">{test.name}</h4>
                                  <p className="text-sm text-zinc-400 mt-1">{test.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs ${getPriorityColor(test.priority)}`}>
                                      {test.priority}
                                    </span>
                                    {currentStatus && (
                                      <span className={`text-xs ${
                                        currentStatus === 'pass' ? 'text-emerald-400' :
                                        currentStatus === 'fail' ? 'text-rose-400' :
                                        currentStatus === 'todo' ? 'text-blue-400' :
                                        'text-zinc-500'
                                      }`}>
                                        {currentStatus === 'pass' && '✓ Fonctionne'}
                                        {currentStatus === 'fail' && '✗ Ne marche pas'}
                                        {currentStatus === 'todo' && '📋 À faire'}
                                        {currentStatus === 'useless' && '🚫 Inutile'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => navigateToModule(test.module)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    Aller au module
                                  </button>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => toggleTestResult(test.id, 'pass')}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        currentStatus === 'pass'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-zinc-700 text-zinc-300 hover:bg-emerald-600/50'
                                      }`}
                                      title="Marquer comme testé et fonctionnel"
                                    >
                                      ✅
                                    </button>
                                    <button
                                      onClick={() => toggleTestResult(test.id, 'fail')}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        currentStatus === 'fail'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-zinc-700 text-zinc-300 hover:bg-rose-600/50'
                                      }`}
                                      title="Marquer comme ne fonctionnant pas"
                                    >
                                      ❌
                                    </button>
                                    <button
                                      onClick={() => toggleTestResult(test.id, 'todo')}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        currentStatus === 'todo'
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-zinc-700 text-zinc-300 hover:bg-blue-600/50'
                                      }`}
                                      title="Marquer comme à faire"
                                    >
                                      📋
                                    </button>
                                    <button
                                      onClick={() => toggleTestResult(test.id, 'useless')}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        currentStatus === 'useless'
                                          ? 'bg-zinc-600 text-white'
                                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600/50'
                                      }`}
                                      title="Marquer comme inutile/non pertinent"
                                    >
                                      🚫
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {test.manualSteps && currentStatus !== 'useless' && (
                                <details className="mt-3">
                                  <summary className="text-sm text-cyan-400 cursor-pointer hover:text-cyan-300">
                                    Voir les étapes à suivre
                                  </summary>
                                  <ol className="mt-2 space-y-1 text-sm text-zinc-400 list-decimal list-inside">
                                    {test.manualSteps.map((step: string, i: number) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ol>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Console logs */}
        <div className="w-96 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Console Logs</h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center py-8">
                Aucun log pour le moment
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.includes('✅') ? 'text-emerald-400' :
                    log.includes('❌') ? 'text-rose-400' :
                    log.includes('⚠️') ? 'text-amber-400' :
                    log.includes('⏳') ? 'text-cyan-400' :
                    'text-zinc-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

