#!/usr/bin/env python3
"""
Script pour initialiser la base de données d'apprentissage
"""

import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.dirname(__file__))

from database import db

def main():
    print("🚀 Initialisation de la base de données d'apprentissage...")
    print(f"📁 Fichier DB: {db.db_path}")
    
    # La DB est initialisée automatiquement dans __init__
    # Mais on peut vérifier qu'elle existe
    
    if os.path.exists(db.db_path):
        print("✅ Base de données créée avec succès!")
        print("\n📊 Tables créées:")
        print("  • sessions - Stockage des sessions d'apprentissage")
        print("  • topic_mastery - Maîtrise par topic (SM-2++)")
        print("  • review_streaks - Streaks de révision")
        print("\n✨ Prêt à apprendre!")
    else:
        print("❌ Erreur lors de la création de la base de données")
        sys.exit(1)

if __name__ == "__main__":
    main()








