# 🔧 Installation de Rust (Requis pour Tauri)

## ⚠️ Rust n'est pas installé !

Tauri nécessite Rust pour compiler le wrapper natif.

---

## 📥 Installation automatique (Recommandé)

### Étape 1 : Télécharge Rustup
1. Va sur : **https://rustup.rs/**
2. Clique sur **"Download rustup-init.exe (64-bit)"**
3. Lance le fichier téléchargé

### Étape 2 : Installation
```
Le programme demande :
1. Default installation (1) ← Appuie sur 1 puis Entrée
2. Installation en cours... (5-10 min)
3. "Rust is installed now. Great!"
```

### Étape 3 : Redémarre le terminal
```bash
# Ferme ce terminal PowerShell
# Réouvre-le
# Vérifie l'installation :
rustc --version
```

Tu devrais voir : `rustc 1.xx.x`

---

## 🚀 Après installation de Rust

### Reviens ici et lance :
```bash
npm run tauri:dev
```

**Première fois :**
- Compilation Rust : 2-3 minutes
- Téléchargement dépendances
- Puis fenêtre IKU s'ouvre ! 🎉

**Fois suivantes :**
- Lancement rapide : ~5 secondes
- Hot reload Vite fonctionne !

---

## 📦 Alternative : Tauri v2 (beta, pas besoin de Rust)

Si tu ne veux pas installer Rust maintenant, on peut :
1. Continuer en mode PWA (Vite comme avant)
2. Installer Rust plus tard
3. Ou attendre Tauri v2 final (pas besoin Rust côté user)

---

## 💡 Qu'est-ce que Rust ?

```
Rust = Langage de programmation
     = Utilisé par Tauri pour créer le wrapper natif
     = Compile en .exe Windows
     = Installé 1 fois, utilisé toujours
```

**Taille : ~400 MB**  
**Temps : 10 minutes**

---

## ✅ Checklist

- [ ] Télécharger rustup-init.exe depuis https://rustup.rs/
- [ ] Lancer l'installeur
- [ ] Choisir "Default installation"
- [ ] Attendre 5-10 min
- [ ] Redémarrer le terminal
- [ ] Vérifier : `rustc --version`
- [ ] Lancer : `npm run tauri:dev`

---

## 🎯 Statut actuel

```
✅ Tauri configuré dans le projet
✅ Scripts npm prêts
✅ Configuration complète
❌ Rust pas encore installé ← À faire !
```

**Une fois Rust installé → `npm run tauri:dev` et c'est parti ! 🚀**




