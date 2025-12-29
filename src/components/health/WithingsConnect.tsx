import { useState, useEffect } from 'react'
import { Zap, Check, RefreshCw, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getWithingsTokens, saveWithingsTokens, clearSecureData } from '../../utils/secureStorage'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const WITHINGS_API_URL = `${API_URL}/api/withings`

export function WithingsConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [tokens, setTokens] = useState<any>(null)
  const { addWeightEntry, addToast } = useStore()

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const storedTokens = getWithingsTokens()
    if (storedTokens) {
      setTokens(storedTokens)
      setIsConnected(true)
    }
  }, [])

  // Rafraîchir automatiquement les tokens avant expiration
  useEffect(() => {
    if (!tokens || !isConnected) return
    
    const checkTokenExpiry = async () => {
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = tokens.expires_at - now
      
      // Rafraîchir 5 minutes (300s) avant expiration
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        console.log('Token expire bientôt, rafraîchissement automatique...')
        await refreshToken()
      } else if (timeUntilExpiry <= 0) {
        console.log('Token expiré, rafraîchissement automatique...')
        await refreshToken()
      }
    }
    
    // Vérifier toutes les minutes
    const interval = setInterval(checkTokenExpiry, 60000)
    
    // Vérifier immédiatement au chargement
    checkTokenExpiry()
    
    return () => clearInterval(interval)
  }, [tokens, isConnected])

  const handleConnect = async () => {
    setIsConnecting(true)
    
    try {
      // 1. Obtenir l'URL d'authentification
      const authRes = await fetch(`${API_URL}/auth`)
      
      if (!authRes.ok) {
        throw new Error('Erreur lors de la récupération de l\'URL d\'authentification')
      }
      
      const { auth_url } = await authRes.json()
      
      // 2. Ouvrir la fenêtre d'autorisation
      const authWindow = window.open(
        auth_url,
        'Withings Auth',
        'width=600,height=700,toolbar=no,menubar=no,location=no,status=no'
      )
      
      if (!authWindow) {
        addToast('Impossible d\'ouvrir la fenêtre. Autorise les popups.', 'error')
        setIsConnecting(false)
        return
      }
      
      // 3. Écouter le callback (via localStorage)
      const checkInterval = setInterval(async () => {
        try {
          // Vérifier si la fenêtre a fermé
          if (authWindow.closed) {
            clearInterval(checkInterval)
            
            // Vérifier une dernière fois si les tokens ont été stockés
            const storedTokens = localStorage.getItem('withings_tokens')
            if (!storedTokens) {
              addToast('Connexion annulée ou échouée', 'error')
            }
            
            setIsConnecting(false)
            return
          }
          
          // Vérifier dans localStorage si le callback a stocké les tokens
          const storedTokens = localStorage.getItem('withings_tokens')
          if (storedTokens) {
            clearInterval(checkInterval)
            authWindow.close()
            
            const parsedTokens = JSON.parse(storedTokens)
            setTokens(parsedTokens)
            setIsConnected(true)
            
            addToast('Balance Withings connectée! 🎉', 'success')
            
            // 4. Synchroniser automatiquement
            await syncWeights(parsedTokens.access_token)
          }
        } catch (error) {
          console.error('Erreur vérification tokens:', error)
        }
      }, 1000)
      
      // Timeout après 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        if (authWindow && !authWindow.closed) {
          authWindow.close()
          addToast('Connexion annulée (timeout 5 min)', 'error')
        }
        setIsConnecting(false)
      }, 300000)
      
    } catch (error) {
      console.error('Erreur connexion Withings:', error)
      addToast(`Erreur: ${error.message || 'Connexion impossible'}`, 'error')
      setIsConnecting(false)
    }
  }

  const refreshToken = async () => {
    if (!tokens || !tokens.refreshToken) {
      console.error('Pas de refresh token disponible')
      return
    }
    
    try {
      const res = await fetch(`${WITHINGS_API_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refreshToken })
      })
      
      if (!res.ok) {
        throw new Error('Échec du rafraîchissement du token')
      }
      
      const newTokens = await res.json()
      const updatedTokens = {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresIn: newTokens.expires_in,
        createdAt: Date.now()
      }
      
      setTokens(updatedTokens)
      saveWithingsTokens(updatedTokens)
      
      console.log('Token Withings rafraîchi avec succès')
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error)
      // Si le rafraîchissement échoue, déconnecter l'utilisateur
      handleDisconnect()
      addToast('Session Withings expirée. Reconnectez-vous.', 'error')
    }
  }

  const syncWeights = async (accessToken: string, retryOnError = true) => {
    setIsSyncing(true)
    
    try {
      const res = await fetch(
        `${WITHINGS_API_URL}/sync?access_token=${accessToken}&days_back=90`
      )
      
      // Si token expiré, tenter de rafraîchir et réessayer
      if (res.status === 401 && retryOnError) {
        console.log('Token expiré pendant sync, rafraîchissement...')
        await refreshToken()
        // Réessayer avec le nouveau token (une seule fois)
        return await syncWeights(tokens.accessToken, false)
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Erreur de synchronisation')
      }
      
      const { measurements, count } = await res.json()
      
      // Ajouter chaque pesée au store avec toutes les métriques Withings
      if (measurements && measurements.length > 0) {
        measurements.forEach((m: any) => {
          addWeightEntry({
            weight: m.weight,
            date: m.date,
            fatMassPercent: m.fat_mass_percent,
            muscleMass: m.muscle_mass,
            boneMass: m.bone_mass,
            waterPercent: m.water_percent,
            heartRate: m.heart_rate,
            source: 'withings'
          })
        })
        
        addToast(
          `${count} pesée${count > 1 ? 's' : ''} synchronisée${count > 1 ? 's' : ''}! 🎉`,
          'success'
        )
      } else {
        addToast('Aucune pesée trouvée dans les 90 derniers jours', 'info')
      }
    } catch (error: any) {
      console.error('Erreur sync:', error)
      addToast(`Erreur de synchronisation: ${error.message}`, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = () => {
    clearSecureData()
    setTokens(null)
    setIsConnected(false)
    addToast('Balance Withings déconnectée', 'info')
  }

  if (isConnected) {
    return (
      <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-300">
                Balance Withings connectée
              </h3>
              <p className="text-xs text-zinc-500">
                Synchronisation automatique activée
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => syncWeights(tokens.accessToken)}
            disabled={isSyncing}
            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Synchroniser maintenant
              </>
            )}
          </button>
          
          <button
            onClick={handleDisconnect}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-300 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Déconnecter
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-zinc-900/30 rounded-lg">
          <p className="text-xs text-zinc-500">
            💡 Les pesées des 90 derniers jours ont été synchronisées. 
            Toute nouvelle pesée sur ta balance sera disponible en cliquant sur "Synchroniser maintenant".
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-indigo-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-zinc-300 mb-2">
            Connecter ta balance Withings
          </h3>
          <p className="text-sm text-zinc-500 mb-3">
            Synchronise automatiquement tes pesées avec toutes les métriques :
          </p>
          
          <ul className="text-xs text-zinc-600 space-y-1 mb-4">
            <li>⚖️ Poids</li>
            <li>💪 Masse musculaire</li>
            <li>🔥 Pourcentage de masse grasse</li>
            <li>💧 Hydratation</li>
            <li>🦴 Masse osseuse</li>
            <li>❤️ Fréquence cardiaque</li>
          </ul>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Connecter Withings
              </>
            )}
          </button>
          
          {isConnecting && (
            <p className="text-xs text-zinc-500 mt-2">
              Une fenêtre va s'ouvrir. Connecte-toi à ton compte Withings et autorise l'accès.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}



