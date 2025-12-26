"""
Script de test pour l'interleaving
Teste le système avec plusieurs topics
"""
import asyncio
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"


def test_single_topic_session():
    """Test avec un seul topic (pas d'interleaving)"""
    print("\n" + "="*60)
    print("TEST 1: Session avec UN seul topic")
    print("="*60)
    
    # Démarrer une session
    response = requests.post(f"{BASE_URL}/learning/start-session", json={
        "course_id": "python-basics",
        "topic_id": "variables",
        "use_interleaving": True
    })
    
    data = response.json()
    print(f"✓ Session créée: {data['session_id']}")
    print(f"  Interleaving activé: {data['interleaving_enabled']}")
    print(f"  Topics: {data['topics']}")
    
    assert data['interleaving_enabled'] == False, "Interleaving devrait être désactivé avec 1 seul topic"
    return data['session_id']


def test_multi_topic_session():
    """Test avec plusieurs topics (interleaving activé)"""
    print("\n" + "="*60)
    print("TEST 2: Session avec PLUSIEURS topics (interleaving)")
    print("="*60)
    
    # Démarrer une session avec 3 topics
    response = requests.post(f"{BASE_URL}/learning/start-session", json={
        "course_id": "python-basics",
        "topic_ids": ["variables", "loops", "functions"],
        "use_interleaving": True
    })
    
    data = response.json()
    print(f"✓ Session créée: {data['session_id']}")
    print(f"  Interleaving activé: {data['interleaving_enabled']}")
    print(f"  Topics sélectionnés: {data['topics']}")
    print(f"  Boost de rétention estimé: +{data['estimated_retention_boost']}%")
    
    assert data['interleaving_enabled'] == True, "Interleaving devrait être activé"
    assert len(data['topics']) >= 2, "Au moins 2 topics devraient être sélectionnés"
    
    return data['session_id']


def test_question_alternation(session_id: str, num_questions: int = 6):
    """Test l'alternance des questions entre topics"""
    print("\n" + "="*60)
    print(f"TEST 3: Alternance de {num_questions} questions")
    print("="*60)
    
    topic_sequence = []
    
    for i in range(num_questions):
        # Obtenir une question
        response = requests.get(f"{BASE_URL}/learning/next-question/{session_id}")
        
        if response.status_code != 200:
            print(f"❌ Erreur: {response.json()}")
            break
        
        data = response.json()
        current_topic = data.get('current_topic_id', 'unknown')
        next_topic = data.get('next_topic_id', 'unknown')
        
        topic_sequence.append(current_topic)
        
        print(f"\nQuestion {i+1}:")
        print(f"  Topic actuel: {current_topic}")
        print(f"  Difficulté: {data['difficulty']}")
        print(f"  Maîtrise: {data['mastery_level']}%")
        print(f"  Prochain topic: {next_topic}")
        print(f"  Question: {data['question_text'][:80]}...")
        
        # Soumettre une réponse (alternance correct/incorrect)
        is_correct = i % 2 == 0
        answer_response = requests.post(
            f"{BASE_URL}/learning/submit-answer/{session_id}",
            json={
                "question_id": data['question_id'],
                "user_answer": "correct" if is_correct else "wrong",
                "time_taken": 30
            }
        )
        
        answer_data = answer_response.json()
        print(f"  Réponse: {'✓ Correct' if answer_data['is_correct'] else '✗ Incorrect'}")
        print(f"  XP gagné: +{answer_data['xp_earned']}")
        print(f"  Changement maîtrise: {answer_data['mastery_change']:+d}")
    
    print("\n" + "-"*60)
    print("Séquence des topics:")
    print(f"  {' → '.join(topic_sequence)}")
    
    # Vérifier qu'il y a bien eu alternance
    unique_topics = set(topic_sequence)
    print(f"\nTopics différents pratiqués: {len(unique_topics)}")
    
    if len(unique_topics) > 1:
        print("✓ Interleaving fonctionnel: plusieurs topics alternés")
    else:
        print("⚠ Attention: un seul topic pratiqué")
    
    return topic_sequence


def test_progress_tracking(session_id: str):
    """Test le tracking de progression avec interleaving"""
    print("\n" + "="*60)
    print("TEST 4: Suivi de progression")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/learning/progress/{session_id}")
    data = response.json()
    
    print(f"Session ID: {data['session_id']}")
    print(f"Questions répondues: {data['questions_answered']}")
    print(f"Précision: {data['accuracy']}%")
    print(f"XP total: {data['xp_earned']}")
    print(f"Streak actuel: {data['current_streak']}")
    print(f"Interleaving: {'✓ Activé' if data['interleaving_enabled'] else '✗ Désactivé'}")
    
    if data['interleaving_enabled']:
        print(f"Boost de rétention: +{data['estimated_retention_boost']}%")
    
    print("\nProgression par topic:")
    for topic in data.get('topics', []):
        print(f"  • {topic['topic_id']}:")
        print(f"    - Maîtrise: {topic['mastery_level']}%")
        print(f"    - Success rate: {topic['success_rate']}%")
        print(f"    - Questions dans session: {topic['questions_in_session']}")
        print(f"    - Prochaine révision dans: {topic['next_review_in_days']} jours")


def test_mastery_stats():
    """Test les stats globales de maîtrise"""
    print("\n" + "="*60)
    print("TEST 5: Stats globales")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/learning/demo-stats")
    data = response.json()
    
    print(f"Nombre de sessions: {data['total_sessions']}")
    
    print("\nMaîtrise par utilisateur:")
    for user_id, topics in data['user_mastery'].items():
        print(f"\n{user_id}:")
        for topic_id, stats in topics.items():
            print(f"  • {topic_id}:")
            print(f"    - Maîtrise: {stats['mastery_level']}%")
            print(f"    - Success rate: {stats['success_rate']}%")


def main():
    """Exécuter tous les tests"""
    print("\n" + "🔬 " + "="*58)
    print("  TESTS D'INTERLEAVING - Système d'apprentissage adaptatif")
    print("="*60 + "\n")
    
    try:
        # Test 1: Session sans interleaving
        session_1 = test_single_topic_session()
        
        # Test 2: Session avec interleaving
        session_2 = test_multi_topic_session()
        
        # Test 3: Alternance des questions
        topic_sequence = test_question_alternation(session_2, num_questions=8)
        
        # Test 4: Progression
        test_progress_tracking(session_2)
        
        # Test 5: Stats globales
        test_mastery_stats()
        
        print("\n" + "="*60)
        print("✅ TOUS LES TESTS RÉUSSIS")
        print("="*60 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERREUR: Impossible de se connecter au serveur")
        print("Assure-toi que le backend est lancé sur http://localhost:8000")
        print("\nPour lancer le backend:")
        print("  cd backend")
        print("  python main.py")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()






