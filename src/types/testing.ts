// Types pour le Test Lab

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'monitoring' | 'todo' | 'useless'
export type TestPriority = 'critical' | 'high' | 'medium' | 'low'
export type TestMode = 'auto' | 'manual' | 'monitor' // Nouveau : mode monitor

export interface TestResult {
  status: TestStatus
  message: string
  duration?: number
  error?: string
  timestamp?: number
}

export interface TestScenario {
  id: string
  module: string
  name: string
  description: string
  priority: TestPriority
  mode?: TestMode // Mode du test
  autoTest?: () => Promise<TestResult> | TestResult
  monitorTest?: () => boolean // Nouvelle fonction: vérifie si l'action a été faite
  monitorMessage?: string // Message quand monitoring actif
  manualSteps?: string[]
  expectedResult: string
}

export interface TestModule {
  id: string
  name: string
  icon: string
  scenarios: TestScenario[]
}

export interface TestRunResults {
  timestamp: string
  totalTests: number
  passed: number
  failed: number
  pending: number
  skipped: number
  todo: number
  useless: number
  duration: number
  results: Record<string, TestResult>
}

// État du monitoring
export interface MonitoringState {
  activeTests: string[] // IDs des tests en monitoring
  snapshots: Record<string, any> // Snapshots de l'état initial
}
