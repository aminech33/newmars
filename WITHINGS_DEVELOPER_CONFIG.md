# 📝 Configuration Withings Developer - Valeurs à remplir

## 🔗 URL du portail
https://developer.withings.com/dashboard

---

## ✅ Étape 1 : Créer l'application

### Formulaire à remplir :

**Application Name** (nom de l'app)
```
IKU App
```

**Description**
```
Personal productivity and health tracking application with integrated weight and body composition monitoring
```

**Application Type**
```
☑️ Intégration de l'API publique
```

**Company Website** (site web)
```
http://localhost:5173
```

**Callback URI** (À MODIFIER APRÈS LANCEMENT DE NGROK)
```
https://TON-URL-NGROK.ngrok-free.app/api/withings/callback
```

**Logo** (optionnel)
```
(Laisse vide ou upload un logo 512x512px)
```

---

## 🔧 Étape 2 : Après création de l'app

Tu recevras :

### Client ID
```
[Un code genre: abc123def456]
→ À copier dans .env : WITHINGS_CLIENT_ID=...
```

### Client Secret
```
[Un code genre: xyz789abc123def456]
→ À copier dans .env : WITHINGS_CLIENT_SECRET=...
```

⚠️ **IMPORTANT** : Garde ces valeurs secrètes !

---

## 🚀 Étape 3 : Configuration avec ngrok

### 3.1. Lance ngrok
```bash
cd /Users/aminecb/Desktop/newmars/backend
./start_withings_dev.sh
```

Le script affichera quelque chose comme :
```
✅ ngrok lancé : https://abc123def456.ngrok-free.app
```

### 3.2. Mets à jour la Callback URI

Retourne sur https://developer.withings.com/dashboard

Trouve ta app "IKU App" → **Edit** → **Callback URI** :
```
https://abc123def456.ngrok-free.app/api/withings/callback
```
(Remplace `abc123def456.ngrok-free.app` par TON URL ngrok)

**Sauvegarde !**

### 3.3. Mets à jour le .env

Ouvre `/Users/aminecb/Desktop/newmars/backend/.env` :

```bash
# Withings API
WITHINGS_CLIENT_ID=ton_client_id_ici
WITHINGS_CLIENT_SECRET=ton_client_secret_ici
WITHINGS_REDIRECT_URI=https://abc123def456.ngrok-free.app/api/withings/callback
```

(Remplace par tes vraies valeurs)

### 3.4. Redémarre le backend

```bash
# Ctrl+C pour arrêter
# Puis relance
cd /Users/aminecb/Desktop/newmars/backend
python -m uvicorn main:app --reload --port 8000
```

---

## ✅ Étape 4 : Tester

### Test via Swagger UI

1. Va sur : `https://ton-url-ngrok.ngrok-free.app/docs`
2. Trouve `GET /api/withings/auth`
3. Clique "Try it out" → "Execute"
4. Copie l'URL retournée
5. Ouvre-la dans un navigateur
6. Connecte-toi à Withings et autorise
7. Tu devrais voir : "✅ Balance Withings connectée!"

### Test via l'app

1. Lance : `npm run tauri dev` (depuis `/Users/aminecb/Desktop/newmars`)
2. Va dans **Santé** → **Profil**
3. Clique **"Connecter Withings"**
4. Autorise l'accès
5. ✅ Tes pesées sont synchronisées !

---

## 📋 Checklist rapide

- [ ] Compte créé sur developer.withings.com
- [ ] Application "IKU App" créée
- [ ] Client ID noté
- [ ] Client Secret noté
- [ ] ngrok lancé (via `./start_withings_dev.sh`)
- [ ] URL ngrok notée (ex: https://abc123.ngrok-free.app)
- [ ] Callback URI mise à jour sur Withings : `https://TON-URL-NGROK/api/withings/callback`
- [ ] `.env` mis à jour avec Client ID, Secret et URL ngrok
- [ ] Backend redémarré
- [ ] Test réussi (via Swagger ou app)
- [ ] Pesées synchronisées ✅

---

## 🔄 À chaque redémarrage de ngrok

**L'URL ngrok change à chaque fois** (version gratuite).

Tu devras :
1. Noter la nouvelle URL ngrok
2. La mettre à jour sur developer.withings.com (Callback URI)
3. La mettre à jour dans `.env` (WITHINGS_REDIRECT_URI)
4. Redémarrer le backend

**Alternative** : Achète un domaine fixe ngrok (payant) ou utilise un vrai domaine HTTPS en production.

---

## ❓ Problèmes ?

### "Invalid redirect_uri"
→ L'URL sur Withings Developer ≠ celle dans `.env`
→ Vérifie les deux, elles doivent être EXACTEMENT identiques

### "Application not found"
→ Vérifie ton Client ID dans `.env`

### "Invalid client_secret"
→ Vérifie ton Client Secret dans `.env`

### Page d'erreur après autorisation
→ Vérifie que le backend est bien lancé
→ Vérifie que ngrok est actif

---

## 📚 Documentation officielle

- **API Reference** : https://developer.withings.com/api-reference/
- **OAuth2 Guide** : https://developer.withings.com/oauth2/
- **Dashboard** : https://developer.withings.com/dashboard

---

*Créé le 26 décembre 2024*

