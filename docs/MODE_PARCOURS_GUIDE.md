# Guide : Mode Création de Parcours Utilisateur

## 🎯 Vue d'ensemble

Le mode création de parcours permet de simuler et visualiser des chemins d'utilisateur à travers l'application. Les parcours créés peuvent être exportés en JSON pour analyse par l'IA.

## ✨ Fonctionnalités

### 1. Activer le mode création

- Cliquez sur le bouton **"🎯 Créer Parcours"** en haut à droite du diagramme
- Le bouton devient bleu avec un anneau pour indiquer que le mode est actif
- Un panneau de création apparaît en haut à gauche

### 2. Créer un parcours

1. **Nommer le parcours** : Entrez un nom descriptif dans le champ de texte
2. **Cliquer sur les nœuds** : Cliquez successivement sur les nœuds pour définir le chemin
   - Chaque nœud cliqué est ajouté à la séquence
   - Les nœuds du parcours s'illuminent avec une bordure bleue
   - Un effet de surbrillance (glow) apparaît autour des nœuds sélectionnés

3. **Gérer les étapes** :
   - Voir la liste des étapes dans le panneau avec leur ordre
   - Supprimer une étape en cliquant sur le ✕ à côté
   - Le parcours se met à jour en temps réel

### 3. Exporter pour analyse IA

Cliquez sur **"📤 Exporter JSON"** pour :
- Copier le parcours au format JSON dans le presse-papier
- Format structuré pour analyse IA :

```json
{
  "name": "Routine matinale productive",
  "created": "2025-12-21T...",
  "steps": [
    {
      "order": 1,
      "nodeId": "hub-start",
      "label": "🏠 Arrivée Hub"
    },
    {
      "order": 2,
      "nodeId": "hub-tasks",
      "label": "✅ Tâches"
    }
  ],
  "metadata": {
    "totalSteps": 2,
    "startNode": "hub-start",
    "endNode": "hub-tasks"
  }
}
```

### 4. Réinitialiser

- **🗑️** : Vider le parcours actuel sans fermer le mode
- **✕** : Fermer le panneau et quitter le mode création

## 🤖 Intégration IA

Le format JSON exporté est optimisé pour analyse IA. L'IA peut :

1. **Analyser la cohérence** : Vérifier si le parcours est logique
2. **Détecter les inefficacités** : Identifier les allers-retours inutiles
3. **Suggérer des raccourcis** : Proposer des chemins plus courts
4. **Recommander des fonctionnalités** : Identifier les liens manquants entre modules

### Exemple de prompt IA

```
Analyse ce parcours utilisateur et indique :
1. Est-ce un parcours logique ?
2. Y a-t-il des inefficacités ?
3. Quelles fonctionnalités pourraient l'optimiser ?

[Coller le JSON exporté]
```

## 💡 Cas d'usage

### Scénario 1 : Routine matinale
```
Hub → Tâches → Pomodoro → Ma Journée
```
**Objectif** : Vérifier que le flow matinal est fluide

### Scénario 2 : Session d'apprentissage
```
Hub → Bibliothèque → Livre → Apprentissage → Code Editor
```
**Objectif** : Valider l'interconnexion lecture/pratique

### Scénario 3 : Analyse de productivité
```
Hub → Tâches → Accomplies → Dashboard → Corrélations
```
**Objectif** : S'assurer que les métriques sont accessibles

## 🎨 Retour visuel

- **Nœuds dans le parcours** :
  - Bordure bleue épaisse (3px)
  - Ombre bleue lumineuse (glow effect)
  - Légère augmentation de taille (scale 1.05)

- **Nœuds hors parcours** :
  - Style normal (gris/coloré selon le type)
  - Cliquables pour ajout au parcours

## 🔧 Technique

### Structure des données

Le parcours est stocké comme un tableau d'IDs de nœuds :
```typescript
currentPath: string[] = ['hub-start', 'hub-tasks', 'tasks-sub3']
```

### Logique de surbrillance

```typescript
// Détecte si un nœud est dans le parcours
const pathIndex = currentPath.indexOf(nodeId);
if (pathIndex !== -1) {
  // Applique le style de surbrillance
  return {
    ...baseStyle,
    boxShadow: '0 0 20px 5px rgba(74, 158, 255, 0.6)',
    border: '3px solid #4a9eff',
    transform: 'scale(1.05)',
  };
}
```

### Mode double comportement

Le clic sur un nœud a deux comportements selon le mode :

```typescript
if (isCreatingPath) {
  // Mode parcours : ajouter au chemin
  setCurrentPath(prev => [...prev, node.id]);
} else {
  // Mode normal : éditer le nœud
  setSelectedNode(node);
}
```

## 📝 Prochaines évolutions possibles

1. **Animation séquentielle** : Faire briller chaque étape progressivement
2. **Sauvegarde des parcours** : Stocker plusieurs parcours dans localStorage
3. **Comparaison** : Afficher deux parcours côte à côte
4. **Suggestions automatiques** : L'IA propose des chemins optimaux
5. **Statistiques** : Calculer la durée estimée, le nombre de clics, etc.

---

**Note** : Ce mode est conçu pour la phase de conception UX et l'analyse de l'ergonomie de l'application. Le format JSON structuré facilite l'intégration avec des outils d'analyse et d'IA.

