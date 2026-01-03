"""
🧠 Extraction automatique de concepts depuis les réponses de l'IA

Utilise Gemini pour identifier et structurer les concepts mentionnés
dans une conversation d'apprentissage.
"""

import re
import json
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# PATTERNS DE DÉTECTION
# ═══════════════════════════════════════════════════════════════

# Pattern pour détecter les concepts en code
CODE_PATTERN = re.compile(r'`([^`]+)`')

# Pattern pour détecter les concepts techniques
TECH_KEYWORDS = [
    'function', 'class', 'variable', 'method', 'attribute',
    'module', 'package', 'library', 'framework', 'API',
    'loop', 'condition', 'array', 'list', 'dict', 'object'
]


# ═══════════════════════════════════════════════════════════════
# EXTRACTION BASIQUE (SANS IA)
# ═══════════════════════════════════════════════════════════════

def extract_concepts_basic(
    text: str,
    course_language: str = 'python'
) -> List[Dict[str, Any]]:
    """
    Extraction basique de concepts sans appel IA
    
    Utilisé comme fallback rapide si l'IA est indisponible.
    Identifie les mots entre backticks et mots-clés techniques.
    """
    concepts = []
    seen = set()
    
    # 1. Extraire tout ce qui est entre backticks
    code_matches = CODE_PATTERN.findall(text)
    for match in code_matches:
        # Nettoyer
        concept = match.strip()
        
        # Ignorer les phrases complètes et les lignes trop longues
        if len(concept) > 50 or ' ' in concept and '(' not in concept:
            continue
        
        # Éviter les doublons
        if concept.lower() in seen:
            continue
        
        seen.add(concept.lower())
        
        concepts.append({
            'concept': concept,
            'category': f'{course_language}_syntax',
            'definition': None,
            'example': None,
            'keywords': [course_language, 'syntax']
        })
    
    logger.info(f"✅ Extracted {len(concepts)} concepts (basic mode)")
    return concepts


# ═══════════════════════════════════════════════════════════════
# EXTRACTION INTELLIGENTE (AVEC GEMINI)
# ═══════════════════════════════════════════════════════════════

async def extract_concepts_ai(
    ai_response: str,
    user_message: str,
    course_language: str = 'python',
    gemini_client: Any = None
) -> List[Dict[str, Any]]:
    """
    Extraction intelligente de concepts via Gemini
    
    Demande à l'IA d'identifier et structurer les concepts importants
    mentionnés dans la conversation.
    """
    
    if not gemini_client:
        logger.warning("⚠️ No Gemini client provided, falling back to basic extraction")
        return extract_concepts_basic(ai_response, course_language)
    
    try:
        # Prompt pour extraction
        extraction_prompt = f"""Tu es un analyseur de connaissances.

CONVERSATION:
Étudiant: {user_message}
IA: {ai_response}

Extrais UNIQUEMENT les concepts {course_language} importants mentionnés par l'IA.

RÈGLES:
1. Identifie les concepts techniques (fonctions, méthodes, mots-clés)
2. Pour chaque concept, fournis:
   - concept: le nom exact (ex: "print()", "for loop", "list comprehension")
   - category: la catégorie (ex: "python_builtin", "python_syntax", "python_concept")
   - definition: définition courte (1 phrase max, optionnel)
   - example: exemple de code simple (optionnel)
   - keywords: liste de mots-clés pour recherche

3. NE PAS inclure:
   - Phrases complètes
   - Explications générales
   - Concepts déjà très basiques (évidents)

4. LIMITE: Maximum 5 concepts par réponse (les plus importants)

FORMAT JSON STRICT:
{{
  "concepts": [
    {{
      "concept": "print()",
      "category": "python_builtin",
      "definition": "Affiche du texte dans la console",
      "example": "print('Hello')",
      "keywords": ["python", "output", "console", "affichage"]
    }}
  ]
}}

Réponds UNIQUEMENT avec le JSON, rien d'autre."""

        # Appel à Gemini
        result = await gemini_client.generate_content(extraction_prompt)
        response_text = result.text if hasattr(result, 'text') else str(result)
        
        # Parser le JSON
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            data = json.loads(json_match.group())
            concepts = data.get('concepts', [])
            
            logger.info(f"✅ Extracted {len(concepts)} concepts (AI mode)")
            return concepts
        else:
            logger.warning("⚠️ No valid JSON in AI response, falling back to basic")
            return extract_concepts_basic(ai_response, course_language)
            
    except Exception as e:
        logger.error(f"❌ Error in AI extraction: {e}, falling back to basic")
        return extract_concepts_basic(ai_response, course_language)


# ═══════════════════════════════════════════════════════════════
# HELPER POUR LANGUES
# ═══════════════════════════════════════════════════════════════

def extract_language_concepts(
    ai_response: str,
    target_language: str
) -> List[Dict[str, Any]]:
    """
    Extraction pour apprentissage de langues (pas programmation)
    
    Identifie vocabulaire, expressions, grammaire mentionnés.
    """
    concepts = []
    seen = set()
    
    # Pattern pour mots en langue cible (unicode)
    words = re.findall(r'[\w\u0080-\uFFFF]+', ai_response)
    
    for word in words:
        # Ignorer mots français/anglais communs
        if len(word) < 3 or word.lower() in ['the', 'and', 'or', 'le', 'la', 'de', 'et']:
            continue
        
        # Éviter doublons
        if word.lower() in seen:
            continue
        
        seen.add(word.lower())
        
        # Garder seulement mots non-latins (ou avec accents)
        if any(ord(c) > 127 for c in word) or any(c in 'áéíóúàèìòùäëïöüâêîôûãõñç' for c in word.lower()):
            concepts.append({
                'concept': word,
                'category': f'{target_language}_vocabulary',
                'definition': None,
                'example': None,
                'keywords': [target_language, 'vocabulary']
            })
    
    # Limiter à 10 concepts max
    concepts = concepts[:10]
    
    logger.info(f"✅ Extracted {len(concepts)} language concepts")
    return concepts


