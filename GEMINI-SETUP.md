
# 🤖 Configuration Gemini API

## ✅ STATUT : ACTIVÉ

Votre app est maintenant connectée à **Gemini 2.0 Flash** (gratuit, illimité) !

---

## 🔑 Clé API

**Votre clé** : `AIzaSyBFlZdThjH9z3ciJVSIJwfPDfmTpZeN85w`

**Stockage** : `.env` (ignoré par Git, sécurisé)

---

## 📊 Modèle actif

**Gemini 2.0 Flash Experimental** (`gemini-2.0-flash-exp`)

### Caractéristiques :
- ✅ **Gratuit illimité** (1500 requêtes/jour)
- ✅ **Rapide** (~1-2s de réponse)
- ✅ **Parfait pour l'apprentissage**
- ✅ **Context window : 32K tokens** (~24K mots)

---

## 🔄 Changer de modèle

Éditez `.env` :

```env
# Modèle actuel (gratuit, rapide)
VITE_GEMINI_MODEL=gemini-2.0-flash-exp

# Alternative 1 : LearnLM (optimisé pour l'éducation, gratuit)
# VITE_GEMINI_MODEL=learnlm-1.5-pro-experimental

# Alternative 2 : Gemini Pro (meilleure qualité, payant ~3$/mois)
# VITE_GEMINI_MODEL=gemini-1.5-pro

# Alternative 3 : Flash stable (gratuit, production)
# VITE_GEMINI_MODEL=gemini-1.5-flash
```

Redémarrez le serveur après modification.

---

## 📈 Quotas & Limites

### Gemini 2.0 Flash (actuel)
- **Requêtes/minute** : 15 (gratuit)
- **Requêtes/jour** : 1500 (gratuit)
- **Tokens/requête** : 32K input, 8K output
- **Coût** : **0$ à vie** 🎉

### Si vous dépassez les quotas
1. Attendez 1 minute (rate limit)
2. OU passez à un modèle payant (Gemini Pro)
3. OU activez la facturation Google Cloud

---

## 🎓 Intégrations Gemini

### **1️⃣ Learning App (Apprentissage)**

L'IA utilise automatiquement :
- Nom du cours, description, niveau
- Topics à couvrir
- Historique de conversation complet
- System prompts personnalisés
- Exemples concrets (code, exercices, flashcards)

### **2️⃣ AI Assistant (Assistant Personnel)**

L'IA a accès à **TOUTES vos données** :
- 📋 **Tâches** : pending, complétées, urgentes, projets
- 🔥 **Habitudes** : actives, fréquence, streaks
- 📚 **Bibliothèque** : livres en cours, complétés, pages lues
- 🎓 **Apprentissage** : cours actifs, progression
- ⏱️ **Productivité** : temps de focus, Pomodoros
- 📝 **Journal** : entrées, réflexions

**Exemples de questions** :
- "Quelles sont mes priorités aujourd'hui ?"
- "Résume ma productivité cette semaine"
- "Analyse mes habitudes et donne-moi des conseils"
- "Recommande-moi un livre basé sur mes lectures"
- "Comment optimiser mon temps de focus ?"

---

## 🛡️ Sécurité

✅ **Clé API stockée dans `.env`** (pas sur Git)
✅ **`.gitignore` configuré** (votre clé reste privée)
✅ **Gestion des erreurs** (rate limit, réseau, etc.)
✅ **Safety filters** activés (contenu approprié)

---

## 🧪 Tester la connexion

Dans votre terminal :

```bash
npm run dev
```

Puis :
1. Allez dans **Learning** (Apprentissage)
2. Créez un cours
3. Tapez un message
4. L'IA répond en ~2 secondes ! 🚀

---

## ❌ Problèmes courants

### Erreur 403 (Clé invalide)
- Vérifiez que la clé dans `.env` est correcte
- Vérifiez qu'elle n'a pas expiré sur AI Studio

### Erreur 429 (Rate limit)
- Attendez 1 minute
- Vous avez dépassé 15 req/min

### Erreur réseau
- Vérifiez votre connexion internet
- Vérifiez que l'API est accessible (pas de firewall)

### Pas de réponse
- Ouvrez la console (F12)
- Cherchez les erreurs JavaScript
- Vérifiez que `.env` est bien chargé

---

## 📚 Ressources

- **API Documentation** : https://ai.google.dev/docs
- **AI Studio** : https://aistudio.google.com/
- **Pricing** : https://ai.google.dev/pricing
- **Support** : https://ai.google.dev/support

---

## 🎯 Prochaines étapes

### Fonctionnalités à ajouter :
- [ ] Résumés de livres (Library)
- [ ] Suggestions de tâches (Tasks)
- [ ] Analyse de journal (Journal)
- [ ] Coaching santé (Health)
- [ ] Génération de flashcards automatique

---

**Fichier créé le** : 2 janvier 2025  
**Modèle** : Gemini 2.0 Flash Experimental  
**Coût mensuel estimé** : **0$** (gratuit) 🎉

