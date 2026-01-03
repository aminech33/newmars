# 🧠 KNOWLEDGE BASE SYSTEM

## 🎯 Objectif

Créer un système de **mémoire permanente** pour que l'IA se souvienne automatiquement des concepts que tu connais déjà, sans avoir à les rappeler à chaque fois.

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Ouverture du cours                                     │
│     ↓                                                       │
│  2. useKnowledgeBase().loadConcepts(courseId)              │
│     ↓                                                       │
│  3. Concepts chargés en mémoire                            │
│                                                             │
│  4. Conversation avec l'IA                                 │
│     ↓                                                       │
│  5. Avant chaque message:                                  │
│     - searchConcepts(query) → Concepts pertinents          │
│     - Enrichir le prompt avec contexte                     │
│     ↓                                                       │
│  6. Après réponse IA:                                      │
│     - Extraction concepts (basique ou IA)                  │
│     - addConcept() pour chaque nouveau                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Endpoints:                                            │
│  - POST /api/knowledge/add                                 │
│  - GET  /api/knowledge/{course_id}                         │
│  - POST /api/knowledge/search                              │
│  - POST /api/knowledge/update-mastery                      │
│  - GET  /api/knowledge/{course_id}/stats                   │
│  - POST /api/knowledge/batch-add                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table: concepts                                           │
│  ├─ id (PRIMARY KEY)                                       │
│  ├─ concept (TEXT, NOT NULL)                               │
│  ├─ category (TEXT)                                        │
│  ├─ definition (TEXT)                                      │
│  ├─ example (TEXT)                                         │
│  ├─ keywords (TEXT, JSON)                                  │
│  ├─ course_id (TEXT, NOT NULL)                             │
│  ├─ added_at (DATETIME)                                    │
│  ├─ last_referenced (DATETIME)                             │
│  ├─ times_referenced (INTEGER)                             │
│  ├─ mastery_level (INTEGER 1-5)                            │
│  └─ source (TEXT, default: 'ai')                           │
│                                                             │
│  UNIQUE(concept, course_id)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux complet

### **1. Chargement initial**

```typescript
// Au montage de CourseChat
useEffect(() => {
  // Charge TOUS les concepts du cours
  await knowledge.loadConcepts(courseId)
  // → concepts disponibles immédiatement
}, [courseId])
```

### **2. Enrichissement avant envoi IA**

```typescript
const handleSendMessage = async (message: string) => {
  // Recherche concepts pertinents (local first, API si nécessaire)
  const relevantConcepts = await knowledge.searchConcepts(
    courseId,
    message,
    5 // Top 5
  )
  
  // Enrichir le prompt
  const enrichedPrompt = `
📚 CONTEXTE - L'étudiant connaît déjà:
${relevantConcepts.map(c => 
  `• ${c.concept}: ${c.definition || ''} (maîtrise ${c.masteryLevel}/5, vu ${c.timesReferenced}x)`
).join('\n')}

RÈGLES:
- Ne ré-explique PAS les concepts avec maîtrise ≥ 3
- Construis sur les connaissances existantes

MESSAGE: ${message}
`
  
  // Envoyer à Gemini
  const response = await gemini.generate(enrichedPrompt)
}
```

### **3. Extraction et sauvegarde après réponse**

```typescript
// Après réponse IA
const aiResponse = await gemini.generate(prompt)

// Extraction basique (rapide, sans IA)
const newConcepts = extractConceptsBasic(aiResponse, 'python')
// → ["print()", "variables", "for loop"]

// Sauvegarder chaque concept
for (const concept of newConcepts) {
  await knowledge.addConcept({
    ...concept,
    courseId
  })
}

// Mise à jour locale immédiate
setConcepts(prev => [...prev, ...newConcepts])
```

---

## 📊 Exemple concret

### **Session 1: Découverte**

```
Étudiant: "Comment afficher du texte ?"
IA: "Tu utilises print(). Exemple: print('Hello')"

→ Backend ajoute automatiquement:
{
  concept: "print()",
  category: "python_builtin",
  definition: "Affiche du texte",
  example: "print('Hello')",
  keywords: ["python", "output", "console"],
  masteryLevel: 1,
  timesReferenced: 1
}
```

### **Session 2 (lendemain): Reprise**

```
// Au chargement
const concepts = await loadConcepts(courseId)
// → 12 concepts chargés

// Sidebar affiche:
📚 Ce que tu connais (12)
• print()       ★★★☆☆  15x
• variables     ★★☆☆☆   8x
• if/else       ★★★★☆  23x
...
```

### **Conversation enrichie**

```
Étudiant: "Comment faire une boucle ?"

// searchConcepts("Comment faire une boucle ?", 5)
// → Trouve: for loops (★☆☆☆☆, 3x)

Prompt enrichi:
"Tu sais que l'étudiant connaît 'for loops' (maîtrise 1/5, vu 3x).
Ne ré-explique pas depuis zéro, fais juste un rappel rapide."

IA: "Tu as déjà vu les for loops. Voici 3 patterns avancés:..."
     ↑ Adapté au niveau réel !

→ Met à jour: for loops → masteryLevel 2/5, timesReferenced 4x
```

---

## 🎨 UI Components

### **KnowledgeSidebar** (à créer)

```tsx
<div className="w-64 bg-zinc-900 border-l border-zinc-800 p-4">
  <h3>📚 Ta base ({concepts.length})</h3>
  
  {/* Stats */}
  <div className="stats">
    <div>Maîtrise moyenne: {avgMastery}/5</div>
    <div>Concepts maîtrisés: {mastered}</div>
    <div>À réviser: {needsReview}</div>
  </div>
  
  {/* Recent concepts */}
  <div className="concepts-list">
    {concepts.slice(0, 8).map(c => (
      <ConceptBadge
        key={c.id}
        concept={c.concept}
        mastery={c.masteryLevel}
        timesUsed={c.timesReferenced}
        onClick={() => showDetails(c)}
      />
    ))}
  </div>
  
  <button onClick={() => setShowAll(true)}>
    Voir tous
  </button>
</div>
```

---

## ✅ Avantages

1. **Zéro effort utilisateur**
   - Extraction automatique
   - Pas besoin de "sauvegarder" manuellement
   - L'IA fait tout

2. **IA adaptative**
   - Sait exactement ce que tu connais
   - Pas de répétitions inutiles
   - Progression naturelle

3. **Repère visuel**
   - Tu vois ta progression
   - Liste des concepts = motivation
   - Stats intéressantes

4. **Performance**
   - Chargement une fois au début
   - Pas d'appel API à chaque message
   - Recherche locale rapide

5. **Persistance**
   - SQLite = jamais perdu
   - Historique complet
   - Cross-sessions

---

## 🚀 À implémenter (suite)

- [ ] Frontend: Intégration dans CourseChat
- [ ] Frontend: KnowledgeSidebar component
- [ ] Frontend: ConceptDetailsModal
- [ ] Tests backend
- [ ] Tests frontend
- [ ] Documentation utilisateur

---

## 📝 Philosophie NewMars

✅ **Aligné avec:**
- Automatisation maximale
- IA au centre
- Progression visible
- Pas de friction
- Offline-first (SQLite local)

❌ **Pas de:**
- Flashcards manuelles
- Saisie manuelle des concepts
- Complexité inutile
- Cloud sync obligatoire

---

**Le système transforme l'IA en véritable tuteur qui SE SOUVIENT ! 🧠✨**


