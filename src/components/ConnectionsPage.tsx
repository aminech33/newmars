/**
 * Connexions - État des services et intégrations
 * Design aligné sur le style global de l'app
 */

import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
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
  Server,
  HardDrive,
  Cpu
} from 'lucide-react'
import { checkDatabasesHealth, DbHealthStatus } from '../services/api'

// Type pour l'API AI (dispatcher)
interface AiHealthStatus {
  ok: boolean
  provider: string
  dispatcher: string
  version: string
  models: {
    fast: { name: string; cost_per_1m_input: number; cost_per_1m_output: number }
    quality: { name: string; cost_per_1m_input: number; cost_per_1m_output: number }
  }
  session_stats: {
    total_requests: number
    total_cost: number
    requests_by_tier: { fast: number; quality: number }
    fallbacks_used: number
  }
}

// Type pour les stats historiques
interface AiHistoryStats {
  session: {
    total_requests: number
    total_cost: number
    requests_by_tier: { fast: number; quality: number }
    fallbacks_used: number
  }
  today: {
    date: string
    total_requests: number
    total_cost_usd: number
    requests_fast: number
    requests_quality: number
  }
  this_week: {
    period: string
    total_requests: number
    total_cost_usd: number
  }
  this_month: {
    period: string
    total_requests: number
    total_cost_usd: number
  }
  all_time: {
    total_requests: number
    total_cost_usd: number
    first_date: string | null
    last_date: string | null
  }
}

