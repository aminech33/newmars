# 🔒 Guide de Sécurité - Newmars

## 📋 Checklist Quotidienne

### Avant de commencer à travailler

```bash
# 1. Vérifier le workspace
npm run check-workspace

# 2. Valider les fichiers
npm run validate

# 3. Créer un backup
npm run backup

# 4. Mettre à jour depuis Git
git pull
```

### Après avoir terminé

```bash
# 1. Valider les fichiers
npm run validate

# 2. Commit et push sécurisé
git add .
git commit -m "✨ Description des changements"
npm run safe-push
```

---

## 🛡️ Scripts de Sécurité

### `npm run validate`
Vérifie que tous les fichiers critiques existent et ne sont pas vides.

**Utilisation :**
```bash
npm run validate
```

**Fichiers vérifiés :**
- Store (useStore.ts)
- Pages principales (App.tsx, HubV2.tsx)
- Composants critiques (Journal, Projects, Tasks, Calendar, Health)
- Types TypeScript
- Utilitaires

### `npm run backup`
Crée un backup automatique du projet.

**Utilisation :**
```bash
npm run backup
```

**Caractéristiques :**
- Sauvegarde dans `%USERPROFILE%\newmars-backups`
- Garde les 7 derniers backups
- Exclut `node_modules`, `.git`, `dist`
- Affiche la taille du backup

### `npm run check-workspace`
Vérifie que vous êtes dans le bon workspace.

**Utilisation :**
```bash
npm run check-workspace
```

**Vérifications :**
- Workspace actuel = `C:\Users\amine\.cursor\worktrees\newmars-1\iku`
- Détection de workspaces en double
- Statut Git

### `npm run security-check`
Exécute toutes les vérifications de sécurité.

**Utilisation :**
```bash
npm run security-check
```

---

## ⚠️ Règles Importantes

### ❌ NE JAMAIS

1. **Travailler dans plusieurs workspaces en même temps**
   - Workspace unique : `C:\Users\amine\.cursor\worktrees\newmars-1\iku`

2. **Éditer manuellement les fichiers dans `.cursor/worktrees`**
   - Ces dossiers sont temporaires

3. **Commit sans validation**
   - Toujours utiliser `npm run safe-push`

4. **Ignorer les avertissements de validation**
   - Si un fichier est suspect, vérifiez-le avant de continuer

### ✅ TOUJOURS

1. **Vérifier le workspace au démarrage**
   ```bash
   npm run check-workspace
   ```

2. **Créer un backup avant les changements majeurs**
   ```bash
   npm run backup
   ```

3. **Valider avant de commit**
   ```bash
   npm run validate
   ```

4. **Commit régulièrement**
   - Au moins une fois par session de travail

---

## 🚨 En Cas de Problème

### Fichiers vides détectés

```bash
# 1. Vérifier le statut Git
git status

# 2. Restaurer depuis Git
git checkout HEAD -- <fichier>

# 3. Ou restaurer depuis un backup
# Les backups sont dans: %USERPROFILE%\newmars-backups
```

### Workspace incorrect

```bash
# 1. Fermer Cursor

# 2. Supprimer les workspaces en double
Remove-Item -Recurse -Force "$env:USERPROFILE\.cursor\worktrees\newmars*"

# 3. Ouvrir uniquement le bon workspace
cd C:\Users\amine\.cursor\worktrees\newmars-1\iku
code .
```

### Perte de données

```bash
# 1. Vérifier les backups disponibles
dir "$env:USERPROFILE\newmars-backups"

# 2. Restaurer le dernier backup
# Copier manuellement les fichiers nécessaires
```

---

## 📊 Monitoring

### Commande de santé complète

```bash
npm run security-check && npm run validate && echo "✅ Tout est OK!"
```

### Fréquence recommandée

- **Avant chaque session** : `check-workspace` + `validate`
- **Quotidien** : `backup`
- **Avant chaque commit** : `validate`
- **Hebdomadaire** : Vérifier les backups

---

## 🔧 Configuration

### Fichiers de configuration

- `.gitignore` : Exclut les fichiers sensibles et temporaires
- `.vscode/settings.json` : Configuration de l'éditeur
- `scripts/` : Scripts de sécurité

### Variables d'environnement

Aucune variable d'environnement requise pour l'instant.

---

## 📝 Logs

Les scripts de sécurité affichent des logs détaillés :

- ✅ : Succès
- ⚠️  : Avertissement
- ❌ : Erreur critique

**En cas d'erreur critique, NE PAS continuer avant d'avoir résolu le problème.**

---

## 🆘 Support

Si vous rencontrez un problème non couvert par ce guide :

1. Créer un backup immédiatement : `npm run backup`
2. Vérifier le statut Git : `git status`
3. Consulter les logs d'erreur
4. Restaurer depuis un backup si nécessaire

---

**Dernière mise à jour : 30 novembre 2025**


