#!/usr/bin/env python3
"""
Script de test rapide pour vérifier la persistence SQLite
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import db
from datetime import datetime

def test_sessions():
    print("\n🧪 Test 1: Sessions")
    print("=" * 50)
    
    # Créer une session test
    test_session = {
        'id': 'test-session-123',
        'course_id': 'python-basics',
        'user_id': 'test-user',
        'topic_ids': ['variables', 'functions'],
        'current_topic_idx': 0,
        'started_at': datetime.now().isoformat(),
        'questions_answered': 5,
        'correct_answers': 4,
        'xp_earned': 100,
        'question_history': ['variables', 'variables', 'functions'],
        'interleaving_enabled': True,
        'switch_frequency': 2,
        'estimated_benefit': 12.5,
        'streak': 3
    }
    
    # Sauvegarder
    success = db.save_session(test_session)
    print(f"✅ Session sauvegardée: {success}")
    
    # Récupérer
    retrieved = db.get_session('test-session-123')
    print(f"✅ Session récupérée: {retrieved is not None}")
    print(f"   XP earned: {retrieved['xp_earned']}")
    print(f"   Interleaving: {retrieved['interleaving_enabled']}")
    
    return success and retrieved is not None

def test_mastery():
    print("\n🧪 Test 2: Topic Mastery")
    print("=" * 50)
    
    # Créer mastery test
    test_mastery = {
        'mastery_level': 75,
        'ease_factor': 2.8,
        'interval': 5,
        'repetitions': 3,
        'success_rate': 0.85,
        'consecutive_skips': 0,
        'total_attempts': 10,
        'correct_attempts': 8,
        'last_practiced': datetime.now().isoformat(),
        'next_review': '2024-12-30',
        'concepts': {'lists': 90, 'dictionaries': 70}
    }
    
    # Sauvegarder
    success = db.save_mastery('test-user', 'python-basics', test_mastery)
    print(f"✅ Mastery sauvegardée: {success}")
    
    # Récupérer
    retrieved = db.get_mastery('test-user', 'python-basics')
    print(f"✅ Mastery récupérée: {retrieved is not None}")
    print(f"   Niveau: {retrieved['mastery_level']}%")
    print(f"   Success rate: {retrieved['success_rate'] * 100}%")
    
    return success and retrieved is not None

def test_streaks():
    print("\n🧪 Test 3: Review Streaks")
    print("=" * 50)
    
    # Créer streak
    streak_info = db.update_streak('test-user', 'python-basics')
    print(f"✅ Streak créé:")
    print(f"   Current: {streak_info['current_streak']} jours 🔥")
    print(f"   Longest: {streak_info['longest_streak']} jours")
    print(f"   Total reviews: {streak_info['total_reviews']}")
    
    # Update streak (simulation jour suivant)
    streak_info2 = db.update_streak('test-user', 'python-basics')
    print(f"✅ Streak après révision:")
    print(f"   Current: {streak_info2['current_streak']} jours")
    
    return streak_info['current_streak'] >= 1

def test_all_queries():
    print("\n🧪 Test 4: Queries Multiples")
    print("=" * 50)
    
    # Get all sessions
    all_sessions = db.get_all_sessions('test-user')
    print(f"✅ Sessions totales: {len(all_sessions)}")
    
    # Get all mastery
    all_mastery = db.get_all_mastery('test-user')
    print(f"✅ Topics avec mastery: {len(all_mastery)}")
    
    # Get streak
    streak = db.get_streak('test-user', 'python-basics')
    print(f"✅ Streak actuel: {streak['current_streak']} jours")
    
    return True

def cleanup():
    print("\n🧹 Nettoyage")
    print("=" * 50)
    
    # Supprimer session test
    success = db.delete_session('test-session-123')
    print(f"✅ Session test supprimée: {success}")

def main():
    print("\n🚀 Tests Persistence SQLite - NewMars Learning")
    print("=" * 50)
    
    try:
        results = []
        
        results.append(("Sessions", test_sessions()))
        results.append(("Mastery", test_mastery()))
        results.append(("Streaks", test_streaks()))
        results.append(("Queries", test_all_queries()))
        
        cleanup()
        
        # Résultats
        print("\n📊 Résultats des Tests")
        print("=" * 50)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {name}")
        
        print(f"\n🎯 Score: {passed}/{total} tests réussis")
        
        if passed == total:
            print("\n🎉 Tous les tests sont passés! La persistence fonctionne parfaitement.")
            return 0
        else:
            print("\n⚠️ Certains tests ont échoué. Vérifier la configuration.")
            return 1
            
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())



