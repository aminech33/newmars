#!/usr/bin/env python3
"""
🔄 MIGRATION SQLite V1.9.0 - Schema Update

Migre l'ancien schéma vers le nouveau schéma compatible avec database.py
"""

import sqlite3
import json
from datetime import datetime
import os

DB_PATH = "learning.db"
BACKUP_PATH = f"learning_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

print("\n" + "="*70)
print("🔄 MIGRATION SQLite V1.9.0")
print("="*70 + "\n")

# Backup d'abord
if os.path.exists(DB_PATH):
    import shutil
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"✅ Backup créé: {BACKUP_PATH}")
else:
    print("ℹ️  Aucune DB existante, création nouvelle")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Vérifier si l'ancienne table existe
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='concepts'")
table_exists = cursor.fetchone()

if not table_exists:
    print("ℹ️  Table 'concepts' n'existe pas, création nouvelle")
    create_new = True
else:
    # Vérifier le schéma actuel
    cursor.execute("PRAGMA table_info(concepts)")
    columns = {row['name']: row for row in cursor.fetchall()}
    
    print(f"\n📋 Schéma actuel détecté:")
    for col_name in columns:
        print(f"   - {col_name}: {columns[col_name]['type']}")
    
    # Vérifier si c'est le nouveau schéma
    has_ease_factor = 'ease_factor' in columns
    has_source = 'source' in columns
    
    if has_ease_factor and not has_source:
        print("\n✅ Schéma déjà à jour (V1.9.0)")
        create_new = False
    else:
        print("\n⚠️  Ancien schéma détecté, migration nécessaire")
        create_new = True
        
        # Compter les données existantes
        cursor.execute("SELECT COUNT(*) as count FROM concepts")
        old_count = cursor.fetchone()['count']
        print(f"📊 {old_count} concepts à migrer")

if create_new:
    print("\n🔧 Migration en cours...")
    
    # 1. Sauvegarder les anciennes données si elles existent
    old_data = []
    if table_exists:
        cursor.execute("SELECT * FROM concepts")
        old_data = [dict(row) for row in cursor.fetchall()]
        print(f"✅ {len(old_data)} concepts sauvegardés en mémoire")
        
        # Supprimer l'ancienne table
        cursor.execute("DROP TABLE IF EXISTS concepts")
        print("✅ Ancienne table supprimée")
    
    # 2. Créer la nouvelle table (schéma V1.9.0)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id TEXT NOT NULL,
            concept TEXT NOT NULL,
            category TEXT,
            definition TEXT,
            example TEXT,
            keywords TEXT,  -- JSON array
            times_referenced INTEGER DEFAULT 0,
            mastery_level INTEGER DEFAULT 0,
            ease_factor REAL DEFAULT 2.5,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_referenced TIMESTAMP,
            UNIQUE(course_id, concept)
        )
    """)
    print("✅ Nouvelle table créée (V1.9.0)")
    
    # 3. Créer les index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_course_id 
        ON concepts(course_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_mastery_level 
        ON concepts(mastery_level DESC)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_last_referenced 
        ON concepts(last_referenced DESC)
    """)
    print("✅ Index créés")
    
    # 4. Migrer les données
    if old_data:
        migrated = 0
        for row in old_data:
            try:
                # Normaliser les données
                times_ref = row.get('times_referenced', 0)
                if times_ref == 1:  # Ancien default
                    times_ref = 0
                
                mastery = row.get('mastery_level', 0)
                if mastery == 1:  # Ancien default
                    mastery = 0
                
                # Insérer dans nouvelle table
                cursor.execute("""
                    INSERT INTO concepts 
                    (course_id, concept, category, definition, example, keywords,
                     times_referenced, mastery_level, ease_factor, added_at, last_referenced)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row['course_id'],
                    row['concept'],
                    row.get('category'),
                    row.get('definition'),
                    row.get('example'),
                    row.get('keywords'),
                    times_ref,
                    mastery,
                    2.5,  # ease_factor par défaut
                    row.get('added_at'),
                    row.get('last_referenced')
                ))
                migrated += 1
            except sqlite3.IntegrityError as e:
                print(f"⚠️  Skip duplicate: {row.get('concept')} ({e})")
            except Exception as e:
                print(f"❌ Erreur migration {row.get('concept')}: {e}")
        
        print(f"✅ {migrated}/{len(old_data)} concepts migrés")
    
    conn.commit()
    print("\n✅ Migration terminée avec succès!")

else:
    print("\n✅ Aucune migration nécessaire")

# Vérification finale
cursor.execute("SELECT COUNT(*) as count FROM concepts")
final_count = cursor.fetchone()['count']

cursor.execute("PRAGMA table_info(concepts)")
final_schema = [row['name'] for row in cursor.fetchall()]

print("\n" + "="*70)
print("📊 RÉSULTAT FINAL")
print("="*70)
print(f"\nNombre de concepts: {final_count}")
print(f"Schéma: {', '.join(final_schema)}")
print(f"\nBackup: {BACKUP_PATH if os.path.exists(BACKUP_PATH) else 'Aucun'}")

# Afficher quelques concepts
if final_count > 0:
    print("\n📋 Aperçu des concepts:")
    cursor.execute("SELECT course_id, concept, mastery_level, times_referenced FROM concepts LIMIT 5")
    for row in cursor.fetchall():
        print(f"   - [{row['course_id']}] {row['concept']}: mastery={row['mastery_level']}%, refs={row['times_referenced']}")

conn.close()

print("\n" + "="*70)
print("🎉 MIGRATION COMPLÈTE!")
print("="*70 + "\n")

