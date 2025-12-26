# ⚡ Quick Start - Intégration Withings

## 🎯 TL;DR - 3 minutes pour tout configurer

### 1. Installe ngrok
```bash
# Télécharge
open https://ngrok.com/download

# Installe
sudo mv ~/Downloads/ngrok /usr/local/bin/
sudo chmod +x /usr/local/bin/ngrok
```

### 2. Configure Withings Developer
1. Va sur https://developer.withings.com/
2. Crée une app "IKU App"
3. Type : **"Intégration de l'API publique"**
4. Note ton **Client ID** et **Client Secret**

### 3. Configure le .env
```bash
cd /Users/aminecb/Desktop/newmars/backend
cp env.example .env
nano .env  # ou ton éditeur préféré
```

Ajoute :
```bash
WITHINGS_CLIENT_ID=ton_client_id
WITHINGS_CLIENT_SECRET=ton_client_secret
```

### 4. Lance tout
```bash
# Lance backend + ngrok
./start_withings_dev.sh

# Le script affiche l'URL ngrok à configurer
# Ex: https://abc123.ngrok-free.app
```

### 5. Mets à jour Withings
1. Retourne sur https://developer.withings.com/dashboard
2. Edit ta app → Callback URI : `https://TON-URL-NGROK/api/withings/callback`
3. Mets à jour `.env` : `WITHINGS_REDIRECT_URI=https://TON-URL-NGROK/api/withings/callback`
4. Redémarre le backend (Ctrl+C puis relance)

### 6. Connecte-toi dans l'app
```bash
# Lance le frontend (nouveau terminal)
cd /Users/aminecb/Desktop/newmars
npm run tauri dev
```

1. Va dans **Santé** → **Profil**
2. Clique **"Connecter Withings"**
3. ✅ C'est fait !

---

## 📂 Tous les fichiers créés

- ✅ `/backend/routes/withings.py` - API routes
- ✅ `/src/components/health/WithingsConnect.tsx` - Composant UI
- ✅ `/backend/start_withings_dev.sh` - Script de lancement
- ✅ `/WITHINGS_READY.md` - Guide complet
- ✅ `/WITHINGS_DEVELOPER_CONFIG.md` - Config Withings
- ✅ `/backend/WITHINGS_INTEGRATION.md` - Doc API
- ✅ `/NGROK_SETUP.md` - Setup ngrok
- ✅ `/CALCUL_CALORIES_AVANCE.md` - Utilisation des données

---

## 🆘 Aide rapide

**Problème de callback ?**
→ Vérifie que l'URL sur Withings = celle dans `.env`

**ngrok change d'URL ?**
→ Normal (version gratuite). Mets à jour Withings + .env à chaque fois

**Pas de pesées ?**
→ Vérifie que tu as des pesées dans les 90 derniers jours

**Plus d'aide ?**
→ Consulte `WITHINGS_READY.md`

---

🎉 **Tout est prêt pour Withings !**

