#!/usr/bin/env python3
"""
Test complet du système d'archivage SQLite pour les LANGUES
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(__file__))

from database import db
from datetime import datetime, timedelta

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def test_language_message_archiving():
    """Test 1: Archivage messages de langues"""
    print_section("Test 1: Archivage Messages Langues")
    
    course_id = "test-spanish-001"
    user_id = "test-user-lang"
    
    # Créer 60 messages de conversation
    messages = []
    base_time = int(time.time() * 1000)
    
    for i in range(60):
        messages.append({
            'id': f'lang-msg-{i:03d}',
            'role': 'user' if i % 2 == 0 else 'assistant',
            'content': f'Mensaje de prueba número {i}' if i % 2 == 0 else f'Esta es la respuesta número {i}',
            'translation': f'Message de test numéro {i}' if i % 2 == 0 else f'C\'est la réponse numéro {i}',
            'timestamp': base_time - (60 - i) * 60000
        })
    
    try:
        # Sauvegarde bulk
        saved_count = db.save_language_messages_bulk(course_id, user_id, messages)
        print(f"✅ Sauvegardé {saved_count}/60 messages de langue")
        
        # Archiver (garder 50 récents)
        archived_count = db.archive_old_language_messages(course_id, keep_recent=50)
        print(f"📦 Archivé {archived_count} messages")
        
        # Vérifier stats
        stats = db.get_language_message_stats(course_id)
        print(f"📊 Stats: {stats['active']} actifs, {stats['archived']} archivés, {stats['total']} total")
        
        # Charger récents
        recent = db.get_recent_language_messages(course_id, limit=50)
        print(f"📥 Chargé {len(recent)} messages récents")
        
        # Charger archivés
        archived = db.get_archived_language_messages(course_id, limit=20)
        print(f"📦 Chargé {len(archived)} messages archivés")
        
        return stats['active'] == 50 and archived_count == 10
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_vocabulary_management():
    """Test 2: Gestion du vocabulaire"""
    print_section("Test 2: Gestion Vocabulaire")
    
    course_id = "test-spanish-001"
    user_id = "test-user-lang"
    
    # Ajouter 20 mots
    words = [
        {'word': 'hola', 'translation': 'bonjour', 'pronunciation': 'ola'},
        {'word': 'gracias', 'translation': 'merci', 'pronunciation': 'grasias'},
        {'word': 'adiós', 'translation': 'au revoir', 'pronunciation': 'adios'},
        {'word': 'por favor', 'translation': 's\'il vous plaît', 'pronunciation': 'por fabor'},
        {'word': 'buenos días', 'translation': 'bonne journée', 'pronunciation': 'buenos dias'},
        {'word': 'buenas noches', 'translation': 'bonne nuit', 'pronunciation': 'buenas noches'},
        {'word': 'sí', 'translation': 'oui', 'pronunciation': 'si'},
        {'word': 'no', 'translation': 'non', 'pronunciation': 'no'},
        {'word': 'agua', 'translation': 'eau', 'pronunciation': 'agua'},
        {'word': 'comida', 'translation': 'nourriture', 'pronunciation': 'komida'},
        {'word': 'casa', 'translation': 'maison', 'pronunciation': 'kasa'},
        {'word': 'calle', 'translation': 'rue', 'pronunciation': 'kaye'},
        {'word': 'tiempo', 'translation': 'temps', 'pronunciation': 'tiempo'},
        {'word': 'amigo', 'translation': 'ami', 'pronunciation': 'amigo'},
        {'word': 'libro', 'translation': 'livre', 'pronunciation': 'libro'},
        {'word': 'mesa', 'translation': 'table', 'pronunciation': 'mesa'},
        {'word': 'silla', 'translation': 'chaise', 'pronunciation': 'siya'},
        {'word': 'ventana', 'translation': 'fenêtre', 'pronunciation': 'bentana'},
        {'word': 'puerta', 'translation': 'porte', 'pronunciation': 'puerta'},
        {'word': 'coche', 'translation': 'voiture', 'pronunciation': 'kotche'}
    ]
    
    try:
        added_count = 0
        for word_data in words:
            word_data['example'] = f"Example with {word_data['word']}"
            word_data['context'] = 'conversation'
            success = db.add_vocabulary_word(course_id, user_id, word_data)
            if success:
                added_count += 1
        
        print(f"✅ Ajouté {added_count}/{len(words)} mots")
        
        # Charger vocabulaire
        vocabulary = db.get_vocabulary(course_id, user_id)
        print(f"📚 Vocabulaire total: {len(vocabulary)} mots")
        
        # Charger mots à réviser
        due_words = db.get_due_vocabulary(course_id, user_id)
        print(f"📝 Mots à réviser: {len(due_words)} mots")
        
        # Stats
        stats = db.get_vocabulary_stats(course_id, user_id)
        print(f"📊 Stats: {stats['total']} total, {stats['avgMastery']}% maîtrise moyenne")
        print(f"   {stats['mastered']} maîtrisés, {stats['dueToday']} à réviser aujourd'hui")
        
        return added_count == len(words) and len(vocabulary) == len(words)
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_spaced_repetition():
    """Test 3: Spaced Repetition (SM-2)"""
    print_section("Test 3: Spaced Repetition (SM-2)")
    
    course_id = "test-spanish-001"
    user_id = "test-user-lang"
    
    try:
        # Charger les mots à réviser
        due_words = db.get_due_vocabulary(course_id, user_id)
        
        if not due_words:
            print("⚠️ Aucun mot à réviser")
            return True
        
        # Simuler des révisions avec différentes qualités
        reviews = [
            (due_words[0]['id'], 5),  # Perfect
            (due_words[1]['id'], 4) if len(due_words) > 1 else (due_words[0]['id'], 4),  # Good
            (due_words[2]['id'], 3) if len(due_words) > 2 else (due_words[0]['id'], 3),  # OK
            (due_words[3]['id'], 2) if len(due_words) > 3 else (due_words[0]['id'], 2),  # Hard
        ]
        
        for word_id, quality in reviews:
            success = db.update_vocabulary_review(word_id, quality)
            if success:
                print(f"✅ Révision enregistrée: quality={quality}")
        
        # Vérifier que les intervalles ont changé
        vocabulary = db.get_vocabulary(course_id, user_id, limit=5)
        print(f"\n📊 Intervalles de révision:")
        for word in vocabulary[:4]:
            print(f"   {word['word']}: prochain dans {word['interval']} jours")
        
        # Vérifier les stats après révisions
        stats = db.get_vocabulary_stats(course_id, user_id)
        print(f"\n📈 Stats après révisions:")
        print(f"   Total reviews: {stats['totalReviews']}")
        print(f"   Maîtrise moyenne: {stats['avgMastery']}%")
        
        return stats['totalReviews'] >= 4
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def cleanup_language_tests():
    """Nettoyage des données de test"""
    print_section("Nettoyage")
    
    try:
        conn = db._get_connection()
        cursor = conn.cursor()
        
        # Supprimer messages de test
        cursor.execute("DELETE FROM language_messages WHERE course_id = 'test-spanish-001'")
        msg_deleted = cursor.rowcount
        
        # Supprimer vocabulaire de test
        cursor.execute("DELETE FROM vocabulary WHERE course_id = 'test-spanish-001'")
        vocab_deleted = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🧹 {msg_deleted} messages supprimés")
        print(f"🧹 {vocab_deleted} mots de vocabulaire supprimés")
        
    except Exception as e:
        print(f"⚠️ Erreur nettoyage: {e}")

def main():
    print("\n" + "="*60)
    print("🚀 TEST SYSTÈME D'ARCHIVAGE LANGUES SQLite - NewMars")
    print("="*60)
    
    try:
        results = []
        
        # Exécuter tous les tests
        results.append(("Archivage messages langues", test_language_message_archiving()))
        results.append(("Gestion vocabulaire", test_vocabulary_management()))
        results.append(("Spaced Repetition SM-2", test_spaced_repetition()))
        
        # Nettoyage
        cleanup_language_tests()
        
        # Résultats finaux
        print_section("RÉSULTATS FINAUX")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {name}")
        
        print(f"\n🎯 Score: {passed}/{total} tests réussis")
        
        if passed == total:
            print("\n🎉 SUCCÈS TOTAL ! Le système de langues avec SQLite fonctionne parfaitement.")
            print("✅ Prêt pour la production !")
            return 0
        else:
            print("\n⚠️ Certains tests ont échoué. Vérifier l'implémentation.")
            return 1
            
    except Exception as e:
        print(f"\n❌ Erreur critique lors des tests: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

