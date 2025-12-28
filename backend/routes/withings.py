"""
Intégration Withings API - Synchronisation automatique des pesées
Documentation: https://developer.withings.com/api-reference/
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import requests
import os
from datetime import datetime, timedelta
import hmac
import hashlib
import json
from typing import Optional
from dotenv import load_dotenv

# Charger le .env
load_dotenv()

router = APIRouter()

# Configuration Withings (à mettre dans .env)
WITHINGS_CLIENT_ID = os.getenv('WITHINGS_CLIENT_ID', '')
WITHINGS_CLIENT_SECRET = os.getenv('WITHINGS_CLIENT_SECRET', '')
WITHINGS_REDIRECT_URI = os.getenv('WITHINGS_REDIRECT_URI', 'http://localhost:8000/api/withings/callback')
WITHINGS_WEBHOOK_SECRET = os.getenv('WITHINGS_WEBHOOK_SECRET', '')

# Base URLs
WITHINGS_AUTH_URL = "https://account.withings.com/oauth2_user/authorize2"
WITHINGS_TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2"
WITHINGS_API_URL = "https://wbsapi.withings.net"

# Modèles Pydantic
class WithingsTokens(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int  # timestamp
    user_id: str

class WeightMeasurement(BaseModel):
    weight: float
    date: str
    fat_mass_percent: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_mass: Optional[float] = None
    water_percent: Optional[float] = None
    heart_rate: Optional[int] = None

# ============================================
# 1. AUTHENTIFICATION OAUTH2
# ============================================

@router.get("/auth")
async def initiate_withings_auth():
    """
    Étape 1 : Générer l'URL d'authentification Withings
    L'utilisateur sera redirigé vers cette URL pour autoriser l'accès
    
    Frontend:
    1. Appelle cette route
    2. Ouvre l'URL retournée dans une nouvelle fenêtre/iframe
    3. L'utilisateur autorise l'accès
    4. Withings redirige vers /callback
    """
    if not WITHINGS_CLIENT_ID:
        raise HTTPException(status_code=500, detail="WITHINGS_CLIENT_ID non configuré dans .env")
    
    # État aléatoire pour sécurité CSRF (en prod, générer un token unique par user)
    state = "user_unique_state_token"
    
    auth_url = (
        f"{WITHINGS_AUTH_URL}?"
        f"response_type=code&"
        f"client_id={WITHINGS_CLIENT_ID}&"
        f"redirect_uri={WITHINGS_REDIRECT_URI}&"
        f"scope=user.metrics&"
        f"state={state}"
    )
    
    return {
        "auth_url": auth_url,
        "message": "Redirige l'utilisateur vers cette URL pour autoriser l'accès Withings"
    }

@router.get("/callback")
async def withings_callback(code: str, state: str = None):
    """
    Étape 2 : Callback OAuth2
    Withings redirige ici après autorisation de l'utilisateur
    Échange le code contre un access_token
    
    Cette route est appelée automatiquement par Withings
    """
    if not code:
        return HTMLResponse(content="""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Withings - Erreur</title>
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                    }
                    h1 { margin: 0 0 1rem 0; }
                    p { margin: 0.5rem 0; opacity: 0.9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Erreur de connexion</h1>
                    <p>Code d'autorisation manquant</p>
                    <p>Vous pouvez fermer cette fenêtre.</p>
                </div>
                <script>
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
        """)
    
    try:
        # Échanger le code contre un access token
        token_response = requests.post(WITHINGS_TOKEN_URL, data={
            'action': 'requesttoken',
            'grant_type': 'authorization_code',
            'client_id': WITHINGS_CLIENT_ID,
            'client_secret': WITHINGS_CLIENT_SECRET,
            'code': code,
            'redirect_uri': WITHINGS_REDIRECT_URI
        })
        
        if token_response.status_code != 200:
            error_msg = f"Échec d'obtention du token: {token_response.text}"
            return HTMLResponse(content=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Withings - Erreur</title>
                    <style>
                        body {{
                            font-family: system-ui, -apple-system, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }}
                        .container {{
                            text-align: center;
                            padding: 2rem;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 1rem;
                            backdrop-filter: blur(10px);
                            max-width: 500px;
                        }}
                        h1 {{ margin: 0 0 1rem 0; }}
                        p {{ margin: 0.5rem 0; opacity: 0.9; font-size: 0.9rem; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Erreur de connexion</h1>
                        <p>{error_msg}</p>
                        <p style="margin-top: 1rem;">Vous pouvez fermer cette fenêtre.</p>
                    </div>
                    <script>
                        setTimeout(() => window.close(), 5000);
                    </script>
                </body>
                </html>
            """)
        
        token_data = token_response.json()
        
        if token_data.get('status') != 0:
            error_msg = f"Erreur Withings: {token_data.get('error', 'Unknown error')}"
            return HTMLResponse(content=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Withings - Erreur</title>
                    <style>
                        body {{
                            font-family: system-ui, -apple-system, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }}
                        .container {{
                            text-align: center;
                            padding: 2rem;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 1rem;
                            backdrop-filter: blur(10px);
                        }}
                        h1 {{ margin: 0 0 1rem 0; }}
                        p {{ margin: 0.5rem 0; opacity: 0.9; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Erreur de connexion</h1>
                        <p>{error_msg}</p>
                        <p style="margin-top: 1rem;">Vous pouvez fermer cette fenêtre.</p>
                    </div>
                    <script>
                        setTimeout(() => window.close(), 5000);
                    </script>
                </body>
                </html>
            """)
        
        body = token_data.get('body', {})
        
        # Extraire les tokens
        tokens = {
            'access_token': body.get('access_token'),
            'refresh_token': body.get('refresh_token'),
            'expires_at': int(datetime.now().timestamp()) + body.get('expires_in', 3600),
            'user_id': str(body.get('userid'))
        }
        
        # TODO: En production, sauvegarder les tokens dans la DB (chiffrés!)
        # Pour l'instant, on les envoie au frontend via localStorage
        
        # Retourner une page HTML qui stocke les tokens et ferme la fenêtre
        tokens_json = json.dumps(tokens)
        
        return HTMLResponse(content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Withings - Connexion réussie</title>
                <style>
                    body {{
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                    }}
                    .container {{
                        text-align: center;
                        padding: 2rem;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                    }}
                    h1 {{ margin: 0 0 1rem 0; font-size: 2rem; }}
                    p {{ margin: 0.5rem 0; opacity: 0.9; }}
                    .spinner {{
                        width: 40px;
                        height: 40px;
                        margin: 1rem auto;
                        border: 4px solid rgba(255, 255, 255, 0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }}
                    @keyframes spin {{
                        to {{ transform: rotate(360deg); }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Balance Withings connectée!</h1>
                    <div class="spinner"></div>
                    <p>Synchronisation en cours...</p>
                    <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 1rem;">Cette fenêtre va se fermer automatiquement.</p>
                </div>
                <script>
                    // Stocker les tokens dans localStorage
                    try {{
                        localStorage.setItem('withings_tokens', '{tokens_json}');
                        console.log('Tokens Withings stockés avec succès');
                    }} catch (error) {{
                        console.error('Erreur stockage tokens:', error);
                    }}
                    
                    // Fermer la fenêtre après 2 secondes
                    setTimeout(() => {{
                        window.close();
                        // Si window.close() ne fonctionne pas (certains navigateurs)
                        // Rediriger vers l'app
                        if (!window.closed) {{
                            window.location.href = 'http://localhost:5173/health?withings=connected';
                        }}
                    }}, 2000);
                </script>
            </body>
            </html>
        """)
        
    except Exception as e:
        error_msg = str(e)
        return HTMLResponse(content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Withings - Erreur</title>
                <style>
                    body {{
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }}
                    .container {{
                        text-align: center;
                        padding: 2rem;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                        max-width: 500px;
                    }}
                    h1 {{ margin: 0 0 1rem 0; }}
                    p {{ margin: 0.5rem 0; opacity: 0.9; font-size: 0.9rem; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Erreur inattendue</h1>
                    <p>{error_msg}</p>
                    <p style="margin-top: 1rem;">Vous pouvez fermer cette fenêtre.</p>
                </div>
                <script>
                    setTimeout(() => window.close(), 5000);
                </script>
            </body>
            </html>
        """)

@router.post("/refresh-token")
async def refresh_withings_token(refresh_token: str):
    """
    Rafraîchir l'access_token quand il expire (toutes les 3h)
    À appeler automatiquement par le frontend/backend
    """
    token_response = requests.post(WITHINGS_TOKEN_URL, data={
        'action': 'requesttoken',
        'grant_type': 'refresh_token',
        'client_id': WITHINGS_CLIENT_ID,
        'client_secret': WITHINGS_CLIENT_SECRET,
        'refresh_token': refresh_token
    })
    
    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Échec de rafraîchissement du token")
    
    token_data = token_response.json()
    body = token_data.get('body', {})
    
    return {
        "access_token": body.get('access_token'),
        "refresh_token": body.get('refresh_token'),
        "expires_at": int(datetime.now().timestamp()) + body.get('expires_in', 3600)
    }

# ============================================
# 2. SYNCHRONISATION DES DONNÉES
# ============================================

@router.get("/sync")
async def sync_weight_measurements(access_token: str, days_back: int = 30):
    """
    Synchroniser les pesées depuis Withings
    
    Args:
        access_token: Token d'accès Withings
        days_back: Nombre de jours à récupérer (défaut: 30)
    
    Returns:
        Liste des pesées avec poids, masse grasse, masse musculaire, etc.
    """
    # Calculer la date de début (X jours en arrière)
    start_date = datetime.now() - timedelta(days=days_back)
    start_timestamp = int(start_date.timestamp())
    
    # Appel API Withings - Récupérer les mesures
    response = requests.post(
        f"{WITHINGS_API_URL}/measure",
        params={
            'action': 'getmeas'
        },
        headers={
            'Authorization': f'Bearer {access_token}'
        },
        data={
            'startdate': start_timestamp,
            'meastype': '1,6,76,77,88,91',  # 1=poids, 6=masse grasse, 76=muscle, 77=hydration, 88=os, 91=coeur
            'category': 1  # Mesures réelles (pas objectifs)
        }
    )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Échec de récupération des mesures: {response.text}"
        )
    
    data = response.json()
    
    if data.get('status') != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur Withings API: {data.get('error', 'Unknown')}"
        )
    
    # Parser les mesures
    measurements = []
    measure_groups = data.get('body', {}).get('measuregrps', [])
    
    for group in measure_groups:
        timestamp = group.get('date')
        date_str = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
        
        # Extraire chaque type de mesure
        weight = None
        fat_mass_percent = None
        muscle_mass = None
        bone_mass = None
        water_percent = None
        heart_rate = None
        
        for measure in group.get('measures', []):
            mtype = measure.get('type')
            value = measure.get('value')
            unit = measure.get('unit')
            
            # Convertir selon l'unité (Withings utilise des puissances de 10)
            real_value = value * (10 ** unit)
            
            if mtype == 1:  # Poids en kg
                weight = round(real_value, 2)
            elif mtype == 6:  # Masse grasse en %
                fat_mass_percent = round(real_value, 1)
            elif mtype == 76:  # Masse musculaire en kg
                muscle_mass = round(real_value, 2)
            elif mtype == 77:  # Hydratation en %
                water_percent = round(real_value, 1)
            elif mtype == 88:  # Masse osseuse en kg
                bone_mass = round(real_value, 2)
            elif mtype == 91:  # Fréquence cardiaque en bpm
                heart_rate = int(real_value)
        
        if weight:  # Ne créer une entrée que si le poids est présent
            measurements.append(WeightMeasurement(
                weight=weight,
                date=date_str,
                fat_mass_percent=fat_mass_percent,
                muscle_mass=muscle_mass,
                bone_mass=bone_mass,
                water_percent=water_percent,
                heart_rate=heart_rate
            ))
    
    return {
        "status": "success",
        "count": len(measurements),
        "measurements": [m.dict() for m in measurements],
        "message": f"{len(measurements)} pesée(s) synchronisée(s) depuis Withings 🎉"
    }

# ============================================
# 3. WEBHOOK (Synchronisation temps réel)
# ============================================

@router.post("/webhook")
async def withings_webhook(request: Request):
    """
    Webhook Withings - Reçoit une notification à chaque nouvelle pesée
    
    Configuration du webhook:
    1. Va sur https://developer.withings.com/dashboard
    2. Configure l'URL: https://ton-domaine.com/api/withings/webhook
    3. Withings enverra un POST à chaque nouvelle mesure
    
    Sécurité: Vérifie la signature HMAC pour authentifier Withings
    """
    body = await request.body()
    
    # Vérifier la signature si un secret est configuré
    if WITHINGS_WEBHOOK_SECRET:
        signature = request.headers.get('X-Withings-Signature', '')
        expected_signature = hmac.new(
            WITHINGS_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if signature != expected_signature:
            raise HTTPException(status_code=401, detail="Signature webhook invalide")
    
    # Parser le payload
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON invalide")
    
    # Extraire les infos
    userid = data.get('userid')
    appli = data.get('appli')  # 1 = nouvelle mesure de poids
    startdate = data.get('startdate')
    enddate = data.get('enddate')
    
    if appli == 1:  # Nouvelle mesure de poids
        # TODO EN PRODUCTION: Récupérer les tokens de l'utilisateur depuis la DB
        # user_tokens = get_user_tokens_from_db(userid)
        
        # Pour l'instant, on retourne juste un succès
        # Le frontend devra appeler /sync manuellement
        # Ou utiliser un système de WebSocket pour notifier le client
        
        return {
            "status": "notification_received",
            "message": f"Nouvelle pesée détectée pour l'utilisateur {userid}",
            "action": "frontend_should_sync",
            "webhook_data": {
                "userid": userid,
                "startdate": startdate,
                "enddate": enddate
            }
        }
    
    return {"status": "ignored", "message": "Type de notification non géré"}

# ============================================
# 4. DÉCONNEXION
# ============================================

@router.post("/disconnect")
async def disconnect_withings(access_token: str):
    """
    Déconnecter le compte Withings
    Révoque l'accès et supprime les tokens
    """
    # Révoquer le token côté Withings (optionnel)
    # Note: Withings n'a pas d'endpoint de révocation officiel
    # Il faut supprimer les tokens côté serveur
    
    # TODO: Supprimer les tokens de la DB
    
    return {
        "status": "success",
        "message": "Balance Withings déconnectée"
    }

# ============================================
# 5. STATUT DE LA CONNEXION
# ============================================

@router.get("/status")
async def withings_connection_status():
    """
    Vérifier si Withings est connecté et si le token est valide
    """
    # TODO: Vérifier en DB si des tokens existent et sont valides
    
    return {
        "connected": False,
        "message": "Aucune balance connectée",
        "last_sync": None
    }


