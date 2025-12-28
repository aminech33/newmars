# 🔍 Guide de Diagnostic — Hub V2.5

**Si tu ne vois pas les changements, suis ces étapes :**

---

## ✅ **ÉTAPE 1 : HARD REFRESH**

### **Mac**
```
Cmd + Shift + R
```

### **Windows/Linux**
```
Ctrl + Shift + R
```

ou

```
Ctrl + F5
```

---

## ✅ **ÉTAPE 2 : VÉRIFICATION VISUELLE**

### **Ce que tu DOIS voir maintenant :**

#### **1. Score avec Animation** ⭐
- Le score "96" doit **apparaître progressivement** (scale + fade)
- Pas instantané, mais en **~600ms**

#### **2. Conseil sous le Score** ⭐⭐⭐
```
           96 ↗
        Excellent  ⓘ
  💡 Tu es au top ! Continue comme ça 🔥
```

**Si tu vois "💡 ..." sous le score → ✅ Ça marche !**

#### **3. Icône Info (ⓘ)** ⭐
- À côté du mot "Excellent"
- Petite icône grise

#### **4. Mini Compteur en Haut à Droite** ⭐⭐
```
Vendredi 25 déc          3/8 tâches
Bonjour, Amine           2/3 habitudes
```

**Si tu vois "X/Y tâches" en haut à droite → ✅ Ça marche !**

#### **5. Badge "En retard" sur Tâche** ⭐
- Si une tâche a une date dépassée
- Badge rouge "⚠️ En retard"

#### **6. Breakdown Plus Lisible** ⭐
- Les labels "Productivité", "Mental", "Constance"
- Doivent être **légèrement plus grands** (12px au lieu de 11px)

#### **7. Optimistic UI au Clic** ⭐⭐⭐
- Clique sur une tâche
- Elle devient **instantanément transparente** (opacity-50)
- Le rond se **remplit** en vert
- **Si tu vois ce feedback instantané → ✅ Ça marche !**

---

## ✅ **ÉTAPE 3 : SI TU NE VOIS TOUJOURS RIEN**

### **Option A : Console du Navigateur**

1. Ouvre la **Console** (F12 ou Cmd+Option+I)
2. Vérifie s'il y a des **erreurs en rouge**
3. Copie-moi les erreurs

### **Option B : LocalStorage**

1. Ouvre la Console (F12)
2. Va dans **Application → Local Storage → localhost:5173**
3. Vérifie si `iku-brain-memory` existe

### **Option C : Restart Complet**

Dans ton terminal :
```bash
# Arrête le serveur (Ctrl+C)
# Puis relance
cd /Users/aminecb/Desktop/newmars && npm run dev
```

---

## 🎯 **TEST RAPIDE : 3 SIGNES ÉVIDENTS**

1. **💡 Conseil visible sous le score** → Si OUI = ✅ V2.5 fonctionne
2. **Compteur "X/Y tâches" en haut à droite** → Si OUI = ✅ V2.5 fonctionne
3. **Clic sur tâche = opacity-50 instantané** → Si OUI = ✅ V2.5 fonctionne

**Si tu vois AU MOINS 1 de ces 3 signes → Les changements sont bien là !**

---

## 📸 **CAPTURE D'ÉCRAN DE RÉFÉRENCE**

Voici à quoi ça devrait ressembler :

```
┌─────────────────────────────────────────────────────────┐
│ Vendredi 25 décembre                    3/8 tâches      │ ← COMPTEUR
│ Bonjour, Amine                          2/3 habitudes   │
│                                                          │
│                         96 ↗                             │ ← ANIMATION
│                    Excellent  ⓘ                          │ ← ICÔNE
│          💡 Tu es au top ! Continue comme ça 🔥          │ ← CONSEIL
│                                                          │
│              ✓        ❤        🔥                        │
│             28       22       25                         │
│        Productivité Mental Constance                     │ ← +1px
│                                                          │
│  [Terminer rapport] ⚠️ En retard                        │ ← BADGE
│  [Autre tâche]                                           │
│                                                          │
│  [🏃 5] [💧] [📚 3j]                                     │ ← BADGES
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 **DERNIÈRE SOLUTION : RÉINSTALLER**

Si vraiment rien ne marche :

```bash
# Arrête le serveur
# Supprime node_modules
rm -rf node_modules

# Réinstalle
npm install

# Relance
npm run dev
```

---

**Date** : 25 décembre 2024  
**Version attendue** : V2.5  
**Fichier modifié** : `/src/components/HubV2.tsx`







