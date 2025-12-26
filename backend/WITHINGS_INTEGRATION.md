# 🔗 Intégration Withings - Synchronisation automatique des pesées

## 📋 Vue d'ensemble

Cette intégration permet de **connecter ta balance Withings** à l'application et de **synchroniser automatiquement** toutes tes pesées avec les métriques avancées :

- ⚖️ **Poids** (kg)
- 📊 **IMC** (calculé automatiquement)
- 💪 **Masse musculaire** (kg)
- 🔥 **Masse grasse** (%)
- 💧 **Masse hydrique** (%)
- 🦴 **Masse osseuse** (kg)
- ❤️ **Fréquence cardiaque** (bpm, si mesurée)

---

## 🚀 Configuration rapide

### 1️⃣ Créer un compte développeur Withings

1. Va sur https://developer.withings.com/
2. Clique sur **"Create an account"** ou connecte-toi
3. Va dans **"My Applications"** → **"Create Application"**
4. Remplis le formulaire :
   - **Application Name** : `IKU App` (ou ton nom d'app)
   - **Description** : `Personal productivity and health tracking app`
   - **Callback URI** : `https://TON-URL-NGROK.ngrok-free.app/api/withings/callback`
   - **Company Website** : `http://localhost:5173` (ou ton domaine)
5. Accepte les conditions et soumets
6. **Note les credentials** :
   - `Client ID` : ex. `abc123def456`
   - `Client Secret` : ex. `xyz789abc123def456`

### 2️⃣ Configurer le backend

1. Ouvre `/backend/.env` (ou crée-le depuis `env.example`)
2. Ajoute tes credentials Withings :

```bash
# Withings API
WITHINGS_CLIENT_ID=ton_client_id_ici
WITHINGS_CLIENT_SECRET=ton_client_secret_ici
WITHINGS_REDIRECT_URI=https://TON-URL-NGROK.ngrok-free.app/api/withings/callback
```

3. Redémarre le backend :
```bash
cd backend
python -m uvicorn main:app --reload
```

### 3️⃣ Tester l'intégration

1. Va sur http://localhost:8000/docs (Swagger UI)
2. Tu verras la section **"Withings Integration"** avec toutes les routes
3. Teste `/api/withings/auth` pour obtenir l'URL d'authentification

---

## 📡 Routes API disponibles

### 1. **`GET /api/withings/auth`**
Génère l'URL pour connecter le compte Withings

**Response:**
```json
{
  "auth_url": "https://account.withings.com/oauth2_user/authorize2?...",
  "message": "Redirige l'utilisateur vers cette URL"
}
```

**Usage Frontend:**
```typescript
const response = await fetch('http://localhost:8000/api/withings/auth')
const { auth_url } = await response.json()
window.open(auth_url, '_blank')  // Ouvre dans une nouvelle fenêtre
```

---

### 2. **`GET /api/withings/callback`** *(Automatique)*
Callback OAuth2 - Withings redirige ici après autorisation

Cette route est appelée **automatiquement** par Withings après que l'utilisateur ait autorisé l'accès.

**Response:**
```json
{
  "status": "success",
  "message": "Balance Withings connectée avec succès! 🎉",
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1703001234,
    "user_id": "12345"
  },
  "redirect": "/health/profile?withings=connected"
}
```

**⚠️ Important :** Sauvegarde les tokens de manière **sécurisée** (chiffrés en DB ou localStorage chiffré).

---

### 3. **`GET /api/withings/sync`**
Synchronise les pesées depuis Withings

**Parameters:**
- `access_token` (string, required) : Token d'accès Withings
- `days_back` (int, optional) : Nombre de jours à récupérer (défaut: 30)

**Response:**
```json
{
  "status": "success",
  "count": 15,
  "measurements": [
    {
      "weight": 75.2,
      "date": "2024-12-26",
      "fat_mass_percent": 18.5,
      "muscle_mass": 58.3,
      "bone_mass": 3.2,
      "water_percent": 62.1,
      "heart_rate": 68
    },
    ...
  ],
  "message": "15 pesée(s) synchronisée(s) depuis Withings 🎉"
}
```

**Usage Frontend:**
```typescript
const response = await fetch(
  `http://localhost:8000/api/withings/sync?access_token=${token}&days_back=30`
)
const { measurements } = await response.json()

