# Instructions Claude - Projet NewMars

## Regles Obligatoires

**LIRE IMPERATIVEMENT** : [.claude/AI-RULES.md](.claude/AI-RULES.md)

Ce fichier contient les regles critiques d'auto-validation que l'IA doit suivre AVANT toute modification de code.

## Resume des Interdictions

1. **Ne jamais dupliquer StudentProfile** - Source unique : `backend/simulators/profiles.py`
2. **Ne jamais creer de variantes** - Pas de `_v2`, `_new`, `_test`
3. **Ne jamais importer les 9 modules supprimes** - Utiliser uniquement les 5 modules autorises

## Processus

Avant chaque modification de code :
1. Verifier les checklists dans AI-RULES.md
2. Si violation detectee → Corriger avant de proposer
3. Modifier les fichiers existants (pas de copies)
