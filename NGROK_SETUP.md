# 🚀 Guide de configuration Withings avec ngrok

## ✅ Étape 1 : Télécharger et installer ngrok

### Option A : Installation manuelle (RECOMMANDÉ)

1. **Télécharge ngrok** :
   ```bash
   # Télécharge depuis le site officiel
   open https://ngrok.com/download
   ```

2. **Décompresse et installe** :
   ```bash
   # Une fois téléchargé, déplace-le dans /usr/local/bin
   sudo mv ~/Downloads/ngrok /usr/local/bin/
   sudo chmod +x /usr/local/bin/ngrok
   ```

3. **Vérifie l'installation** :
   ```bash
   ngrok version
   ```

### Option B : Via Homebrew (si les permissions sont réparées)

```bash
# Réparer les permissions Homebrew
sudo chown -R $(whoami) /opt/homebrew/Cellar
sudo chown -R $(whoami) /opt/homebrew/Library

# Installer ngrok
brew install ngrok/ngrok/ngrok
```

---

## ✅ Étape 2 : Lancer le backend

```bash
cd /Users/aminecb/Desktop/newmars/backend
python -m uvicorn main:app --reload --port 8000
```

Le backend devrait démarrer sur `http://localhost:8000`

---

## ✅ Étape 3 : Lancer ngrok (dans un nouveau terminal)

```bash
ngrok http 8000
```

Tu verras quelque chose comme :

```
ngrok

Session Status                online
Account                       Free (Limit: 40 connections/minute)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**⚠️ IMPORTANT** : Note l'URL `https://abc123def456.ngrok-free.app` (elle change à chaque fois !)

---

## ✅ Étape 4 : Configurer Withings Developer

1. Va sur https://developer.withings.com/dashboard
2. Sélectionne ton application "IKU App"
3. Modifie la **Callback URI** :
   ```
   https://abc123def456.ngrok-free.app/api/withings/callback
   ```
   ⚠️ Remplace `abc123def456.ngrok-free.app` par TON URL ngrok !

4. Sauvegarde les modifications

---

## ✅ Étape 5 : Mettre à jour le backend

1. Ouvre `/Users/aminecb/Desktop/newmars/backend/.env`
2. Mets à jour la variable :
   ```bash
   WITHINGS_REDIRECT_URI=https://abc123def456.ngrok-free.app/api/withings/callback
   ```
   ⚠️ Remplace par ton URL ngrok !

3. **Redémarre le backend** (Ctrl+C puis relance) :
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

---

## ✅ Étape 6 : Tester la connexion

### Méthode 1 : Via l'app frontend

1. Lance le frontend (si pas déjà lancé) :
   ```bash
   cd /Users/aminecb/Desktop/newmars
   npm run tauri dev
   ```

2. Va dans **Santé** → Onglet **Profil**
3. Clique sur **"Connecter Withings"**
4. Une fenêtre s'ouvre → Connecte-toi à Withings
5. Autorise l'accès
6. La fenêtre se ferme automatiquement
7. ✅ Tes pesées sont synchronisées !

### Méthode 2 : Via Swagger UI (test manuel)

1. Va sur `https://ton-url-ngrok.ngrok-free.app/docs`
2. Teste `GET /api/withings/auth`
3. Copie l'URL retournée et ouvre-la
4. Connecte-toi et autorise
5. Tu devrais voir une page "Balance Withings connectée!"

---

## 🔄 Workflow quotidien

### À chaque session de développement :

```bash
# Terminal 1 : Backend
cd /Users/aminecb/Desktop/newmars/backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 : ngrok
ngrok http 8000

# Terminal 3 : Frontend
cd /Users/aminecb/Desktop/newmars
npm run tauri dev
```

**⚠️ L'URL ngrok change à chaque redémarrage** (version gratuite)
→ Tu devras mettre à jour la Callback URI sur Withings Developer à chaque fois

### Pour une URL fixe (optionnel) :

1. Crée un compte ngrok : https://dashboard.ngrok.com/signup
2. Configure ton authtoken :
   ```bash
   ngrok config add-authtoken TON_TOKEN
   ```
3. Achète un domaine fixe (payant) ou utilise un free tier avec limite

---

## 🐛 Troubleshooting

### Erreur : "Failed to complete tunnel connection"
→ ngrok n'arrive pas à se connecter. Vérifie que le port 8000 est libre :
```bash
lsof -i :8000
# Si occupé, kill le processus ou change de port
```

### Erreur : "Invalid redirect_uri"
→ L'URL dans Withings Developer ne correspond pas à celle dans `.env`
→ Vérifie les deux et redémarre le backend

### Erreur : "Code d'autorisation manquant"
→ Withings n'a pas renvoyé de code
→ Vérifie que la Callback URI est correcte (HTTPS obligatoire !)

### La fenêtre ne se ferme pas automatiquement
→ Normal sur certains navigateurs (sécurité)
→ Ferme-la manuellement, les tokens sont déjà stockés

### "Tokens not found" après autorisation
→ Vérifie que localStorage n'est pas bloqué
→ Ouvre la console (F12) et cherche des erreurs

---

## 📝 Checklist rapide

- [ ] ngrok installé et fonctionnel
- [ ] Backend lancé sur port 8000
- [ ] ngrok lancé : `ngrok http 8000`
- [ ] URL ngrok notée (ex: `https://abc123.ngrok-free.app`)
- [ ] Callback URI mise à jour sur Withings Developer
- [ ] `.env` mis à jour avec la nouvelle URL
- [ ] Backend redémarré
- [ ] Frontend lancé
- [ ] Test de connexion réussi
- [ ] Pesées synchronisées ✅

---

## 🎉 C'est prêt !

Tu peux maintenant :
- ✅ Connecter ta balance Withings
- ✅ Synchroniser automatiquement tes pesées
- ✅ Obtenir toutes les métriques (poids, masse grasse, muscle, etc.)
- ✅ Le système de calcul avancé utilisera ces données pour être ultra-précis !

**Note** : En production, remplace ngrok par un vrai domaine avec HTTPS.








