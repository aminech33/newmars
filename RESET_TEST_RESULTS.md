# Réinitialisation des résultats de tests

## 🔄 Comment réinitialiser manuellement

Pour réinitialiser tous les résultats de tests manuellement :

### Option 1 : Via la mini-fenêtre
1. Cliquez sur la bulle Test Lab 🧪
2. Cliquez sur le bouton **Reset** en bas de la fenêtre
3. Confirmez la réinitialisation

### Option 2 : Via la console du navigateur
1. Ouvrez la console (F12)
2. Tapez : `localStorage.removeItem('iku-test-results')`
3. Rechargez la page (F5)

### Option 3 : Supprimer tout le localStorage
1. Ouvrez la console (F12)
2. Tapez : `localStorage.clear()`
3. Rechargez la page (F5)

## 📦 Système de sauvegarde

Les résultats des tests sont automatiquement sauvegardés dans le localStorage du navigateur :
- **Clé** : `iku-test-results`
- **Format** : JSON
- **Contenu** : Statut de chaque test (pass/fail/todo/useless) avec timestamp

### Structure des données
```json
{
  "test-id-1": {
    "status": "pass",
    "message": "✅ Testé - Fonctionne",
    "timestamp": 1701955200000
  },
  "test-id-2": {
    "status": "fail",
    "message": "❌ Testé - Ne fonctionne pas",
    "timestamp": 1701955300000
  }
}
```

## ✨ Fonctionnalités

- ✅ Sauvegarde automatique à chaque changement
- ✅ Chargement automatique au démarrage
- ✅ Bouton de réinitialisation dans la mini-fenêtre
- ✅ Synchronisation entre la bulle et la page complète
- ✅ Persistance entre les sessions