// Ajouter chaque mesure au store
measurements.forEach(m => {
  addWeightEntry({ weight: m.weight, date: m.date })
})
```

---

### 4. **`POST /api/withings/refresh-token`**
Rafraîchit l'access_token (expire toutes les 3h)

**Body:**
```json
{
  "refresh_token": "ton_refresh_token"
}
```

**Response:**
```json
{
  "access_token": "nouveau_token",
  "refresh_token": "nouveau_refresh_token",
  "expires_at": 1703012345
}
```

**⚡ Automatisation :** Appelle cette route automatiquement 5 minutes avant l'expiration du token.

---

### 5. **`POST /api/withings/webhook`** *(Avancé)*
Webhook pour synchronisation **temps réel**

Withings enverra un POST à cette URL à **chaque nouvelle pesée** sur ta balance !

**Configuration :**
1. Va sur https://developer.withings.com/dashboard
2. Va dans **"Webhooks"**
3. Ajoute l'URL : `https://ton-domaine.com/api/withings/webhook`
4. Sélectionne **"Weight"** comme type de notification

**⚠️ Nécessite :**
- Un domaine public (pas localhost)
- HTTPS obligatoire
- Configurer `WITHINGS_WEBHOOK_SECRET` dans `.env`

---

## 🎨 Intégration Frontend

### Exemple de composant React

```typescript
// src/components/health/WithingsConnect.tsx
import { useState } from 'react'
import { useStore } from '../../store/useStore'

export function WithingsConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [tokens, setTokens] = useState<any>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    
    try {
      // 1. Obtenir l'URL d'auth
      const authRes = await fetch('http://localhost:8000/api/withings/auth')
      const { auth_url } = await authRes.json()
      
      // 2. Ouvrir la fenêtre d'autorisation
      const authWindow = window.open(auth_url, '_blank', 'width=600,height=700')
      
      // 3. Écouter le callback (via localStorage ou message)
      const checkInterval = setInterval(async () => {
        const storedTokens = localStorage.getItem('withings_tokens')
        if (storedTokens) {
          clearInterval(checkInterval)
          authWindow?.close()
          
          const parsedTokens = JSON.parse(storedTokens)
          setTokens(parsedTokens)
          setIsConnected(true)
          
          // 4. Synchroniser les pesées
          await syncWeights(parsedTokens.access_token)
        }
      }, 1000)
      
      // Timeout après 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        setIsConnecting(false)
      }, 300000)
      
    } catch (error) {
      console.error('Erreur connexion Withings:', error)
      setIsConnecting(false)
    }
  }

  const syncWeights = async (accessToken: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/withings/sync?access_token=${accessToken}&days_back=90`
      )
      const { measurements } = await res.json()
      
      // Ajouter au store
      measurements.forEach((m: any) => {
        useStore.getState().addWeightEntry({
          weight: m.weight,
          date: m.date
        })
      })
      
      useStore.getState().addToast(
        `${measurements.length} pesées synchronisées! 🎉`,
        'success'
      )
    } catch (error) {
      console.error('Erreur sync:', error)
    }
  }

  if (isConnected) {
    return (
      <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
        <p className="text-emerald-400">✅ Balance Withings connectée</p>
        <button 
          onClick={() => syncWeights(tokens.access_token)}
          className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-lg"
        >
          Synchroniser maintenant
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {isConnecting ? 'Connexion en cours...' : '🔗 Connecter ma balance Withings'}
    </button>
  )
}
```

---

## 🔄 Flux d'authentification complet

```
1. User clique "Connecter Withings" 
   → Frontend appelle GET /api/withings/auth
   
2. Frontend ouvre auth_url dans nouvelle fenêtre
   → User autorise l'accès sur withings.com
   
3. Withings redirige vers GET /api/withings/callback?code=...
   → Backend échange le code contre access_token + refresh_token
   
4. Backend retourne les tokens au frontend
   → Frontend sauvegarde les tokens (localStorage/DB)
   
5. Frontend appelle GET /api/withings/sync
   → Backend récupère toutes les pesées
   → Frontend ajoute les pesées au store
   
