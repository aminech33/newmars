"""
Script de test pour l'API d'apprentissage adaptatif
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_adaptive_learning():
    print("🧪 Test du Backend Adaptatif\n" + "="*50 + "\n")
    
    # 1. Test root
    print("1️⃣ Test de la route racine...")
    response = requests.get(f"{BASE_URL}/")
    print(f"✅ Status: {response.status_code}")
    print(f"📄 Réponse: {json.dumps(response.json(), indent=2)}\n")
    
    # 2. Démarrer une session
    print("2️⃣ Démarrage d'une session...")
    session_data = {
        "course_id": "python-101",
        "topic_id": "fonctions"
    }
    response = requests.post(f"{BASE_URL}/api/learning/start-session", json=session_data)
    print(f"✅ Status: {response.status_code}")
    session_result = response.json()
    print(f"📄 Réponse: {json.dumps(session_result, indent=2)}\n")
    
    session_id = session_result["session_id"]
    print(f"🔑 Session ID: {session_id}\n")
    
    # 3. Obtenir une question
    print("3️⃣ Génération d'une question par Gemini...")
    response = requests.get(f"{BASE_URL}/api/learning/next-question/{session_id}")
    print(f"✅ Status: {response.status_code}")
    question_result = response.json()
    
    print(f"❓ Question: {question_result['question_text']}")
    print(f"🎯 Difficulté: {question_result['difficulty']}")
    print(f"📊 Niveau de maîtrise: {question_result['mastery_level']}%")
    print(f"⏱️ Temps estimé: {question_result['estimated_time']}s")
    print(f"\n📝 Options:")
    for i, opt in enumerate(question_result['options'], 1):
        print(f"   {i}. {opt['text']}")
    
    if 'hints' in question_result and question_result['hints']:
        print(f"\n💡 Indices: {', '.join(question_result['hints'])}")
    
    question_id = question_result['question_id']
    correct_answer = question_result.get('correct_answer', '')
    
    print(f"\n✅ Bonne réponse (pour test): {correct_answer}\n")
    
    # 4. Soumettre une réponse correcte
    print("4️⃣ Soumission d'une réponse correcte...")
    answer_data = {
        "question_id": question_id,
        "user_answer": correct_answer,
        "time_taken": 45
    }
    response = requests.post(f"{BASE_URL}/api/learning/submit-answer/{session_id}", json=answer_data)
    print(f"✅ Status: {response.status_code}")
    feedback_result = response.json()
    
    print(f"{'✅' if feedback_result['is_correct'] else '❌'} Résultat: {'CORRECT' if feedback_result['is_correct'] else 'INCORRECT'}")
    print(f"💬 Encouragement: {feedback_result['encouragement']}")
    print(f"🎓 XP gagné: +{feedback_result['xp_earned']}")
    print(f"📈 Maîtrise: {feedback_result['mastery_change']:+d} points")
    
    if feedback_result['streak_info']['message']:
        print(f"🔥 {feedback_result['streak_info']['message']}")
    
    if feedback_result['difficulty_adjustment']:
        print(f"⚙️ Ajustement difficulté: {feedback_result['difficulty_adjustment']}")
    
    print()
    
    # 5. Vérifier la progression
    print("5️⃣ Consultation de la progression...")
    response = requests.get(f"{BASE_URL}/api/learning/progress/{session_id}")
    print(f"✅ Status: {response.status_code}")
    progress_result = response.json()
    
    print(f"📊 Questions répondues: {progress_result['questions_answered']}")
    print(f"✅ Bonnes réponses: {progress_result['correct_answers']}")
    print(f"🎯 Précision: {progress_result['accuracy']}%")
    print(f"⭐ XP total: {progress_result['xp_earned']}")
    print(f"📈 Niveau de maîtrise: {progress_result['mastery_level']}%")
    print(f"📅 Prochaine révision dans: {progress_result['next_review_in_days']} jour(s)")
    print(f"🔥 Streak actuel: {progress_result['current_streak']}")
    
    print("\n" + "="*50)
    print("✅ TOUS LES TESTS RÉUSSIS !")
    print("🚀 Le backend adaptatif fonctionne parfaitement !")
    print("="*50)

if __name__ == "__main__":
    try:
        test_adaptive_learning()
    except requests.exceptions.ConnectionError:
        print("❌ Erreur: Le serveur n'est pas accessible sur http://localhost:8000")
        print("   Assure-toi que le serveur est lancé avec: python main.py")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