export function ConnectionsPage() {
  const { setView, addToast, currentView } = useStore()
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null)
  const [withingsStatus, setWithingsStatus] = useState<'connected' | 'expired' | 'none'>('none')
  const [withingsExpiry, setWithingsExpiry] = useState<number | null>(null)
  const [aiHealth, setAiHealth] = useState<AiHealthStatus | null>(null)
  const [aiHistory, setAiHistory] = useState<AiHistoryStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    const withingsExpiryStr = localStorage.getItem('withings_token_expiry')
    const expiry = withingsExpiryStr ? parseInt(withingsExpiryStr) : null
    const isExpired = expiry ? Date.now() > expiry : false

    setWithingsExpiry(expiry)
    if (withingsToken && !isExpired) {
      setWithingsStatus('connected')
    } else if (withingsToken && isExpired) {
      setWithingsStatus('expired')
    } else {
      setWithingsStatus('none')
    }

    // 3. OpenAI
    try {
      const response = await fetch('http://localhost:8000/health/ai')
      const data: AiHealthStatus = await response.json()
      setAiHealth(data)
    } catch {
      setAiHealth(null)
    }

    // 4. Stats historiques AI
    try {
      const response = await fetch('http://localhost:8000/health/ai/history')
      const data: AiHistoryStats = await response.json()
      setAiHistory(data)
    } catch {
      setAiHistory(null)
    }

    setIsRefreshing(false)
  }

  useEffect(() => {
    if (currentView === 'connections') {
      checkAllConnections()
    }
  }, [currentView])

  // Helpers
  const getTasksCount = () => {
    if (!dbHealth?.databases?.tasks) return 0
    return (dbHealth.databases.tasks.tasks || 0) + (dbHealth.databases.tasks.projects || 0)
  }

  const getHealthCount = () => {
    if (!dbHealth?.databases?.health) return 0
    return (dbHealth.databases.health.weight_entries || 0) + (dbHealth.databases.health.meals || 0)
  }

  const getLearningCount = () => {
    if (!dbHealth?.databases?.learning) return 0
    return (dbHealth.databases.learning.concepts || 0) + (dbHealth.databases.learning.vocabulary || 0)
  }

  const totalEntries = getTasksCount() + getHealthCount() + getLearningCount()

  const aiStatus = aiHealth?.ok
    ? 'connected'
    : aiHealth
    ? 'not_configured'
    : 'offline'

  const allDbOk = dbHealth?.databases
    ? dbHealth.databases.tasks.ok && dbHealth.databases.health.ok && dbHealth.databases.learning.ok
    : false

  // Compter les services actifs
  const activeServices = [
    dbHealth?.connected,
    aiStatus === 'connected',
    withingsStatus === 'connected'
  ].filter(Boolean).length

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="h-full w-full bg-black flex flex-col">
      {/* Header minimaliste */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => setView('hub')}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all"
            aria-label="Retour au Hub"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-200">Connexions</h1>
            <p className="text-sm text-zinc-500">
              {activeServices}/3 services actifs
            </p>
          </div>
        </div>

        <motion.button
          onClick={checkAllConnections}
          disabled={isRefreshing}
          className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <motion.div
          className="max-w-2xl mx-auto p-6 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* === Section Backend === */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-medium text-zinc-300">Backend Local</h2>
            </div>

            <div className={`rounded-2xl p-6 border transition-all ${
              dbHealth?.connected
                ? allDbOk
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
                : 'bg-zinc-900/50 border-zinc-800'
            }`}>
              {/* Status header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    dbHealth?.connected
                      ? allDbOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                      : 'bg-zinc-800'
                  }`}>
                    <Database className={`w-6 h-6 ${
                      dbHealth?.connected
                        ? allDbOk ? 'text-emerald-400' : 'text-amber-400'
                        : 'text-zinc-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">SQLite</h3>
                    <p className="text-sm text-zinc-500">
                      {dbHealth?.connected ? `${totalEntries} entrées` : 'Non connecté'}
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  dbHealth?.connected
                    ? allDbOk
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {dbHealth?.connected ? (allDbOk ? 'Actif' : 'Partiel') : 'Hors-ligne'}
                </div>
              </div>

              {/* Databases grid */}
              {dbHealth?.connected ? (
                <div className="grid grid-cols-3 gap-3">
                  {/* Tasks DB */}
                  <div className={`p-4 rounded-xl text-center ${
                    dbHealth.databases.tasks.ok ? 'bg-zinc-900/80' : 'bg-red-500/10'
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {dbHealth.databases.tasks.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <HardDrive className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 mb-1">tasks.db</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{getTasksCount()}</p>
                    <p className="text-xs text-zinc-500 mt-1">{dbHealth.databases.tasks.size_kb} KB</p>
                  </div>

                  {/* Health DB */}
                  <div className={`p-4 rounded-xl text-center ${
                    dbHealth.databases.health.ok ? 'bg-zinc-900/80' : 'bg-red-500/10'
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {dbHealth.databases.health.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <HardDrive className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 mb-1">health.db</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{getHealthCount()}</p>
                    <p className="text-xs text-zinc-500 mt-1">{dbHealth.databases.health.size_kb} KB</p>
                  </div>

                  {/* Learning DB */}
                  <div className={`p-4 rounded-xl text-center ${
                    dbHealth.databases.learning.ok ? 'bg-zinc-900/80' : 'bg-red-500/10'
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {dbHealth.databases.learning.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <HardDrive className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 mb-1">learning.db</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{getLearningCount()}</p>
                    <p className="text-xs text-zinc-500 mt-1">{dbHealth.databases.learning.size_kb} KB</p>
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={() => addToast('Lancez: npm run backend', 'info')}
                  className="w-full py-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-sm font-medium text-zinc-300 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Démarrer le backend
                </motion.button>
              )}
            </div>
          </motion.section>

          {/* === Section APIs === */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-medium text-zinc-300">APIs Externes</h2>
            </div>

            <div className="space-y-4">
              {/* OpenAI Dispatcher Card */}
              <div className={`rounded-2xl p-6 border transition-all ${
                aiStatus === 'connected'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : aiStatus === 'not_configured'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-zinc-900/50 border-zinc-800'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      aiStatus === 'connected'
                        ? 'bg-emerald-500/10'
                        : aiStatus === 'not_configured'
                        ? 'bg-amber-500/10'
                        : 'bg-zinc-800'
                    }`}>
                      <Bot className={`w-6 h-6 ${
                        aiStatus === 'connected'
                          ? 'text-emerald-400'
                          : aiStatus === 'not_configured'
                          ? 'text-amber-400'
                          : 'text-zinc-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">AI Dispatcher</h3>
                      <p className="text-sm text-zinc-500">
                        {aiHealth ? 'Routage intelligent OpenAI' : 'Non connecté'}
                      </p>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    aiStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : aiStatus === 'not_configured'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {aiStatus === 'connected' ? 'Actif' :
                     aiStatus === 'not_configured' ? 'Clé manquante' : 'Hors-ligne'}
                  </div>
                </div>

                {/* Modèles disponibles */}
                {aiHealth?.models && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Modèles par difficulté</p>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Fast tier */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Zap className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-xs font-medium text-sky-400">EASY</span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{aiHealth.models.fast.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">${aiHealth.models.fast.cost_per_1m_input}/1M</p>
                      </div>

                      {/* Quality tier */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Activity className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-xs font-medium text-violet-400">QUALITY</span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{aiHealth.models.quality.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">${aiHealth.models.quality.cost_per_1m_input}/1M</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats historiques - Coûts par période */}
                {aiHistory && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Coûts OpenAI</p>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Aujourd'hui */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Aujourd'hui</p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          ${aiHistory.today.total_cost_usd.toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-600">{aiHistory.today.total_requests} req</p>
                      </div>

                      {/* Cette semaine */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Semaine</p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          ${aiHistory.this_week.total_cost_usd.toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-600">{aiHistory.this_week.total_requests} req</p>
                      </div>

                      {/* Ce mois */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Mois</p>
                        <p className="text-lg font-bold text-emerald-400 tabular-nums">
                          ${aiHistory.this_month.total_cost_usd.toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-600">{aiHistory.this_month.total_requests} req</p>
                      </div>

                      {/* Total all-time */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Total</p>
                        <p className="text-lg font-bold text-violet-400 tabular-nums">
                          ${aiHistory.all_time.total_cost_usd.toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-600">{aiHistory.all_time.total_requests} req</p>
                      </div>
                    </div>

                    {/* Période de tracking */}
                    {aiHistory.all_time.first_date && (
                      <p className="text-xs text-zinc-600 text-center mt-3">
                        Tracking depuis le {new Date(aiHistory.all_time.first_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats de session (live) */}
                {aiHealth?.session_stats && aiHealth.session_stats.total_requests > 0 && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Session actuelle</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white tabular-nums">{aiHealth.session_stats.total_requests}</p>
                          <p className="text-xs text-zinc-500">requêtes</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-800"></div>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-400">
                            {aiHealth.session_stats.requests_by_tier.fast} fast
                          </span>
                          <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">
                            {aiHealth.session_stats.requests_by_tier.quality} quality
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400 tabular-nums">
                          ${aiHealth.session_stats.total_cost.toFixed(4)}
                        </p>
                        <p className="text-xs text-zinc-500">coût session</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiStatus !== 'connected' && (
                  <motion.button
                    onClick={() => addToast('Ajoutez OPENAI_API_KEY dans backend/.env', 'info')}
                    className="mt-4 w-full py-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-sm font-medium text-zinc-300 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Configurer
                  </motion.button>
                )}
              </div>

              {/* Withings Card */}
              <div className={`rounded-2xl p-6 border transition-all ${
                withingsStatus === 'connected'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : withingsStatus === 'expired'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-zinc-900/50 border-zinc-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      withingsStatus === 'connected'
                        ? 'bg-emerald-500/10'
                        : withingsStatus === 'expired'
                        ? 'bg-amber-500/10'
                        : 'bg-zinc-800'
                    }`}>
                      <Activity className={`w-6 h-6 ${
                        withingsStatus === 'connected'
                          ? 'text-emerald-400'
                          : withingsStatus === 'expired'
                          ? 'text-amber-400'
                          : 'text-zinc-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Withings</h3>
                      <p className="text-sm text-zinc-500">Balance connectée</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {withingsStatus === 'connected' && withingsExpiry && (
                      <p className="text-sm text-zinc-400 mb-1">
                        Expire {new Date(withingsExpiry).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <p className={`text-sm font-medium ${
                      withingsStatus === 'connected'
                        ? 'text-emerald-400'
                        : withingsStatus === 'expired'
                        ? 'text-amber-400'
                        : 'text-zinc-500'
                    }`}>
                      {withingsStatus === 'connected' ? 'Connecté' :
                       withingsStatus === 'expired' ? 'Token expiré' : 'Non connecté'}
                    </p>
                  </div>
                </div>

                <motion.button
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
                  className="mt-4 w-full py-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-sm font-medium text-zinc-300 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {withingsStatus === 'connected' ? 'Déconnecter' : 'Connecter'}
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* === Section Future === */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-medium text-zinc-300">Bientôt</h2>
            </div>

            <div className="rounded-2xl p-6 border border-dashed border-zinc-700/50 bg-zinc-900/20">
              <div className="flex items-center gap-4 opacity-50">
                <div className="p-3 rounded-xl bg-zinc-800/30">
                  <Cloud className="w-6 h-6 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-500">Cloud Sync</h3>
                  <p className="text-sm text-zinc-600">Synchronisation multi-appareils</p>
                </div>
              </div>
            </div>
          </motion.section>

        </motion.div>
      </main>
    </div>
  )
}
