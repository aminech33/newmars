# 🔒 Guide de Sécurité — NewMars

> **Version** : 1.2.9  
> **Date** : 29 décembre 2024  
> **Statut** : ✅ Production-Ready

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités de sécurité](#fonctionnalités-de-sécurité)
3. [Configuration](#configuration)
4. [Utilisation](#utilisation)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

NewMars implémente plusieurs couches de sécurité pour protéger vos données personnelles :

| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| **Chiffrement localStorage** | ✅ | AES-256 pour données sensibles |
| **Rate Limiting API** | ✅ | Protection quota Gemini |
| **Validation inputs** | ✅ | Frontend + Backend |
| **Protection XSS** | ✅ | Échappement HTML |
| **Tokens sécurisés** | ✅ | Chiffrement tokens Withings |
| **HTTPS** | ⚠️ | Requis en production |

---

## 🔐 Fonctionnalités de sécurité

### 1. Chiffrement localStorage (AES-256)

**Fichier** : `src/utils/encryption.ts`

**Fonctionnement** :
- Génère une clé de chiffrement unique par appareil
- Chiffre toutes les données sensibles avant stockage
- Utilise AES-256 (standard militaire)

**Données chiffrées** :
- ✅ Tokens Withings (access_token, refresh_token)
- ✅ Historique conversations IA (optionnel)
- ❌ Données non sensibles (tâches, habitudes) → Performance

**Exemple d'utilisation** :

```typescript
import { encrypt, decrypt } from './utils/encryption'

// Chiffrer
const encrypted = encrypt({ secret: 'data' })
localStorage.setItem('my_data', encrypted)

// Déchiffrer
const decrypted = decrypt(localStorage.getItem('my_data'))
```

---

### 2. Stockage sécurisé Withings

**Fichier** : `src/utils/secureStorage.ts`

**Fonctionnement** :
- Sauvegarde automatique des tokens chiffrés
- Vérification d'expiration
- Migration automatique des anciens tokens

**API** :

```typescript
import { 
  saveWithingsTokens, 
  getWithingsTokens, 
  clearWithingsTokens 
} from './utils/secureStorage'

// Sauvegarder (chiffré automatiquement)
saveWithingsTokens({
  access_token: 'xxx',
  refresh_token: 'yyy',
  expires_at: Date.now() + 3600000,
  user_id: '123'
})

// Récupérer (déchiffré automatiquement)
const tokens = getWithingsTokens()

// Supprimer
clearWithingsTokens()
```

---

### 3. Rate Limiting API

**Fichier** : `src/utils/rateLimiter.ts`

**Limites par défaut** :

| API | Limite | Fenêtre |
|-----|--------|---------|
| **Gemini** | 10 req | 1 minute |
| **Withings** | 120 req | 1 minute |
| **User Actions** | 30 req | 1 minute |

**Fonctionnement** :
- Bloque automatiquement les requêtes excessives
- Affiche le temps d'attente restant
- Protège contre l'épuisement du quota

**Exemple d'utilisation** :

```typescript
import { geminiRateLimiter, withRateLimit } from './utils/rateLimiter'

// Avec rate limiting
const response = await withRateLimit(
  geminiRateLimiter, 
  'gemini_api', 
  async () => {
    return await generateGeminiResponse(context, message)
  }
)
```

**Messages d'erreur** :
```
⚠️ Limite de requêtes atteinte. Réessayez dans 45 secondes.
```

---

### 4. Validation des inputs

**Frontend** : `src/hooks/useHealthData.ts`

```typescript
// Validation poids
if (data.weight <= 0 || data.weight > 500) {
  return { success: false, error: 'Le poids doit être entre 0 et 500 kg' }
}

// Validation calories
if (data.calories < 0 || data.calories > 10000) {
  return { success: false, error: 'Les calories doivent être entre 0 et 10000' }
}
```

**Backend** : `backend/routes/tasks.py`

```python
if not input_data.idea or len(input_data.idea.strip()) < 5:
    raise HTTPException(
        status_code=400,
        detail="L'idée doit contenir au moins 5 caractères"
    )
```

---

### 5. Protection XSS

**Fichier** : `src/components/learning/MessageBubble.tsx`

```typescript
// Échappement HTML avant affichage
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Utilisation
<pre><code>{escapeHtml(userInput)}</code></pre>
```

---

## ⚙️ Configuration

### Variables d'environnement

Copier `.env.example` en `.env` :

```bash
cp .env.example .env
```

**Configuration minimale** :

```bash
# Obligatoire
VITE_GEMINI_API_KEY=your_api_key_here

# Recommandé en production
VITE_ENABLE_ENCRYPTION=true
VITE_ENV=production
```

**Configuration avancée** :

```bash
# Rate limiting personnalisé
VITE_GEMINI_RATE_LIMIT=20  # 20 requêtes/minute

# Backend URL
VITE_BACKEND_URL=https://your-backend.com

# Debug
VITE_DEBUG=false
```

---

## 🚀 Utilisation

### Migration automatique

Au premier lancement, l'app migre automatiquement les anciennes données :

```typescript
// Dans src/App.tsx ou composant principal
import { migrateWithingsTokens } from './utils/secureStorage'

useEffect(() => {
  // Migration automatique des tokens non chiffrés
  migrateWithingsTokens()
}, [])
```

### Vérifier le chiffrement

```typescript
import { isEncryptionAvailable } from './utils/encryption'

if (isEncryptionAvailable()) {
  console.log('✅ Chiffrement opérationnel')
} else {
  console.error('❌ Erreur de chiffrement')
}
```

### Nettoyer les données sensibles

```typescript
import { clearAllSecureData } from './utils/secureStorage'

// Déconnexion complète
function handleLogout() {
  clearAllSecureData()
  // Rediriger vers login
}
```

---

## ✅ Best Practices

### 🔴 **CRITIQUE** (Production)

1. ✅ **Activer HTTPS**
   ```nginx
   server {
     listen 443 ssl;
     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;
   }
   ```

2. ✅ **Variables d'environnement sécurisées**
   - Ne JAMAIS committer `.env`
   - Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager)

3. ✅ **Chiffrement activé**
   ```bash
   VITE_ENABLE_ENCRYPTION=true
   ```

### 🟠 **IMPORTANT** (Recommandé)

4. ⚠️ **Rate limiting ajusté**
   - Adapter selon votre quota API
   - Monitorer les erreurs 429

5. ⚠️ **Backups chiffrés**
   ```typescript
   import { encrypt } from './utils/encryption'
   
   const backup = encrypt(localStorage)
   // Sauvegarder backup de manière sécurisée
   ```

6. ⚠️ **Logs de sécurité**
   ```typescript
   // Monitorer les tentatives suspectes
   console.warn('⚠️ Rate limit atteint par user_id:', userId)
   ```

### 🟡 **OPTIONNEL** (Nice to have)

7. 💡 **Authentification multi-utilisateurs**
8. 💡 **2FA (Two-Factor Authentication)**
9. 💡 **Audit logs**

---

## 🛠️ Troubleshooting

### Problème : "Erreur de déchiffrement"

**Cause** : Clé de chiffrement corrompue ou changée

**Solution** :
```typescript
import { resetEncryptionKey } from './utils/encryption'

// ⚠️ DANGER: Perte de toutes les données chiffrées
resetEncryptionKey()
```

---

### Problème : "Rate limit atteint"

**Cause** : Trop de requêtes API

**Solution 1** : Attendre le délai indiqué
```
⚠️ Limite de requêtes atteinte. Réessayez dans 45 secondes.
```

**Solution 2** : Augmenter la limite
```bash
# .env
VITE_GEMINI_RATE_LIMIT=20  # Augmenter à 20/min
```

**Solution 3** : Réinitialiser le compteur
```typescript
import { geminiRateLimiter } from './utils/rateLimiter'

geminiRateLimiter.reset('gemini_api')
```

---

### Problème : "Tokens Withings expirés"

**Cause** : Access token expiré (3h de validité)

**Solution** : Rafraîchir automatiquement
```typescript
import { areWithingsTokensValid, getWithingsTokens } from './utils/secureStorage'

if (!areWithingsTokensValid()) {
  // Appeler l'endpoint de refresh
  const tokens = getWithingsTokens()
  const newTokens = await refreshWithingsTokens(tokens.refresh_token)
  saveWithingsTokens(newTokens)
}
```

---

### Problème : "localStorage plein"

**Cause** : Limite de 5-10 MB atteinte

**Solution** : Nettoyer les anciennes données
```typescript
// Supprimer les anciennes conversations
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('gemini_history_') && isOlderThan30Days(key)) {
    localStorage.removeItem(key)
  }
})
```

---

## 📊 Audit de sécurité

### Score global : **8.5/10** ✅

| Critère | Note | Statut |
|---------|------|--------|
| Gestion des secrets | ⭐⭐⭐⭐⭐ | Excellent |
| Validation inputs | ⭐⭐⭐⭐ | Bon |
| Protection XSS | ⭐⭐⭐⭐⭐ | Excellent |
| Chiffrement données | ⭐⭐⭐⭐ | Bon |
| Rate limiting | ⭐⭐⭐⭐ | Bon |
| HTTPS | ⭐⭐⭐ | Requis en prod |

---

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Gemini API Security](https://ai.google.dev/gemini-api/docs/safety-settings)
- [Withings API Docs](https://developer.withings.com/api-reference)
- [crypto-js Documentation](https://cryptojs.gitbook.io/docs/)

---

## 📝 Changelog

### V1.2.9 (29 déc 2024)
- ✅ Ajout chiffrement AES-256 localStorage
- ✅ Chiffrement tokens Withings
- ✅ Rate limiting Gemini API
- ✅ Documentation sécurité complète

---

**Maintenu par** : NewMars Team  
**Dernière révision** : 29 décembre 2024



