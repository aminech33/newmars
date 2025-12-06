# 💻 Split View - Éditeur de Code Intégré

## ✅ Fonctionnalité activée

Le split view est maintenant disponible pour les **cours de programmation** dans l'application Learning.

---

## 🎯 Comment l'utiliser

### 1️⃣ Créer un cours de programmation

1. Va dans **Learning** (Apprentissage)
2. Clique sur **Nouveau cours**
3. ✅ **Coche "Cours de programmation"**
4. Sélectionne le **langage** (Python, JavaScript, TypeScript, etc.)
5. Crée le cours

### 2️⃣ Interface Split View

Une fois dans le cours, tu verras :

```
┌─────────────────────────────────────────────────────┐
│  Chat (gauche 50%)        │  Éditeur (droite 50%)   │
├───────────────────────────┼─────────────────────────┤
│                           │  💻 Éditeur de code     │
│  Messages de             │  Python                  │
│  conversation...          │                         │
│                           │  # Ton code ici         │
│  IA: "Regarde ligne 3..." │  def hello():           │
│                           │      print("Hi")        │
│                           │                         │
│  [📎 Inclure mon code]    │  [💡 Aide] [▶️ Analyser]│
│  [Ton message...]         │                         │
└───────────────────────────┴─────────────────────────┘
```

### 3️⃣ Fonctionnalités

#### **L'IA peut lire ton code**
- ✅ **Automatique** : Coche "📎 Inclure mon code" (activé par défaut)
- Quand tu poses une question, l'IA voit ton code actuel
- Pas besoin de copier-coller

#### **Boutons d'action**
- **💡 Aide** : Demande de l'aide sur ton code à l'IA
- **▶️ Analyser** : L'IA exécute et explique ton code

#### **Toggle du code**
- Tu peux **décocher "📎 Inclure mon code"** si tu veux poser une question théorique sans montrer ton code

---

## 🎓 Pédagogie : Est-ce que ça crée une dépendance ?

### ✅ Non, si tu l'utilises correctement

**Bonne utilisation** :
1. ✅ Code d'abord pendant **5-10 minutes**
2. ✅ Si bloqué, demande de l'**aide ciblée**
3. ✅ Comprends la réponse et **modifie ton code toi-même**
4. ✅ Vérifie ta solution finale avec l'IA

**Mauvaise utilisation** :
1. ❌ Demander à chaque ligne
2. ❌ Copier les réponses sans comprendre
3. ❌ Ne jamais coder sans l'IA
4. ❌ Demander la solution complète immédiatement

### 🧠 Principe pédagogique

L'IA est un **mentor qui regarde par-dessus ton épaule**, pas un **robot qui code à ta place**.

**Analogie** :
- 👍 Cours de maths avec un prof qui aide quand tu bloques
- 👎 Calculatrice qui fait tout à ta place

---

## 🛠️ Langages supportés

- Python
- JavaScript
- TypeScript
- Java
- C++
- C#
- Rust
- Go
- PHP
- Ruby

*(Syntaxe highlighting et autocomplétion via Monaco Editor)*

---

## 📊 Différences avec les cours normaux

| Cours normal | Cours de programmation |
|-------------|----------------------|
| Chat plein écran | **Split view 50/50** |
| Pas d'éditeur | **Éditeur Monaco intégré** |
| IA lit seulement le chat | **IA lit le chat + le code** |
| - | **Boutons Aide / Analyser** |

---

## 🎯 Cas d'usage

### 1. **Apprendre un nouveau langage**
```
Toi: "Comment faire une boucle en Python ?"
IA: [Explique]
[Tu codes dans l'éditeur]
Toi: "C'est bon comme ça ?"
IA: [Voit ton code] "Oui parfait !"
```

### 2. **Debugging**
```
[Tu codes dans l'éditeur]
Toi: "J'ai une erreur ligne 5"
IA: [Voit ton code] "Tu as oublié les :"
```

### 3. **Code review**
```
[Tu termines ton code]
Bouton: [▶️ Analyser]
IA: "Ton code fonctionne ! Suggestions d'amélioration..."
```

### 4. **Exercices guidés**
```
IA: "Exercice : Créer une fonction fibonacci"
[Tu codes]
Toi: "Je suis bloqué"
Bouton: [💡 Aide]
IA: [Donne un indice]
```

---

## 🔧 Détails techniques

### Modifications apportées

**Fichiers modifiés** :
- `src/types/learning.ts` : Ajout de `isProgramming` et `programmingLanguage` dans `Course`
- `src/components/learning/CourseChat.tsx` : Implémentation du split view
- `src/components/learning/CodeEditor.tsx` : Support du state externe
- `src/components/learning/CourseModal.tsx` : Ajout des options de programmation

### Architecture

```typescript
// Course type
interface Course {
  // ... existing fields
  isProgramming?: boolean      // Active le split view
  programmingLanguage?: string // python, javascript, etc.
}

// CourseChat comportement
const showSplitView = course.isProgramming === true

// Message avec code
if (includeCode && showSplitView) {
  message = `${userMessage}\n\n📎 Mon code:\n\`\`\`${lang}\n${code}\n\`\`\``
}
```

---

## 🚀 Prochaines étapes possibles

### Fonctionnalités avancées (optionnelles) :

- [ ] **Exécution réelle du code** (via Pyodide pour Python, etc.)
- [ ] **Debugger intégré** avec breakpoints
- [ ] **Tests unitaires automatiques** générés par l'IA
- [ ] **Historique des versions** du code
- [ ] **Mode "Challenge"** (IA désactivée temporairement)
- [ ] **Cooldown système** (forcer 2-3 min de réflexion avant aide)
- [ ] **Métriques de dépendance** (alertes si trop de questions)

---

**Date de création** : 3 décembre 2025  
**Status** : ✅ Fonctionnel  
**Impact UX** : L'éditeur et les projets ne sont plus en conflit - l'éditeur est intégré au chat





