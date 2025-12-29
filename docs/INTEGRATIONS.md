# 🔌 Guide des Intégrations — NewMars

> **Version** : 1.4.0  
> **Date** : 29 décembre 2024  
> **Intégrations** : Withings API + Backup Automatique

---

## 📋 Vue d'ensemble

NewMars propose **2 intégrations principales** :

1. **Withings API** — Synchronisation automatique de ta balance connectée
2. **Backup Automatique** — Sauvegarde quotidienne de tes données

---

## 🏋️ INTÉGRATION 1 : Withings API

### À quoi ça sert ?

**Synchroniser automatiquement ton poids** depuis ta balance Withings.

### Données synchronisées

- ✅ Poids (kg)
- ✅ Masse grasse (%)
- ✅ Masse musculaire (kg)
- ✅ Masse osseuse (kg)
- ✅ Pourcentage d'eau (%)
- ✅ Fréquence cardiaque (bpm)

### Configuration

#### 1. Prérequis

- Une balance Withings (Body, Body+, Body Comp, etc.)
- Un compte Withings actif
- Le backend NewMars lancé (`http://localhost:8000`)

#### 2. Configuration Backend

**Créer un compte développeur Withings** :

1. Va sur [https://developer.withings.com](https://developer.withings.com)
2. Crée un compte développeur (gratuit)
3. Crée une nouvelle application :
   - **Name** : NewMars
   - **Description** : Personal productivity hub
   - **Callback URL** : `http://localhost:8000/api/withings/callback`
   - **Logo** : (optionnel)

4. Note ton **Client ID** et **Client Secret**

**Configurer le backend** :

Ajoute dans `backend/.env` :

```bash
WITHINGS_CLIENT_ID=ton_client_id_ici
WITHINGS_CLIENT_SECRET=ton_secret_ici
WITHINGS_REDIRECT_URI=http://localhost:8000/api/withings/callback
```

**Lancer le backend** :

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload
```

#### 3. Connexion depuis l'app

1. Ouvre NewMars
2. Va dans **Santé** → **Poids**
3. Clique sur **"Connecter ta balance Withings"**
4. Une fenêtre s'ouvre → Connecte-toi avec ton compte Withings
5. Autorise l'accès
6. La fenêtre se ferme → Synchronisation automatique !

### Utilisation

**Synchronisation automatique** :
- Les pesées des 90 derniers jours sont synchronisées à la connexion
- Clique sur **"Synchroniser maintenant"** pour récupérer les nouvelles pesées

**Sécurité** :
- Les tokens Withings sont **chiffrés** avec AES-256
- Stockés de manière sécurisée dans `localStorage`
- Rafraîchis automatiquement avant expiration

**Déconnexion** :
- Clique sur **"Déconnecter"** pour supprimer l'accès
- Les données déjà synchronisées restent dans l'app

---

## 💾 INTÉGRATION 2 : Backup Automatique

### À quoi ça sert ?

**Sauvegarder automatiquement toutes tes données** chaque jour.

### Données sauvegardées

- ✅ Toutes tes tâches
- ✅ Tous tes projets
- ✅ Tous tes cours et flashcards
- ✅ Tous tes livres et sessions de lecture
- ✅ Tout ton historique santé (poids, repas, exercices)
- ✅ Toutes tes entrées de journal et habitudes
- ✅ Tous tes paramètres

### Configuration

**Aucune configuration nécessaire !**

Le backup automatique est activé par défaut au démarrage de l'app.

### Fonctionnement

#### Backup Automatique

```
Chaque jour à minuit :
  ↓
Création automatique d'un backup
  ↓
Sauvegarde dans localStorage
  ↓
Conservation des 7 derniers backups
  ↓
Suppression automatique des plus anciens
```

#### Accès aux backups

1. Va dans **Paramètres** (ou crée un lien vers BackupSettings)
2. Section **"💾 Backups"**
3. Tu verras :
   - Nombre de backups
   - Taille totale
   - Dernier backup
   - Liste de tous les backups

### Actions disponibles

#### 1. Créer un backup manuel

```
Bouton "Créer backup maintenant"
  ↓
Backup créé immédiatement
  ↓
Ajouté à la liste
```

#### 2. Restaurer un backup

```
Clic sur l'icône "Restaurer" (🔄)
  ↓
Confirmation
  ↓
Toutes tes données sont remplacées
  ↓
Page rechargée automatiquement
```

⚠️ **Attention** : La restauration remplace **toutes** tes données actuelles !

#### 3. Exporter vers fichier

```
Bouton "Exporter vers fichier"
  ↓
Télécharge un fichier JSON
  ↓
Sauvegarde-le dans Dropbox/iCloud/Google Drive
```

**Nom du fichier** : `newmars-backup-2024-12-29.json`

**Utilité** :
- Sauvegarder hors de l'app
- Transférer vers un autre ordinateur
- Archiver pour le long terme

#### 4. Importer depuis fichier

```
Bouton "Importer depuis fichier"
  ↓
Sélectionne un fichier .json
  ↓
Confirmation
  ↓
Données restaurées
  ↓
Page rechargée
```

#### 5. Supprimer un backup

```
Clic sur l'icône "Supprimer" (🗑️)
  ↓
Confirmation
  ↓
Backup supprimé
```

#### 6. Supprimer tous les backups

```
Bouton "Tout supprimer"
  ↓
Confirmation
  ↓
Tous les backups supprimés
```

### Statistiques

**Affichées dans l'interface** :
- **Nombre de backups** : Ex: 7
- **Taille totale** : Ex: 2.5 MB
- **Dernier backup** : Ex: 29/12/2024 à 00:00
- **Backup automatique** : ✅ Actif (quotidien)

### Cas d'usage

#### Scénario 1 : Changement d'ordinateur

```
1. Sur ancien Mac :
   → Exporter vers fichier
   → Sauvegarder dans iCloud

2. Sur nouveau Mac :
   → Installer NewMars
   → Importer depuis fichier
   → Toutes tes données sont là !
```

#### Scénario 2 : Erreur de manipulation

```
1. Tu supprimes accidentellement des tâches
2. Va dans Backups
3. Restaure le backup d'hier
4. Tes tâches sont de retour !
```

#### Scénario 3 : Migration navigateur

```
1. Export depuis Chrome
2. Import dans Safari
3. Toutes tes données migrent
```

#### Scénario 4 : Backup de sécurité

```
1. Exporte un backup chaque semaine
2. Sauvegarde dans Dropbox
3. Si problème, tu ne perds rien
```

---

## 🔒 Sécurité

### Withings

- ✅ **Tokens chiffrés** : AES-256
- ✅ **Stockage sécurisé** : `secureStorage.ts`
- ✅ **Rafraîchissement auto** : Avant expiration
- ✅ **Révocation** : Déconnexion supprime tout

### Backups

- ✅ **localStorage** : Données locales uniquement
- ✅ **Pas de cloud** : Aucune donnée envoyée ailleurs
- ✅ **Chiffrement optionnel** : Si `VITE_ENABLE_ENCRYPTION=true`
- ✅ **Export manuel** : Tu contrôles où vont tes données

---

## 🐛 Troubleshooting

### Withings

**Problème** : "Connexion impossible"
```
Solutions :
1. Vérifie que le backend est lancé (http://localhost:8000)
2. Vérifie tes credentials dans backend/.env
3. Vérifie que le Callback URL est correct
```

**Problème** : "Token expiré"
```
Solutions :
1. Clique sur "Synchroniser maintenant"
2. Si ça ne marche pas, déconnecte et reconnecte
```

**Problème** : "Aucune pesée trouvée"
```
Solutions :
1. Vérifie que tu as des pesées dans l'app Withings
2. Vérifie que tu es connecté au bon compte
3. Essaie de te peser à nouveau
```

### Backups

**Problème** : "Quota exceeded"
```
Solutions :
1. Supprime les vieux backups
2. Exporte vers fichier et supprime les backups locaux
3. Vide le cache du navigateur
```

**Problème** : "Backup corrompu"
```
Solutions :
1. Essaie un backup plus ancien
2. Si tous sont corrompus, importe depuis un fichier
```

**Problème** : "Backup ne se crée pas"
```
Solutions :
1. Vérifie la console (F12) pour les erreurs
2. Vérifie l'espace disponible dans localStorage
3. Crée un backup manuel pour tester
```

---

## 📊 Statistiques

### Withings

| Métrique | Valeur |
|----------|--------|
| **Données synchronisées** | 6 métriques |
| **Historique** | 90 jours |
| **Fréquence** | Manuelle (bouton) |
| **Sécurité** | AES-256 |

### Backups

| Métrique | Valeur |
|----------|--------|
| **Fréquence** | Quotidien (automatique) |
| **Conservation** | 7 derniers backups |
| **Taille moyenne** | ~300-500 KB |
| **Format** | JSON |

---

## 🎯 Prochaines Étapes

### Améliorations possibles

**Withings** :
- [ ] Synchronisation automatique toutes les heures
- [ ] Notifications de nouvelle pesée
- [ ] Graphiques avancés des métriques

**Backups** :
- [ ] Backup vers cloud (Google Drive, Dropbox)
- [ ] Backup incrémental (seulement les changements)
- [ ] Compression des backups (réduire la taille)
- [ ] Chiffrement optionnel des exports

---

## 📝 Résumé

| Intégration | Statut | Utilité | Sécurité |
|-------------|--------|---------|----------|
| **Withings** | ✅ Prêt | 🔥 Très utile | 🔒 AES-256 |
| **Backup Auto** | ✅ Actif | 🔥 Essentiel | 🔒 Local |

**Score Intégrations** : **9/10** 🌟

---

**Maintenu par** : NewMars Team  
**Dernière révision** : 29 décembre 2024

