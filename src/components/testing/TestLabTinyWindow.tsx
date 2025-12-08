import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ExternalLink, X, AlertTriangle, ChevronRight } from 'lucide-react'
import { ALL_TEST_MODULES } from '../../data/testScenarios'
import { TestResult } from '../../types/testing'

interface TestLabTinyWindowProps {
  isOpen: boolean
  onClose: () => void
  onOpenFullLab: () => void
  testResults: Record<string, TestResult>
  onRunTest: (testId: string) => void
  onRunModule: (moduleId: string) => void
  setTestResults: (results: Record<string, TestResult> | ((prev: Record<string, TestResult>) => Record<string, TestResult>)) => void
}

export function TestLabTinyWindow({ 
  isOpen, 
  onClose,
  onOpenFullLab,
  testResults,
  onRunTest,
  onRunModule,
  setTestResults
}: TestLabTinyWindowProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  if (!isOpen) return null

  // Toggle module expansion
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

  // Stats
  const allTests = ALL_TEST_MODULES.flatMap(m => m.scenarios)
  const totalTests = allTests.length
  const passedTests = allTests.filter(t => testResults[t.id]?.status === 'pass').length
  const failedTests = allTests.filter(t => testResults[t.id]?.status === 'fail').length
  const todoTests = allTests.filter(t => testResults[t.id]?.status === 'todo').length
  const uselessTests = allTests.filter(t => testResults[t.id]?.status === 'useless').length
  const runningTests = allTests.filter(t => testResults[t.id]?.status === 'running').length

  // Fonction pour toggle le statut d'un test
  const toggleTestStatus = (testId: string, status: 'pass' | 'fail' | 'todo' | 'useless') => {
    const current = testResults[testId]
    if (current?.status === status) {
      // Si on reclique sur le même statut, on le remet en pending
      setTestResults(prev => {
        const newResults = { ...prev }
        delete newResults[testId]
        return newResults
      })
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
          status,
          message: statusMessages[status],
          timestamp: Date.now()
        }
      }))
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 99997
        }}
      />
      
      {/* Fenêtre */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          width: '420px',
          maxHeight: '700px',
          background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '16px',
          zIndex: 99998,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '14px 18px', 
          borderBottom: '1px solid #27272a',
          background: 'linear-gradient(to bottom, #27272a, #1f1f23)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🧪</span>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
              Test Lab - Tous les tests
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onOpenFullLab}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px'
              }}
              title="Ouvrir en plein écran"
              onMouseOver={(e) => e.currentTarget.style.background = '#3f3f46'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ExternalLink style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontSize: '24px',
                padding: '0 6px',
                lineHeight: 1,
                borderRadius: '6px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#3f3f46'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          padding: '14px 18px', 
          borderBottom: '1px solid #27272a',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          background: '#1c1c1f'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399' }}>{passedTests}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>✅ PASS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f87171' }}>{failedTests}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>❌ FAIL</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa' }}>{todoTests}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>📋 TODO</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#71717a' }}>{uselessTests}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>🚫 USELESS</div>
          </div>
        </div>

        {/* Liste de TOUS les tests avec menus déroulants */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px'
        }}>
          {ALL_TEST_MODULES.map((module) => {
            const isExpanded = expandedModules.has(module.id)
            const moduleTests = module.scenarios
            const modulePassed = moduleTests.filter(t => testResults[t.id]?.status === 'pass').length
            const moduleFailed = moduleTests.filter(t => testResults[t.id]?.status === 'fail').length
            const moduleTotal = moduleTests.length
            const progress = moduleTotal > 0 ? Math.round((modulePassed / moduleTotal) * 100) : 0

            return (
              <div key={module.id} style={{ marginBottom: '12px' }}>
                {/* En-tête du module cliquable */}
                <button
                  onClick={() => toggleModule(module.id)}
                  style={{ 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '12px',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#3f3f46'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#27272a'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <ChevronRight 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: '#a1a1aa',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                    <span style={{ fontSize: '14px' }}>
                      {typeof module.icon === 'string' ? module.icon : '📦'}
                    </span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', color: '#e4e4e7', fontWeight: '600' }}>
                        {module.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                        {modulePassed}/{moduleTotal} • {progress}%
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#71717a',
                    background: '#18181b',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {moduleTotal}
                  </div>
                </button>

                {/* Tests du module (affichés si déplié) */}
                {isExpanded && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px',
                    marginTop: '8px',
                    paddingLeft: '8px'
                  }}>
                    {module.scenarios.map((test) => {
                  const result = testResults[test.id]
                  const status = result?.status || 'pending'

                  return (
                    <div
                      key={test.id}
                      style={{
                        padding: '10px 12px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ 
                        fontSize: '13px', 
                        color: '#e4e4e7', 
                        flex: 1,
                        lineHeight: '1.4'
                      }}>
                        {test.name}
                      </span>
                      
                      {/* 4 Boutons d'état */}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => toggleTestStatus(test.id, 'pass')}
                          style={{
                            padding: '5px 8px',
                            background: status === 'pass' ? '#34d399' : '#27272a',
                            border: '1px solid',
                            borderColor: status === 'pass' ? '#34d399' : '#3f3f46',
                            borderRadius: '4px',
                            color: status === 'pass' ? 'white' : '#71717a',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Marquer comme réussi"
                        >
                          <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                          PASS
                        </button>
                        <button
                          onClick={() => toggleTestStatus(test.id, 'fail')}
                          style={{
                            padding: '5px 8px',
                            background: status === 'fail' ? '#f87171' : '#27272a',
                            border: '1px solid',
                            borderColor: status === 'fail' ? '#f87171' : '#3f3f46',
                            borderRadius: '4px',
                            color: status === 'fail' ? 'white' : '#71717a',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Marquer comme échoué"
                        >
                          <XCircle style={{ width: '12px', height: '12px' }} />
                          FAIL
                        </button>
                        <button
                          onClick={() => toggleTestStatus(test.id, 'todo')}
                          style={{
                            padding: '5px 8px',
                            background: status === 'todo' ? '#60a5fa' : '#27272a',
                            border: '1px solid',
                            borderColor: status === 'todo' ? '#60a5fa' : '#3f3f46',
                            borderRadius: '4px',
                            color: status === 'todo' ? 'white' : '#71717a',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Marquer comme à faire"
                        >
                          <Clock style={{ width: '12px', height: '12px' }} />
                          TODO
                        </button>
                        <button
                          onClick={() => toggleTestStatus(test.id, 'useless')}
                          style={{
                            padding: '5px 8px',
                            background: status === 'useless' ? '#71717a' : '#27272a',
                            border: '1px solid',
                            borderColor: status === 'useless' ? '#71717a' : '#3f3f46',
                            borderRadius: '4px',
                            color: status === 'useless' ? 'white' : '#71717a',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Marquer comme inutile"
                        >
                          <AlertTriangle style={{ width: '12px', height: '12px' }} />
                          USELESS
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )})}
        </div>
      </div>
    </>
  )
}
