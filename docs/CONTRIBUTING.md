# 🤝 Guide de Contribution - Documentation NewMars

Merci de votre intérêt pour améliorer la documentation NewMars ! Ce guide vous aidera à contribuer efficacement.

---

## 📋 Types de contributions

### 1. 🐛 Corrections de bugs documentation

- Fautes de frappe
- Liens cassés
- Informations obsolètes
- Erreurs techniques

### 2. ✨ Améliorations

- Clarifications
- Exemples supplémentaires
- Captures d'écran
- Diagrammes

### 3. 📝 Nouveaux contenus

- Tutoriels
- Guides d'utilisation
- Documentation API
- FAQ

---

## 🚀 Processus de contribution

### Étape 1 : Identifier le besoin

**Questions à se poser** :
- Qu'est-ce qui est manquant/incorrect ?
- Qui en bénéficiera ?
- Est-ce urgent ou nice-to-have ?

### Étape 2 : Créer une issue (recommandé)

```markdown
**Type** : [BUG_DOC | AMÉLIORATION | NOUVEAU_CONTENU]

**Description** :
[Description claire du problème ou de la suggestion]

**Fichier(s) concerné(s)** :
- docs/PRODUCT_REFERENCE_V1.md
- docs/product-reference-v1.html

**Proposition de solution** :
[Si vous avez une idée de comment le résoudre]

**Impact** :
- Utilisateurs concernés : [Équipe dev / Product / Tous]
- Urgence : [Haute / Moyenne / Basse]
```

### Étape 3 : Fork et branch

```bash
# Fork le repo sur GitHub
git clone https://github.com/VOTRE_USERNAME/newmars.git
cd newmars

# Créer une branche
git checkout -b docs/description-courte
# Exemples :
# - docs/fix-typo-pomodoro-section
# - docs/add-screenshots-tasks-module
# - docs/improve-glossary
```

### Étape 4 : Faire les modifications

#### Pour le Markdown (`PRODUCT_REFERENCE_V1.md`)

```bash
# Éditer avec votre éditeur préféré
code docs/PRODUCT_REFERENCE_V1.md

# Vérifier le rendu
# (avec extension Markdown preview)
```

**Règles** :
- Respecter la structure existante
- Utiliser les émojis de statut : ✅ 🔄 📋 ⛔
- Format des tableaux cohérent
- Liens relatifs pour fichiers locaux

#### Pour le HTML (`product-reference-v1.html`)

**⚠️ Important** : Le HTML est actuellement mis à jour manuellement. À terme, il sera généré automatiquement depuis le Markdown.

**Si vous modifiez le HTML** :
1. Tester dans plusieurs navigateurs (Chrome, Firefox, Safari)
2. Vérifier le responsive (mobile/tablet/desktop)
3. Tester le dark mode
4. Valider avec W3C Validator

**Outils utiles** :
```bash
# Serveur local pour test
cd docs && python3 -m http.server 8888
# Ouvrir http://localhost:8888/product-reference-v1.html

# Validation HTML
# https://validator.w3.org/

# Test accessibilité
# https://wave.webaim.org/
```

### Étape 5 : Tester

**Checklist** :
- [ ] Orthographe vérifiée (français)
- [ ] Liens testés (tous fonctionnels)
- [ ] Screenshots optimisés (< 500KB chacun)
- [ ] HTML valide (W3C)
- [ ] Responsive OK (mobile/desktop)
- [ ] Dark/Light mode OK
- [ ] Accessibilité OK (WAVE)

### Étape 6 : Mettre à jour le changelog

Si votre contribution est significative :

```bash
vim docs/CHANGELOG.md
```

Ajouter une entrée :
```markdown
## [Non publié]

### Modifié
- Amélioration du glossaire : ajout de 3 termes ([@votre_username])

### Corrigé
- Correction lien cassé vers TasksPage.tsx ([@votre_username])
```

### Étape 7 : Commit et Push

```bash
# Ajouter les fichiers modifiés
git add docs/PRODUCT_REFERENCE_V1.md docs/CHANGELOG.md

# Commit avec message descriptif
git commit -m "docs: amélioration du glossaire avec 3 nouveaux termes

- Ajout définitions : State Management, Middleware, Service Worker
- Correction typo section Pomodoro
- Mise à jour changelog

Closes #42"

# Push vers votre fork
git push origin docs/description-courte
```

### Étape 8 : Créer une Pull Request

**Sur GitHub** :
1. Aller sur votre fork
2. Cliquer "Compare & pull request"
3. Remplir le template :

```markdown
## Type de changement

- [x] Correction de bug (documentation)
- [ ] Amélioration (clarification)
- [ ] Nouveau contenu

## Description

Amélioration du glossaire avec 3 nouveaux termes techniques manquants.

## Fichiers modifiés

- `docs/PRODUCT_REFERENCE_V1.md` : Section glossaire
- `docs/CHANGELOG.md` : Entrée ajoutée

## Checklist

- [x] Orthographe vérifiée
- [x] Liens testés
- [x] Changelog mis à jour
- [x] Testé sur Chrome, Firefox, Safari
- [x] Responsive OK
- [x] Dark mode OK

## Captures d'écran (si applicable)

[Ajouter screenshots avant/après]

## Issues liées

Closes #42
```

