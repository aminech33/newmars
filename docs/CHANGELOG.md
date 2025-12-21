# Changelog - NewMars Documentation

Toutes les modifications notables apportées au document de référence produit seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.0.0] - 2024-12-20

### 🎉 Release initiale

#### Ajouté (Application)
- 9 modules fonctionnels complets
- Système de tâches avec colonnes temporelles (Aujourd'hui, En cours, À venir, Lointain)
- Journal quotidien avec habitudes, humeur et streaks
- Suivi santé : nutrition (calories, macros), poids avec graphique
- Module apprentissage avec chat IA tuteur (Gemini)
- Timer Pomodoro avec liaisons multiples (tâches, projets, livres, cours)
- Bibliothèque personnelle avec citations et notes de lecture
- Dashboard avec indicateurs de continuité et corrélations statistiques
- Brain algorithmique (backend fonctionnel, UI en attente)
- PWA installable avec service worker pour mode hors-ligne
- Système d'export/import des données en JSON
- Génération de projet IA avec analyse de domaine
- Relations et dépendances entre tâches
- Système de quota pour éviter la surcharge cognitive
- Confettis de célébration (optionnels)

#### Ajouté (Documentation)
- Document de référence produit v1 (Markdown)
- Version HTML interactive avec design Microsoft Fluent
- Barre de recherche intégrée avec highlight des résultats
- Dark mode automatique avec toggle manuel
- Support print CSS pour export PDF optimisé
- Navigation sticky avec sidebar et onglets
- Flow diagram de l'architecture applicative
- Cards résumés pour chaque module
- Tables détaillées des fonctionnalités par module
- Sections d'exclusions explicites pour chaque module
- Glossaire des termes clés (Streak, Quota, Brain, etc.)
- Changelog intégré avec roadmap v1.1
- Liens cliquables vers fichiers source (GitHub)
- Bouton scroll-to-top
- Menu hamburger responsive pour mobile
- ARIA labels pour l'accessibilité
- Raccourci clavier Ctrl/Cmd+K pour la recherche
- Analytics de consultation des sections

#### Architecture technique
- Frontend : React 18 + TypeScript + Tailwind CSS + Vite
- State : Zustand avec persist middleware
- Storage : localStorage (persistance côté client)
- IA : Gemini API (Google)
- Backend : FastAPI (Python) pour génération de plans
- Desktop : Tauri (optionnel)

---

## [Planifié] v1.1 - Q1 2025

### À venir

#### Fonctionnalités app
- [ ] Intégration UI du Brain sur le Hub avec suggestions
- [ ] Récurrence de tâches (quotidien, hebdomadaire, mensuel)
- [ ] Vue calendrier des tâches et événements
- [ ] UI des flashcards exposée (structure déjà présente)
- [ ] Thème clair complet (actuellement en mode sombre uniquement)
- [ ] Statistiques hebdomadaires/mensuelles détaillées
- [ ] Export des tâches en CSV/PDF
- [ ] Export du journal en Markdown
- [ ] Recherche full-text dans le journal
- [ ] Prompts de journaling guidé
- [ ] Rappels et notifications configurables

#### Améliorations documentation
- [ ] Screenshots par module
- [ ] Diagrammes d'interdépendances entre modules
- [ ] Section "Getting Started" pour nouveaux utilisateurs
- [ ] Tutoriels vidéo intégrés
- [ ] Documentation API pour développeurs
- [ ] Guide de contribution
- [ ] Tests de couverture documentés

---

## Notes de version

### Principes de versioning

- **Major (X.0.0)** : Changements breaking, refonte majeure
- **Minor (1.X.0)** : Nouvelles fonctionnalités, rétro-compatible
- **Patch (1.0.X)** : Corrections de bugs, améliorations mineures

### Format du changelog

- **Ajouté** : Nouvelles fonctionnalités
- **Modifié** : Changements de fonctionnalités existantes
- **Déprécié** : Fonctionnalités à retirer prochainement
- **Retiré** : Fonctionnalités supprimées
- **Corrigé** : Corrections de bugs
- **Sécurité** : Corrections de vulnérabilités

---

**Source de vérité** : Ce changelog documente l'évolution du produit et de sa documentation.  
Pour les détails techniques, voir le document de référence complet.


## [1.0.1] - 2024-12-20

### Modifié
- **Header compact** : Réduction de la hauteur du header de 165px à ~125px
  - Header-top : padding réduit de 12px à 8px
  - Logo : taille réduite de 36px à 32px, font-size de 20px à 18px
  - Header-title : padding réduit de 24px à 16px
  - Titre h1 : font-size réduit de 28px à 22px
  - Nav-tabs : padding réduit de 12px à 10px, font-size de 14px à 13px
  - Scroll-margin ajusté de 200px à 140px
  - Sidebar top ajusté de 140px à 120px
  - Barre de recherche repositionnée de 20px à 12px du haut
- **Amélioration UX** : Gain de ~40px d'espace vertical (moins imposant sur petits écrans)

