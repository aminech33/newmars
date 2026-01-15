/**
 * 🔄 SyncIndicator - Indicateur de synchronisation Backend
 *
 * Affiche l'état de connexion au backend SQLite et permet
 * de déclencher une synchronisation manuelle.
 */

import { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useBackendSync } from '../hooks/useBackendSync'

export function SyncIndicator() {
  const { status, fullSync, checkConnection } = useBackendSync()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Check connection periodically
  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [checkConnection])

  const handleSync = async () => {
    setIsAnimating(true)
    await fullSync()
    setTimeout(() => setIsAnimating(false), 500)
  }

  const getStatusColor = () => {
    if (!status.isConnected) return 'text-zinc-500'
    if (status.syncInProgress) return 'text-blue-400'
    if (status.tasksSync === 'synced' && status.healthSync === 'synced') return 'text-emerald-400'
    if (status.error) return 'text-amber-400'
    return 'text-zinc-400'
  }

  const getStatusIcon = () => {
    if (!status.isConnected) return <CloudOff className="w-4 h-4" />
    if (status.syncInProgress) return <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
    if (status.tasksSync === 'synced' && status.healthSync === 'synced') return <CheckCircle className="w-4 h-4" />
    if (status.error) return <AlertCircle className="w-4 h-4" />
    return <Cloud className="w-4 h-4" />
  }

  const formatLastSync = () => {
    if (!status.lastSync) return 'Jamais'
    const diff = Date.now() - status.lastSync
    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    return new Date(status.lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
          ${status.isConnected ? 'hover:bg-zinc-800/50' : 'bg-zinc-800/30'} ${getStatusColor()}`}
        title={status.isConnected ? 'Backend connecté' : 'Backend hors-ligne'}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium hidden sm:inline">
          {status.isConnected ? 'Sync' : 'Hors-ligne'}
        </span>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                <span className="text-sm font-medium text-zinc-200">
                  {status.isConnected ? 'Backend SQLite' : 'Mode hors-ligne'}
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={!status.isConnected || status.syncInProgress}
                className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Synchroniser maintenant"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${isAnimating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status details */}
          <div className="px-4 py-3 space-y-2">
            {/* Tasks sync status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Tâches & Projets</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                status.tasksSync === 'synced' ? 'bg-emerald-500/20 text-emerald-300' :
                status.tasksSync === 'syncing' ? 'bg-blue-500/20 text-blue-300' :
                status.tasksSync === 'error' ? 'bg-red-500/20 text-red-300' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {status.tasksSync === 'synced' ? 'Synchronisé' :
                 status.tasksSync === 'syncing' ? 'En cours...' :
                 status.tasksSync === 'error' ? 'Erreur' : 'En attente'}
              </span>
            </div>

            {/* Health sync status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Santé & Nutrition</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                status.healthSync === 'synced' ? 'bg-emerald-500/20 text-emerald-300' :
                status.healthSync === 'syncing' ? 'bg-blue-500/20 text-blue-300' :
                status.healthSync === 'error' ? 'bg-red-500/20 text-red-300' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {status.healthSync === 'synced' ? 'Synchronisé' :
                 status.healthSync === 'syncing' ? 'En cours...' :
                 status.healthSync === 'error' ? 'Erreur' : 'En attente'}
              </span>
            </div>

            {/* Last sync time */}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-800">
              <span className="text-zinc-500">Dernière sync</span>
              <span className="text-zinc-400">{formatLastSync()}</span>
            </div>
          </div>

          {/* Error message */}
          {status.error && (
            <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
              <p className="text-xs text-red-300">{status.error}</p>
            </div>
          )}

          {/* Help text */}
          {!status.isConnected && (
            <div className="px-4 py-2 bg-zinc-800/50">
              <p className="text-xs text-zinc-500">
                Les données sont sauvegardées localement. La synchronisation reprendra automatiquement.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}
