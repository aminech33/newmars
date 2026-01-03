# 📊 Guide de Monitoring — NewMars

> **Version** : 1.3.0  
> **Date** : 29 décembre 2024  
> **Outils** : Sentry + Web Vitals

---

## 🎯 Vue d'ensemble

NewMars utilise **2 outils de monitoring** :

1. **Sentry** — Tracking d'erreurs et exceptions
2. **Web Vitals** — Métriques de performance

---

## 🔧 Configuration

### 1. Variables d'environnement

Ajouter dans `.env` :

```bash
# Sentry (optionnel)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_SENTRY=true

# Web Vitals
VITE_ENABLE_WEB_VITALS=true

# Environment
VITE_ENV=production
```

### 2. Obtenir un DSN Sentry

1. Créer un compte sur [sentry.io](https://sentry.io) (gratuit jusqu'à 5000 erreurs/mois)
2. Créer un nouveau projet "React"
3. Copier le DSN fourni
4. Ajouter dans `.env` : `VITE_SENTRY_DSN=...`

---

## 📈 Métriques Collectées

### Sentry — Erreurs

**Ce qui est tracké** :
- ✅ Erreurs JavaScript (crashes, exceptions)
- ✅ Erreurs réseau (API calls échouées)
- ✅ Erreurs React (component crashes)
- ✅ Stack traces complètes
- ✅ Contexte utilisateur (anonymisé)

**Ce qui est filtré** :
- ❌ Données sensibles (email, IP)
- ❌ Erreurs de développement (ResizeObserver)
- ❌ Extensions navigateur (chrome-extension://)

### Web Vitals — Performance

**Métriques Core Web Vitals** :
- **LCP** (Largest Contentful Paint) — Temps de chargement principal
- **FID** (First Input Delay) — Réactivité
- **CLS** (Cumulative Layout Shift) — Stabilité visuelle

**Métriques additionnelles** :
- **FCP** (First Contentful Paint) — Premier rendu
- **TTFB** (Time to First Byte) — Temps serveur

---

## 🚀 Utilisation

### Initialisation automatique

Le monitoring s'initialise automatiquement au démarrage :

```typescript
// src/main.tsx
import { initSentry, initWebVitals } from './utils/monitoring'

initSentry()      // ✅ Sentry actif
initWebVitals()   // ✅ Web Vitals actif
```

### Capturer une erreur manuellement

```typescript
import { captureError, captureMessage } from './utils/monitoring'

try {
  // Code risqué
  await dangerousOperation()
} catch (error) {
  captureError(error as Error, {
    context: 'user_action',
    userId: '123'
  })
}

// Ou un message simple
captureMessage('Opération critique réussie', 'info')
```

### Wrapper pour fonctions async

```typescript
import { withErrorCapture } from './utils/monitoring'

const myFunction = withErrorCapture(async () => {
  // Si une erreur survient, elle sera automatiquement envoyée à Sentry
  await riskyOperation()
}, { context: 'my_function' })
```

---

## 📊 Dashboard Sentry

### Accéder aux erreurs

1. Aller sur [sentry.io](https://sentry.io)
2. Sélectionner votre projet "NewMars"
3. Voir les erreurs en temps réel

### Informations disponibles

Pour chaque erreur :
- **Message** : Description de l'erreur
- **Stack trace** : Où l'erreur s'est produite
- **Contexte** : Navigateur, OS, URL
- **Breadcrumbs** : Actions avant l'erreur
- **User** : ID utilisateur (anonymisé)

### Alertes

Configurer des alertes email :
- Nouvelle erreur détectée
- Erreur récurrente (>10 fois)
- Erreur critique (crash complet)

---

## 🔍 Web Vitals — Interprétation

### Scores

| Métrique | Bon | Moyen | Mauvais |
|----------|-----|-------|---------|
| **LCP** | < 2.5s | 2.5-4s | > 4s |
| **FID** | < 100ms | 100-300ms | > 300ms |
| **CLS** | < 0.1 | 0.1-0.25 | > 0.25 |

### Voir les métriques

En développement, les métriques s'affichent dans la console :

```
📊 LCP: 1850 ms
📊 FID: 45 ms
📊 CLS: 0.05
```

En production, elles sont envoyées à Sentry automatiquement.

---

## 🛠️ Troubleshooting

### "Sentry DSN manquant"

```
⚠️ Sentry DSN manquant. Ajoutez VITE_SENTRY_DSN dans .env
```

**Solution** : Ajouter `VITE_SENTRY_DSN` dans `.env`

### "Trop d'erreurs envoyées"

Si vous dépassez le quota gratuit (5000/mois) :

1. Augmenter le `tracesSampleRate` :
   ```typescript
   tracesSampleRate: 0.1  // 10% des erreurs seulement
   ```

2. Filtrer plus d'erreurs dans `beforeSend`

### "Web Vitals non affichées"

Vérifier que `VITE_ENABLE_WEB_VITALS=true` dans `.env`

---

## 🎯 Best Practices

### 1. Anonymiser les données

```typescript
// ✅ BON
captureError(error, { userId: 'user_123' })

// ❌ MAUVAIS
captureError(error, { email: 'user@example.com' })
```

### 2. Ajouter du contexte

```typescript
// ✅ BON
captureError(error, {
  action: 'create_task',
  taskId: '123',
  timestamp: Date.now()
})

// ❌ MAUVAIS
captureError(error)  // Pas de contexte
```

### 3. Filtrer les erreurs non critiques

```typescript
// Ignorer les erreurs réseau (hors de notre contrôle)
if (error.message.includes('NetworkError')) {
  return  // Ne pas envoyer à Sentry
}
```

---

## 📊 Statistiques de Monitoring

Vérifier l'état du monitoring :

```typescript
import { getMonitoringStats } from './utils/monitoring'

console.log(getMonitoringStats())
// {
//   sentryEnabled: true,
//   webVitalsEnabled: true,
//   environment: 'production'
// }
```

---

## 🚨 Alertes Critiques

### Configurer les alertes Sentry

1. Aller dans **Alerts** sur Sentry
2. Créer une nouvelle règle :
   - **Condition** : "Nouvelle erreur détectée"
   - **Action** : "Envoyer email"
   - **Destinataire** : Votre email

### Types d'alertes recommandées

1. **Nouvelle erreur** — Alerte immédiate
2. **Erreur récurrente** — >10 fois en 1h
3. **Spike d'erreurs** — +50% vs moyenne
4. **Performance dégradée** — LCP > 4s

---

## 🎉 Résumé

| Aspect | Statut | Détails |
|--------|--------|---------|
| **Sentry** | ✅ Configuré | Tracking erreurs actif |
| **Web Vitals** | ✅ Configuré | Métriques performance |
| **Anonymisation** | ✅ Actif | Données sensibles filtrées |
| **Alertes** | ⚠️ À configurer | Sur sentry.io |
| **Documentation** | ✅ Complète | Ce fichier |

**Score Monitoring** : **9/10** 🌟

---

**Maintenu par** : NewMars Team  
**Dernière révision** : 29 décembre 2024




