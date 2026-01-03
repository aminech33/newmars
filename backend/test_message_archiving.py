#!/usr/bin/env python3
"""
Test complet du système d'archivage des messages dans SQLite
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(__file__))

from database import db
from datetime import datetime

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def test_database_structure():
    """Test 1: Vérifier la structure de la base de données"""
    print_section("Test 1: Structure Base de Données")
    
    try:
        conn = db._get_connection()
        cursor = conn.cursor()
        
        # Vérifier que la table course_messages existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='course_messages'
        """)
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            print(f"✅ Table 'course_messages' existe")
            
            # Vérifier les colonnes
            cursor.execute("PRAGMA table_info(course_messages)")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"📊 Colonnes ({len(columns)}): {', '.join(columns)}")
            
            # Vérifier les index
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND tbl_name='course_messages'
            """)
            indexes = [row[0] for row in cursor.fetchall()]
            print(f"🔍 Index ({len(indexes)}): {', '.join(indexes)}")
        else:
            print(f"❌ Table 'course_messages' n'existe pas!")
        
        conn.close()
        return table_exists
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_save_single_message():
    """Test 2: Sauvegarder un message unique"""
    print_section("Test 2: Sauvegarde Message Unique")
    
    course_id = "test-course-archive-001"
    user_id = "test-user-archive"
    
    message = {
        'id': 'msg-test-001',
        'role': 'user',
        'content': 'Ceci est un message de test pour SQLite',
        'timestamp': int(time.time() * 1000),
        'codeBlocks': [],
        'liked': False,
        'savedAsNote': False
    }
    
    try:
        success = db.save_message(course_id, user_id, message)
        
        if success:
            print(f"✅ Message sauvegardé avec succès")
            
            # Vérifier qu'il est bien là
            stats = db.get_message_stats(course_id)
            print(f"📊 Stats: {stats['total']} total, {stats['active']} actifs")
            
            return stats['total'] >= 1
        else:
            print(f"❌ Échec de la sauvegarde")
            return False
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_save_bulk_messages():
    """Test 3: Sauvegarde en bulk (60 messages)"""
    print_section("Test 3: Sauvegarde Bulk (60 messages)")
    
    course_id = "test-course-archive-001"
    user_id = "test-user-archive"
    
    # Créer 60 messages
    messages = []
    base_time = int(time.time() * 1000)
    
    for i in range(60):
        messages.append({
            'id': f'msg-bulk-{i:03d}',
            'role': 'user' if i % 2 == 0 else 'assistant',
            'content': f'Message de test numéro {i} - {"Question" if i % 2 == 0 else "Réponse"}',
            'timestamp': base_time - (60 - i) * 60000,  # Messages espacés d'1 minute
            'codeBlocks': ['console.log("test")'] if i % 5 == 0 else [],
            'liked': i % 10 == 0,
            'savedAsNote': False
        })
    
    try:
        saved_count = db.save_messages_bulk(course_id, user_id, messages)
        
        print(f"✅ Sauvegardé {saved_count}/60 messages")
        
        # Vérifier les stats
        stats = db.get_message_stats(course_id)
        print(f"📊 Stats après bulk:")
        print(f"   - Total: {stats['total']}")
        print(f"   - Actifs: {stats['active']}")
        print(f"   - Archivés: {stats['archived']}")
        
        return saved_count == 60
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_archive_old_messages():
    """Test 4: Archivage automatique"""
    print_section("Test 4: Archivage Automatique")
    
    course_id = "test-course-archive-001"
    
    try:
        # Stats avant archivage
        stats_before = db.get_message_stats(course_id)
        print(f"📊 Avant archivage:")
        print(f"   - Total: {stats_before['total']}")
        print(f"   - Actifs: {stats_before['active']}")
        print(f"   - Archivés: {stats_before['archived']}")
        
        # Archiver (garder 50 récents)
        archived_count = db.archive_old_messages(course_id, keep_recent=50)
        
        print(f"\n📦 Messages archivés: {archived_count}")
        
        # Stats après archivage
        stats_after = db.get_message_stats(course_id)
        print(f"\n📊 Après archivage:")
        print(f"   - Total: {stats_after['total']}")
        print(f"   - Actifs: {stats_after['active']}")
        print(f"   - Archivés: {stats_after['archived']}")
        
        # Vérifications
        if stats_after['active'] == 50:
            print(f"\n✅ Archivage correct: 50 messages restent actifs")
            if archived_count > 0:
                print(f"✅ {archived_count} messages ont été archivés")
            return True
        else:
            print(f"\n⚠️ Résultats inattendus: {stats_after['active']} actifs au lieu de 50")
            return False
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_load_recent_messages():
    """Test 5: Chargement des messages récents"""
    print_section("Test 5: Chargement Messages Récents")
    
    course_id = "test-course-archive-001"
    
    try:
        # Charger les 50 messages récents
        recent = db.get_recent_messages(course_id, limit=50)
        
        print(f"📥 Messages récents chargés: {len(recent)}")
        
        if recent:
            print(f"\n📝 Premier message (le plus ancien):")
            print(f"   - ID: {recent[0]['id']}")
            print(f"   - Role: {recent[0]['role']}")
            print(f"   - Content: {recent[0]['content'][:50]}...")
            
            print(f"\n📝 Dernier message (le plus récent):")
            print(f"   - ID: {recent[-1]['id']}")
            print(f"   - Role: {recent[-1]['role']}")
            print(f"   - Content: {recent[-1]['content'][:50]}...")
            
            # Vérifier qu'ils sont dans l'ordre chronologique
            timestamps = [msg['timestamp'] for msg in recent]
            is_sorted = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
            
            if is_sorted:
                print(f"\n✅ Messages triés chronologiquement")
            else:
                print(f"\n⚠️ Messages pas dans l'ordre chronologique")
        
        return len(recent) == 50
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_load_archived_messages():
    """Test 6: Chargement des messages archivés"""
    print_section("Test 6: Chargement Messages Archivés")
    
    course_id = "test-course-archive-001"
    
    try:
        # Charger les messages archivés (pagination)
        archived = db.get_archived_messages(course_id, limit=20, offset=0)
        
        print(f"📦 Messages archivés chargés: {len(archived)}")
        
        if archived:
            print(f"\n📝 Premier message archivé:")
            print(f"   - ID: {archived[0]['id']}")
            print(f"   - Role: {archived[0]['role']}")
            print(f"   - Content: {archived[0]['content'][:50]}...")
            print(f"   - Archivé le: {archived[0].get('archived_at', 'N/A')}")
            
            # Test pagination
            archived_page2 = db.get_archived_messages(course_id, limit=5, offset=5)
            print(f"\n📄 Test pagination (offset=5, limit=5): {len(archived_page2)} messages")
        
        return len(archived) > 0
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_message_stats():
    """Test 7: Statistiques complètes"""
    print_section("Test 7: Statistiques Messages")
    
    course_id = "test-course-archive-001"
    
    try:
        stats = db.get_message_stats(course_id)
        
        print(f"📊 Statistiques complètes:")
        print(f"   - Total messages: {stats['total']}")
        print(f"   - Messages actifs: {stats['active']}")
        print(f"   - Messages archivés: {stats['archived']}")
        
        # Vérifier la cohérence
        if stats['total'] == stats['active'] + stats['archived']:
            print(f"\n✅ Cohérence vérifiée: total = actifs + archivés")
            return True
        else:
            print(f"\n⚠️ Incohérence: {stats['total']} ≠ {stats['active']} + {stats['archived']}")
            return False
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return False

def cleanup():
    """Nettoyage des données de test"""
    print_section("Nettoyage")
    
    try:
        conn = db._get_connection()
        cursor = conn.cursor()
        
        # Supprimer tous les messages de test
        cursor.execute("""
            DELETE FROM course_messages 
            WHERE course_id = 'test-course-archive-001'
        """)
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🧹 {deleted_count} messages de test supprimés")
        
    except Exception as e:
        print(f"⚠️ Erreur nettoyage: {e}")

def main():
    print("\n" + "="*60)
    print("🚀 TEST SYSTÈME D'ARCHIVAGE SQLite - NewMars")
    print("="*60)
    
    try:
        results = []
        
        # Exécuter tous les tests
        results.append(("Structure DB", test_database_structure()))
        results.append(("Sauvegarde unique", test_save_single_message()))
        results.append(("Sauvegarde bulk", test_save_bulk_messages()))
        results.append(("Archivage auto", test_archive_old_messages()))
        results.append(("Chargement récents", test_load_recent_messages()))
        results.append(("Chargement archivés", test_load_archived_messages()))
        results.append(("Statistiques", test_message_stats()))
        
        # Nettoyage
        cleanup()
        
        # Résultats finaux
        print_section("RÉSULTATS FINAUX")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {name}")
        
        print(f"\n🎯 Score: {passed}/{total} tests réussis")
        
        if passed == total:
            print("\n🎉 SUCCÈS TOTAL ! Le système d'archivage SQLite fonctionne parfaitement.")
            print("✅ Prêt pour la production !")
            return 0
        elif passed >= total * 0.7:
            print("\n⚠️ Tests majoritairement réussis, quelques ajustements nécessaires.")
            return 1
        else:
            print("\n❌ Plusieurs tests ont échoué. Vérifier l'implémentation.")
            return 1
            
    except Exception as e:
        print(f"\n❌ Erreur critique lors des tests: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

