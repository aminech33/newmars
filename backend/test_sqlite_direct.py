#!/usr/bin/env python3
"""
🧪 TEST MANUEL SQLite - Vérification directe end-to-end

Teste la persistence SQLite de manière simple et directe
"""

import sqlite3
from datetime import datetime
import json

DB_PATH = "learning.db"

print("\n" + "="*70)
print("🧪 TEST MANUEL SQLITE - End-to-End")
print("="*70 + "\n")

# Connexion
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

TEST_COURSE = "test-manual-sqlite"

# ═══════════════════════════════════════════════════════════════
# TEST 1: Créer un concept
# ═══════════════════════════════════════════════════════════════

print("📝 TEST 1: Créer un concept dans SQLite")
print("-" * 70)

# Supprimer les anciens
cursor.execute("DELETE FROM concepts WHERE course_id = ?", (TEST_COURSE,))
conn.commit()
print(f"🧹 Anciens concepts nettoyés")

# Créer un nouveau concept
cursor.execute("""
    INSERT INTO concepts 
    (concept, category, definition, keywords, course_id, added_at, times_referenced, mastery_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "variables_test",
    "basics",
    "Test concept",
    json.dumps(["test", "var"]),
    TEST_COURSE,
    datetime.now().isoformat(),
    0,
    0
))
conn.commit()
concept_id = cursor.lastrowid

print(f"✅ Concept créé: ID = {concept_id}")

# Vérifier
cursor.execute("SELECT * FROM concepts WHERE id = ?", (concept_id,))
concept = dict(cursor.fetchone())
print(f"✅ Vérification: mastery = {concept['mastery_level']}%, times_ref = {concept['times_referenced']}")

# ═══════════════════════════════════════════════════════════════
# TEST 2: Mettre à jour mastery (Quiz)
# ═══════════════════════════════════════════════════════════════

print(f"\n🎯 TEST 2: Update mastery (simulation quiz)")
print("-" * 70)

old_mastery = concept['mastery_level']
new_mastery = old_mastery + 15  # Quiz boost

cursor.execute("""
    UPDATE concepts
    SET mastery_level = ?,
        last_referenced = ?
    WHERE id = ?
""", (new_mastery, datetime.now().isoformat(), concept_id))
conn.commit()

print(f"✅ Mastery updated: {old_mastery}% → {new_mastery}%")

# Vérifier
cursor.execute("SELECT mastery_level FROM concepts WHERE id = ?", (concept_id,))
updated_mastery = cursor.fetchone()['mastery_level']
assert updated_mastery == new_mastery, f"❌ Mastery pas mise à jour: {updated_mastery} != {new_mastery}"
print(f"✅ Vérification DB: mastery = {updated_mastery}%")

# ═══════════════════════════════════════════════════════════════
# TEST 3: Incrémenter references (Usage tracking)
# ═══════════════════════════════════════════════════════════════

print(f"\n💬 TEST 3: Increment references (simulation usage)")
print("-" * 70)

cursor.execute("SELECT times_referenced FROM concepts WHERE id = ?", (concept_id,))
old_refs = cursor.fetchone()['times_referenced']

cursor.execute("""
    UPDATE concepts
    SET times_referenced = times_referenced + 1,
        mastery_level = mastery_level + 5,
        last_referenced = ?
    WHERE id = ?
""", (datetime.now().isoformat(), concept_id))
conn.commit()

print(f"✅ References: {old_refs} → {old_refs + 1}")
print(f"✅ Mastery: {new_mastery}% → {new_mastery + 5}%")

# Vérifier
cursor.execute("SELECT times_referenced, mastery_level FROM concepts WHERE id = ?", (concept_id,))
row = cursor.fetchone()
assert row['times_referenced'] == old_refs + 1, f"❌ References pas incrémentées"
print(f"✅ Vérification DB: refs = {row['times_referenced']}, mastery = {row['mastery_level']}%")

# ═══════════════════════════════════════════════════════════════
# TEST 4: Statistiques
# ═══════════════════════════════════════════════════════════════

print(f"\n📊 TEST 4: Statistiques globales")
print("-" * 70)

cursor.execute("""
    SELECT 
        COUNT(*) as total,
        AVG(mastery_level) as avg_mastery,
        SUM(times_referenced) as total_refs
    FROM concepts
    WHERE course_id = ?
""", (TEST_COURSE,))

stats = dict(cursor.fetchone())
print(f"Total concepts: {stats['total']}")
print(f"Mastery moyenne: {stats['avg_mastery']:.1f}%")
print(f"Total références: {stats['total_refs']}")

assert stats['total'] >= 1, "❌ Aucun concept en DB"
assert stats['total_refs'] >= 1, "❌ Aucune référence comptée"

print(f"✅ Statistiques cohérentes")

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════

print("\n" + "="*70)
print("🎉 TOUS LES TESTS PASSÉS")
print("="*70)

print("\n✅ CREATE concept: Fonctionne")
print("✅ UPDATE mastery: Fonctionne")
print("✅ UPDATE times_referenced: Fonctionne")
print("✅ SELECT avec statistiques: Fonctionne")

# État final
cursor.execute("SELECT * FROM concepts WHERE id = ?", (concept_id,))
final = dict(cursor.fetchone())

print(f"\n📊 État final du concept de test:")
print(f"   ID: {final['id']}")
print(f"   Concept: {final['concept']}")
print(f"   Mastery: {final['mastery_level']}%")
print(f"   References: {final['times_referenced']}")
print(f"   Last referenced: {final.get('last_referenced', 'N/A')[:19]}")

print("\n" + "="*70)
print("🎊 SQLITE FONCTIONNE PARFAITEMENT!")
print("="*70 + "\n")

# Nettoyage
cleanup = input("Voulez-vous nettoyer le concept de test? (o/N): ")
if cleanup.lower() == 'o':
    cursor.execute("DELETE FROM concepts WHERE id = ?", (concept_id,))
    conn.commit()
    print(f"🧹 Concept de test supprimé")
else:
    print(f"ℹ️  Concept de test conservé (ID: {concept_id})")

conn.close()
print("\n✅ Test terminé!\n")