6. ✅ Balance connectée! Pesées synchronisées automatiquement
```

---

## 🔐 Sécurité

### ⚠️ Points d'attention :

1. **Ne JAMAIS exposer** `CLIENT_SECRET` côté frontend
2. **Chiffrer les tokens** avant de les sauvegarder en DB
3. **Rafraîchir automatiquement** les access_tokens (expirent après 3h)
4. **Vérifier la signature** des webhooks avec `WITHINGS_WEBHOOK_SECRET`
5. **Utiliser HTTPS** en production

### 🔒 Exemple de stockage sécurisé :

```python
# Backend - Sauvegarder les tokens chiffrés
from cryptography.fernet import Fernet

ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')  # Générer avec Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

def save_tokens(user_id: str, tokens: dict):
    encrypted_tokens = cipher.encrypt(json.dumps(tokens).encode())
    # Sauvegarder encrypted_tokens en DB
    
def get_tokens(user_id: str) -> dict:
    encrypted_tokens = # Récupérer depuis DB
    decrypted = cipher.decrypt(encrypted_tokens)
    return json.loads(decrypted)
```

---

## 🧪 Tests

### Tester avec Postman ou curl :

```bash
# 1. Obtenir l'URL d'auth
curl http://localhost:8000/api/withings/auth

# 2. Ouvrir l'URL dans un navigateur et autoriser

# 3. Après le callback, utiliser l'access_token pour sync
curl "http://localhost:8000/api/withings/sync?access_token=TON_TOKEN&days_back=30"
```

---

## 📊 Métriques disponibles

| Type | Code API | Description | Unité |
|------|----------|-------------|-------|
| Poids | 1 | Poids corporel | kg |
| Masse grasse | 6 | Pourcentage de masse grasse | % |
| Masse musculaire | 76 | Masse musculaire totale | kg |
| Hydratation | 77 | Pourcentage d'eau | % |
| Masse osseuse | 88 | Masse osseuse | kg |
| Fréquence cardiaque | 91 | BPM au moment de la pesée | bpm |

---

## 🎯 Prochaines étapes

### À implémenter :

1. **Stockage persistant des tokens** (DB ou fichier chiffré)
2. **Rafraîchissement automatique** des tokens
3. **UI Frontend** pour connecter/déconnecter
4. **Synchronisation automatique** toutes les 6h
5. **Webhook en production** pour sync temps réel
6. **Graphiques avancés** avec toutes les métriques (masse grasse, muscle, etc.)

---

## 🐛 Troubleshooting

### Erreur : "WITHINGS_CLIENT_ID non configuré"
→ Vérifie que `.env` contient bien `WITHINGS_CLIENT_ID=...`

### Erreur : "Échec d'obtention du token"
→ Vérifie que `REDIRECT_URI` dans `.env` correspond **exactement** à celle configurée sur developer.withings.com

### Erreur : "Signature webhook invalide"
→ Configure `WITHINGS_WEBHOOK_SECRET` dans `.env` avec la valeur fournie par Withings

### Les pesées ne s'affichent pas
→ Vérifie que `access_token` est valide (expire après 3h) et rafraîchis-le si nécessaire

---

## 📚 Documentation officielle

- 🔗 **API Withings** : https://developer.withings.com/api-reference/
- 🔗 **OAuth2 Flow** : https://developer.withings.com/oauth2/
- 🔗 **Webhooks** : https://developer.withings.com/api-reference/#tag/notify

---

## ✅ Checklist de déploiement

- [ ] Créer un compte développeur Withings
- [ ] Obtenir `CLIENT_ID` et `CLIENT_SECRET`
- [ ] Configurer `.env` avec les credentials
- [ ] Redémarrer le backend
- [ ] Tester l'authentification OAuth2
- [ ] Implémenter l'UI frontend pour la connexion
- [ ] Tester la synchronisation des pesées
- [ ] Mettre en place le rafraîchissement automatique des tokens
- [ ] (Optionnel) Configurer les webhooks pour sync temps réel
- [ ] (Production) Migrer vers HTTPS et domaine public

---

🎉 **Bonne chance avec ton intégration Withings !**