---

## 📐 Standards et conventions

### Style d'écriture

**Ton** : Professionnel mais accessible
- ✅ "Cette fonctionnalité permet de..."
- ❌ "On peut faire..."

**Temps** : Présent de l'indicatif
- ✅ "Le système génère automatiquement..."
- ❌ "Le système va générer..." ou "génèrera"

**Voix** : Active plutôt que passive
- ✅ "L'utilisateur sélectionne une tâche"
- ❌ "Une tâche est sélectionnée"

### Format Markdown

```markdown
# Titre de niveau 1 (H1)
## Titre de niveau 2 (H2)
### Titre de niveau 3 (H3)

**Gras** pour mots-clés importants
*Italique* pour emphase légère
`Code inline` pour noms de fichiers, variables

\`\`\`typescript
// Bloc de code
const example = "avec syntaxe highlight";
\`\`\`

| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Valeur A  | Valeur B  |

- Liste non ordonnée
  - Sous-élément
- Deuxième élément

1. Liste ordonnée
2. Deuxième élément
```

### Captures d'écran

**Format** : PNG ou WebP  
**Taille max** : 500 KB par image  
**Résolution** : 1920x1080 max (full HD)  
**Annotations** : Flèches rouges, texte clair

**Nommage** :
```
screenshot-module-feature-state.png

Exemples :
- screenshot-tasks-columns-overview.png
- screenshot-pomodoro-timer-active.png
- screenshot-journal-habits-completed.png
```

**Placement** :
```
docs/
  images/
    v1.0/
      module-tasks/
        screenshot-tasks-columns-overview.png
        screenshot-tasks-project-creation.png
      module-pomodoro/
        screenshot-pomodoro-timer.png
```

### Liens

**Internes (même repo)** :
```markdown
[Voir le glossaire](#glossaire)
[Module Tâches](../src/components/tasks/TasksPage.tsx)
```

**Externes** :
```markdown
[Documentation React](https://react.dev)
[Gemini API](https://ai.google.dev/docs)
```

---

## 🎨 Design du HTML

### Variables CSS à utiliser

```css
/* Couleurs */
var(--primary)       /* Bleu principal */
var(--success)       /* Vert (✅) */
var(--warning)       /* Jaune (🔄) */
var(--info)          /* Violet (📋) */
var(--danger)        /* Rouge (⛔) */

/* Gris */
var(--gray-50) à var(--gray-700)

/* Ombres */
var(--shadow-sm)     /* Petite */
var(--shadow-md)     /* Moyenne */
var(--shadow-lg)     /* Grande */
```

### Classes utiles

```html
<span class="badge badge-success">✅ Implémenté</span>
<span class="badge badge-warning">🔄 En cours</span>
<span class="badge badge-info">📋 À faire</span>
<span class="badge badge-danger">⛔ Hors scope</span>

<a href="#section" class="file-link">NomFichier.tsx</a>

<span class="version-badge">v1.0.0</span>

<span class="search-highlight">texte surligné</span>
```

---

## ✅ Review checklist

Avant de soumettre votre PR, vérifier :

### Contenu
- [ ] Informations exactes et à jour
- [ ] Pas de contradictions avec autres sections
- [ ] Exemples clairs et testés
- [ ] Terminologie cohérente (voir glossaire)

### Forme
- [ ] Orthographe et grammaire correctes
- [ ] Format Markdown valide
- [ ] Indentation et espacement cohérents
- [ ] Émojis utilisés à bon escient

### Technique
- [ ] Liens fonctionnels (internes et externes)
- [ ] Code snippets syntaxiquement corrects
- [ ] Screenshots optimisés (compression)
- [ ] HTML valide (si modifié)

### Accessibilité
- [ ] Images ont un texte alternatif
- [ ] Contraste suffisant (WCAG AA)
- [ ] Navigation clavier possible
- [ ] ARIA labels présents

---

## 🆘 Besoin d'aide ?

### Ressources

- **Markdown Guide** : [markdownguide.org](https://www.markdownguide.org/)
- **HTML/CSS** : [MDN Web Docs](https://developer.mozilla.org/)
- **Accessibilité** : [WCAG Quick Ref](https://www.w3.org/WAI/WCAG21/quickref/)

### Contact

- 💬 Créer une issue sur GitHub
- 📧 Contacter l'équipe documentation
- 💡 Proposer une amélioration dans Discussions

---

## 🏆 Hall of Fame

Contributeurs documentation (par ordre alphabétique) :
- *Votre nom pourrait être ici !* 🌟

---

## 📜 Licence

En contribuant à ce projet, vous acceptez que vos contributions soient distribuées sous la même licence que le projet principal.

---

**Merci de contribuer à améliorer la documentation NewMars !** 🚀

*Dernière mise à jour : 20 Décembre 2024*

