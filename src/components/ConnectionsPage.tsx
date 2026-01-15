/**
 * 🔌 ConnectionsPage - État des connexions et intégrations
 */

import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  ArrowLeft,
  Database,
  Cloud,
  Bot,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  Clock
} from 'lucide-react'
import { checkDatabasesHealth, DbHealthStatus } from '../services/api'

export function ConnectionsPage() {
  const { setView, addToast, currentView } = useStore()
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null)
  const [withingsStatus, setWithingsStatus] = useState<'connected' | 'expired' | 'none'>('none')
  const [aiStatus, setAiStatus] = useState<'connected' | 'not_configured' | 'offline'>('offline')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const checkAllConnections = async () => {
    setIsRefreshing(true)

    // 1. SQLite
    try {
      const health = await checkDatabasesHealth()
      setDbHealth(health)
    } catch {
      setDbHealth(null)
    }

    // 2. Withings
    const withingsToken = localStorage.getItem('withings_access_token')
    const withingsExpiry = localStorage.getItem('withings_token_expiry')
    const isExpired = withingsExpiry ? Date.now() > parseInt(withingsExpiry) : false

    if (withingsToken && !isExpired) {
      setWithingsStatus('connected')
    } else if (withingsToken && isExpired) {
      setWithingsStatus('expired')
    } else {
      setWithingsStatus('none')
    }

    // 3. OpenAI
    try {
      const response = await fetch('http://localhost:8000/health')
      const data = await response.json()
      const isConnected = data.ai === 'connected' || data.gemini === 'connected'
      setAiStatus(isConnected ? 'connected' : 'not_configured')
    } catch {
      setAiStatus('offline')
    }

    setLastSync(new Date())
    setIsRefreshing(false)
  }

  useEffect(() => {
    if (currentView === 'connections') {
      checkAllConnections()
    }
  }, [currentView])

  // Helpers
  const totalEntries = dbHealth
    ? dbHealth.modules.tasks.count + dbHealth.modules.health.count + dbHealth.modules.learning.count
    : 0

  const allModulesOk = dbHealth
    ? dbHealth.modules.tasks.ok && dbHealth.modules.health.ok && dbHealth.modules.learning.ok
    : false

  return (
    <div className="h-full bg-black overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('hub')}
                className="p-2.5 -ml-2 hover:bg-zinc-800/50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Connexions
                </h1>
                {lastSync && (
                  <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Mis à jour {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={checkAllConnections}
              disabled={isRefreshing}
              className="p-2.5 hover:bg-zinc-800/50 rounded-xl transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* === SQLITE - Card principale === */}
        <div className={`rounded-2xl p-6 border-2 transition-colors ${
          dbHealth?.connected
            ? allModulesOk
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                dbHealth?.connected
                  ? allModulesOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  : 'bg-red-500/10'
              }`}>
                <Database className={`w-7 h-7 ${
                  dbHealth?.connected
                    ? allModulesOk ? 'text-emerald-400' : 'text-amber-400'
                    : 'text-red-400'
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Base de données</h2>
                <p className="text-sm text-zinc-400">SQLite local</p>
              </div>
            </div>

            {dbHealth?.connected ? (
              <div className="text-right">
                <p className="text-2xl font-bold text-white tabular-nums">{totalEntries}</p>
                <p className="text-sm text-zinc-500">entrées</p>
              </div>
            ) : (
              <span className="px-3 py-1.5 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg">
                Hors-ligne
              </span>
            )}
          </div>

          {/* Modules */}
          {dbHealth?.connected ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Tâches', ...dbHealth.modules.tasks },
                { name: 'Santé', ...dbHealth.modules.health },
                { name: 'Apprentissage', ...dbHealth.modules.learning },
              ].map((mod) => (
                <div
                  key={mod.name}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    mod.ok ? 'bg-zinc-900/50' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {mod.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-zinc-300">{mod.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-400 tabular-nums">{mod.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => addToast('Lancez: npm run backend', 'info')}
              className="w-full py-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-sm font-medium text-zinc-300 transition-colors"
            >
              Démarrer le backend
            </button>
          )}
        </div>

        {/* === APIs externes - Grid 2 colonnes === */}
        <div className="grid grid-cols-2 gap-4">

          {/* Withings */}
          <div className={`rounded-xl p-5 border transition-colors ${
            withingsStatus === 'connected'
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : withingsStatus === 'expired'
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-zinc-900/50 border-zinc-800/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${
                withingsStatus === 'connected'
                  ? 'bg-emerald-500/10'
                  : withingsStatus === 'expired'
                  ? 'bg-amber-500/10'
                  : 'bg-zinc-800/50'
              }`}>
                <Activity className={`w-5 h-5 ${
                  withingsStatus === 'connected'
                    ? 'text-emerald-400'
                    : withingsStatus === 'expired'
                    ? 'text-amber-400'
                    : 'text-zinc-500'
                }`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Withings</h3>
                <p className="text-sm text-zinc-500">Balance</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                withingsStatus === 'connected'
                  ? 'text-emerald-400'
                  : withingsStatus === 'expired'
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}>
                {withingsStatus === 'connected' ? 'Connecté' : withingsStatus === 'expired' ? 'Expiré' : 'Non connecté'}
              </span>

              <button
                onClick={() => {
                  if (withingsStatus === 'connected') {
                    localStorage.removeItem('withings_access_token')
                    localStorage.removeItem('withings_refresh_token')
                    localStorage.removeItem('withings_token_expiry')
                    addToast('Withings déconnecté', 'success')
                    checkAllConnections()
                  } else {
                    setView('health')
                  }
                }}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {withingsStatus === 'connected' ? 'Déco.' : 'Connecter'}
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div className={`rounded-xl p-5 border transition-colors ${
            aiStatus === 'connected'
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : aiStatus === 'not_configured'
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-zinc-900/50 border-zinc-800/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${
                aiStatus === 'connected'
                  ? 'bg-emerald-500/10'
                  : aiStatus === 'not_configured'
                  ? 'bg-amber-500/10'
                  : 'bg-zinc-800/50'
              }`}>
                <Bot className={`w-5 h-5 ${
                  aiStatus === 'connected'
                    ? 'text-emerald-400'
                    : aiStatus === 'not_configured'
                    ? 'text-amber-400'
                    : 'text-zinc-500'
                }`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">OpenAI</h3>
                <p className="text-sm text-zinc-500">Assistant</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                aiStatus === 'connected'
                  ? 'text-emerald-400'
                  : aiStatus === 'not_configured'
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}>
                {aiStatus === 'connected' ? 'Disponible' : aiStatus === 'not_configured' ? 'Clé manquante' : 'Hors-ligne'}
              </span>

              {aiStatus !== 'connected' && (
                <button
                  onClick={() => addToast('Ajoutez OPENAI_API_KEY dans backend/.env', 'info')}
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Configurer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* === Cloud Sync - Coming soon === */}
        <div className="rounded-xl p-5 border border-dashed border-zinc-700/50 bg-zinc-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800/30">
                <Cloud className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="text-base font-medium text-zinc-500">Cloud Sync</h3>
                <p className="text-sm text-zinc-600">Synchronisation multi-appareils</p>
              </div>
            </div>
            <span className="text-sm text-zinc-600 font-medium">Bientôt</span>
          </div>
        </div>

      </div>
    </div>
  )
}
