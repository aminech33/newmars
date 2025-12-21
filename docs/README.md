# 📚 Documentation NewMars

Ce dossier contient toute la documentation officielle du projet NewMars.

## 📄 Fichiers disponibles

### Documents principaux

| Fichier | Description | Format | Statut |
|---------|-------------|--------|--------|
| **PRODUCT_REFERENCE_V1.md** | Document de référence produit v1 (source) | Markdown | ✅ À jour |
| **product-reference-v1.html** | Version interactive HTML avec recherche | HTML/CSS/JS | ✅ À jour |
| **CHANGELOG.md** | Historique des versions et roadmap | Markdown | ✅ À jour |

### Documents complémentaires

| Fichier | Description | Statut |
|---------|-------------|--------|
| **GOOGLE_BOOKS_API.md** | Documentation API Google Books | 📖 Référence |
| **VISUAL_COMPARISON.md** | Comparaisons visuelles de design | 📊 Référence |

---

## 🚀 Utilisation

### Consultation du document produit

**Option 1 : Version interactive (recommandée)**
```bash
# Ouvrir dans un navigateur
open docs/product-reference-v1.html
```

Fonctionnalités :
- 🔍 Recherche intégrée (Ctrl/Cmd+K)
- 🌓 Toggle dark/light mode
- 🖨️ Export PDF optimisé
- 📱 Responsive mobile avec menu hamburger
- 🔗 Liens cliquables vers code source
- ♿ Support accessibilité (ARIA labels)

**Option 2 : Version Markdown (éditable)**
```bash
# Lire/éditer avec votre éditeur préféré
code docs/PRODUCT_REFERENCE_V1.md
```

### Export en PDF

1. Ouvrir `product-reference-v1.html` dans un navigateur
2. Cliquer sur le bouton 🖨️ ou utiliser Ctrl/Cmd+P
3. Sélectionner "Enregistrer au format PDF"
4. Les styles d'impression sont optimisés automatiquement

---

## 📝 Maintenance

### Mise à jour de la documentation

**Workflow recommandé :**

1. **Éditer le Markdown source**
   ```bash
   vim docs/PRODUCT_REFERENCE_V1.md
   ```

2. **Regénérer le HTML** (si nécessaire)
   - Actuellement manuel
   - TODO : Script de conversion automatique

3. **Mettre à jour le changelog**
   ```bash
   vim docs/CHANGELOG.md
   ```

4. **Versionner les changements**
   ```bash
   git add docs/
   git commit -m "docs: mise à jour document produit v1.0.1"
   ```

### Conventions de nommage

- **Majuscules** : Documents officiels permanents (`PRODUCT_REFERENCE_V1.md`)
- **Minuscules** : Versions dérivées ou temporaires (`product-reference-v1.html`)
- **Versioning** : Format `vX.Y.Z` dans le nom ou contenu

---

## 🎯 Structure du document produit

### Sections principales

1. **Vue d'ensemble** - Objectif, légende des statuts
2. **Flux applicatif** - Diagramme de navigation
3. **Modules** - Cards résumés des 9 modules
4. **Détails par module** - Fonctionnalités exhaustives
   - Hub
   - Tâches
   - Journal
   - Santé
   - Apprentissage
   - Pomodoro
   - Bibliothèque
   - Dashboard
   - Paramètres
   - Brain
5. **Architecture technique** - Stack et structure
6. **Glossaire** - Définitions des termes clés
7. **Changelog** - Historique et roadmap
8. **Résumé** - Table récapitulative

### Format des statuts

| Icône | Statut | Signification |
|-------|--------|---------------|
| ✅ | **Implémenté** | Fonctionnel en production |
| 🔄 | **En cours** | Développement actif |
| 📋 | **À faire** | Prévu pour la version actuelle |
| ⛔ | **Hors scope** | Explicitement exclu |

---

## 🔧 Configuration

### Variables à personnaliser

Dans `product-reference-v1.html`, ligne ~3510 :
```javascript
// GitHub repository base URL (update this to your actual repo)
const GITHUB_REPO = 'https://github.com/yourusername/newmars/blob/main';
```

**Action requise :** Remplacer `yourusername` par votre nom d'utilisateur GitHub réel.

---

## 📊 Statistiques

- **Modules documentés** : 9
- **Fonctionnalités détaillées** : ~95
- **Termes dans glossaire** : 10
- **Lignes de code HTML** : ~2400
- **Taille totale docs** : ~350 KB

---

## 🤝 Contribution

Pour contribuer à la documentation :

1. **Identifier le besoin**
   - Fonctionnalité manquante
   - Information obsolète
   - Clarification nécessaire

2. **Créer une issue**
   ```
   Titre: [DOCS] Description du problème
   Label: documentation
   ```

3. **Proposer une PR**
   - Éditer le(s) fichier(s) concerné(s)
   - Respecter le format existant
   - Ajouter une entrée au changelog si pertinent

4. **Validation**
   - Vérifier l'orthographe (français)
   - Tester les liens
   - Valider le HTML (W3C)

---

## 📚 Ressources externes

- [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) - Format du changelog
- [Semantic Versioning](https://semver.org/lang/fr/) - Conventions de versioning
- [Microsoft Fluent Design](https://fluent2.microsoft.design/) - Système de design utilisé
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Standards d'accessibilité

---

## 📞 Contact

Pour toute question sur la documentation :
- Créer une issue GitHub
- Consulter le canal #documentation (si applicable)

---

**Dernière mise à jour** : 20 Décembre 2024  
**Mainteneur** : Product Team

