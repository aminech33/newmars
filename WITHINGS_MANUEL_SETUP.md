# 🚀 Configuration Withings - Instructions manuelles

## ✅ État actuel

- ✅ Backend lancé sur http://localhost:8000
- ⏳ ngrok à lancer manuellement
- ⏳ Withings à configurer

---

## 📋 ÉTAPES À SUIVRE

### **Étape 1 : Lance ngrok (dans un nouveau terminal)**

Ouvre un **nouveau terminal** et lance :

```bash
ngrok http 8000
```

Tu verras quelque chose comme :

```
ngrok

Session Status                online
Account                       Free
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**⚠️ IMPORTANT** : Note l'URL HTTPS (ex: `https://abc123def456.ngrok-free.app`)

**Laisse ce terminal ouvert !** (ngrok doit rester actif)

---

### **Étape 2 : Va sur Withings Developer**

1. Ouvre : https://developer.withings.com/dashboard

2. Si tu n'as pas encore d'application :
   - Clique sur **"Create Application"**
   - Remplis :
     ```
     Application Name: IKU App
     Description: Personal productivity and health tracking app
     Application Type: ☑️ Intégration de l'API publique
     Callback URI: https://TON-URL-NGROK/api/withings/callback
     Company Website: http://localhost:5173
     ```
   - **Remplace `TON-URL-NGROK`** par l'URL que ngrok a affichée !
   - Exemple : `https://abc123def456.ngrok-free.app/api/withings/callback`

3. **Note ton Client ID et Client Secret** (affiché après création)

---

### **Étape 3 : Configure le .env**

Ouvre le fichier `.env` :

```bash
cd /Users/aminecb/Desktop/newmars/backend
nano .env
```

Ajoute à la fin du fichier :

```bash
# ============================================
# Withings API Configuration
# ============================================
WITHINGS_CLIENT_ID=TON_CLIENT_ID_ICI
WITHINGS_CLIENT_SECRET=TON_CLIENT_SECRET_ICI
WITHINGS_REDIRECT_URI=https://TON-URL-NGROK.ngrok-free.app/api/withings/callback
WITHINGS_WEBHOOK_SECRET=
```

**Remplace** :
- `TON_CLIENT_ID_ICI` par ton vrai Client ID
- `TON_CLIENT_SECRET_ICI` par ton vrai Client Secret
- `TON-URL-NGROK.ngrok-free.app` par ton URL ngrok

**Sauvegarde** : Ctrl+X, puis Y, puis Enter

---

### **Étape 4 : Redémarre le backend**

Le backend doit redémarrer pour prendre en compte le `.env` :

```bash
# Trouve le PID du backend
ps aux | grep uvicorn | grep -v grep

# Kill le processus (remplace XXXX par le PID)
kill XXXX

# Relance
cd /Users/aminecb/Desktop/newmars/backend
python3 -m uvicorn main:app --reload --port 8000
```

Ou plus simple, redémarre depuis le début :

```bash
cd /Users/aminecb/Desktop/newmars/backend
pkill -f uvicorn
python3 -m uvicorn main:app --reload --port 8000
```

---

### **Étape 5 : Teste la connexion**

#### **Option A : Via Swagger UI**

1. Va sur : `https://ton-url-ngrok.ngrok-free.app/docs`
   (Remplace par ton URL ngrok)

2. Trouve la section **"Withings"**

3. Teste `GET /api/withings/auth`
   - Clique "Try it out"
   - Clique "Execute"

4. Tu recevras une URL comme :
   ```json
   {
     "auth_url": "https://account.withings.com/oauth2_user/authorize2?..."
   }
   ```

5. **Copie cette URL** et ouvre-la dans ton navigateur

6. Connecte-toi à Withings et autorise l'accès

7. Tu devrais voir : **"✅ Balance Withings connectée!"**

#### **Option B : Via l'app**

1. Lance l'app (si pas déjà lancé) :
   ```bash
   cd /Users/aminecb/Desktop/newmars
   npm run tauri dev
   ```

2. Va dans **Santé** → **Profil** (onglet tout à droite)

3. Tu verras une carte **"Connecter ta balance Withings"**

4. Clique sur **"Connecter Withings"**

5. Une fenêtre s'ouvre → Connecte-toi et autorise

6. ✅ **Tes pesées sont synchronisées !**

---

## 🔄 À chaque redémarrage de ngrok

⚠️ **L'URL ngrok change à chaque fois** (version gratuite)

Tu devras :
1. Noter la nouvelle URL ngrok
2. La mettre à jour sur developer.withings.com (Callback URI)
3. La mettre à jour dans `.env` (WITHINGS_REDIRECT_URI)
4. Redémarrer le backend

---

## 📝 Exemple complet de .env

Voici à quoi devrait ressembler ton `.env` final :

```bash
# Configuration Backend Adaptatif - NewMars
# Mis à jour le 2024-12-23

# OpenAI API Key (obligatoire)
OPENAI_API_KEY=your_openai_api_key_here

# Serveur (optionnel)
HOST=0.0.0.0
PORT=8000
DEBUG=True

# ============================================
# Withings API Configuration
# ============================================
WITHINGS_CLIENT_ID=abc123def456
WITHINGS_CLIENT_SECRET=xyz789abc123def456
WITHINGS_REDIRECT_URI=https://abc123def456.ngrok-free.app/api/withings/callback
WITHINGS_WEBHOOK_SECRET=
```

(Avec tes vraies valeurs bien sûr !)

---

## ❓ Problèmes courants

### "Invalid redirect_uri"
→ L'URL sur Withings Developer ≠ celle dans `.env`
→ Vérifie qu'elles sont EXACTEMENT identiques

### ngrok affiche "ERR_NGROK_108"
→ Tu es peut-être déconnecté. Crée un compte gratuit sur ngrok.com et configure ton authtoken

### "Application not found"
→ Vérifie ton WITHINGS_CLIENT_ID dans `.env`

### Le backend ne redémarre pas
→ Kill tous les processus uvicorn :
```bash
pkill -9 -f uvicorn
```
Puis relance

---

## 🎯 Checklist

- [ ] ngrok lancé et URL notée
- [ ] Application créée sur Withings Developer
- [ ] Client ID et Secret obtenus
- [ ] Callback URI configurée sur Withings
- [ ] `.env` modifié avec les credentials
- [ ] Backend redémarré
- [ ] Test réussi (Swagger ou app)
- [ ] Pesées synchronisées ✅

---

🎉 **Une fois configuré, tout sera automatique !**

Les pesées se synchroniseront dès que tu cliques sur "Connecter Withings" dans l'app.

---

*Créé le 26 décembre 2024*

