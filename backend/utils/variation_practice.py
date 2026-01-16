"""
Variation Practice - Pratique avec variation contextuelle

Présente le même concept dans différents contextes pour:
- Améliorer le transfert de connaissances
- Renforcer la compréhension profonde
- Éviter l'apprentissage superficiel

Types de variations:
1. Surface variation: Même concept, présentation différente
2. Context variation: Même concept, contexte d'application différent
3. Modality variation: Même concept, format différent (texte, visuel, audio)
4. Difficulty variation: Même concept, niveaux de complexité différents

Basé sur:
- Schmidt & Bjork (1992) - Variability of practice
- Kornell & Bjork (2008) - Learning vs performance
- Rohrer (2012) - Interleaved practice
"""
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import random
import hashlib


# ═══════════════════════════════════════════════════════════════════════════════
# TYPES DE VARIATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class VariationType(Enum):
    SURFACE = "surface"           # Reformulation de la question
    CONTEXT = "context"           # Contexte d'application différent
    MODALITY = "modality"         # Format différent
    DIFFICULTY = "difficulty"     # Niveau différent
    INVERSE = "inverse"           # Question inversée
    APPLICATION = "application"   # Application pratique


# Contextes d'application par domaine
CONTEXT_TEMPLATES = {
    "mathematics": [
        "Dans un problème de physique: {concept}",
        "Dans un contexte financier: {concept}",
        "Dans une situation de la vie quotidienne: {concept}",
        "Dans un problème d'ingénierie: {concept}",
        "Dans un contexte de statistiques: {concept}",
    ],
    "programming": [
        "Dans une application web: {concept}",
        "Dans un système embarqué: {concept}",
        "Dans une application mobile: {concept}",
        "Dans un script d'automatisation: {concept}",
        "Dans un jeu vidéo: {concept}",
        "Dans une API REST: {concept}",
    ],
    "languages": [
        "Dans une conversation formelle: {concept}",
        "Dans un email professionnel: {concept}",
        "Dans une discussion informelle: {concept}",
        "Dans un texte littéraire: {concept}",
        "Dans un contexte touristique: {concept}",
    ],
    "science": [
        "Dans une expérience de laboratoire: {concept}",
        "Dans un contexte industriel: {concept}",
        "Dans la nature: {concept}",
        "Dans le corps humain: {concept}",
        "Dans l'espace: {concept}",
    ],
    "default": [
        "Dans un contexte professionnel: {concept}",
        "Dans la vie quotidienne: {concept}",
        "Dans un contexte académique: {concept}",
        "Dans une situation pratique: {concept}",
    ]
}

# Templates de reformulation (surface variation)
REFORMULATION_TEMPLATES = [
    "Autrement dit: {question}",
    "En d'autres termes: {question}",
    "Reformulé: {question}",
    "Dit différemment: {question}",
]

# Templates d'inversion
INVERSE_TEMPLATES = {
    "what_is": "Si la réponse est {answer}, quelle est la question?",
    "find_x": "Quel résultat obtient-on si on applique {operation}?",
    "definition": "Quel terme correspond à la définition: {definition}?",
    "cause_effect": "Quel effet produit {cause}?",
}


@dataclass
class VariationMetadata:
    """Métadonnées d'une variation"""
    original_question_id: str
    variation_type: VariationType
    variation_index: int  # Numéro de cette variation
    context_used: Optional[str] = None
    difficulty_delta: int = 0  # -1=easier, 0=same, +1=harder


@dataclass
class QuestionVariation:
    """Une variation d'une question"""
    id: str
    original_id: str
    question_text: str
    correct_answer: str
    options: List[Dict[str, str]]
    variation_type: VariationType
    variation_metadata: VariationMetadata
    explanation: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "original_id": self.original_id,
            "question_text": self.question_text,
            "correct_answer": self.correct_answer,
            "options": self.options,
            "variation_type": self.variation_type.value,
            "metadata": {
                "original_question_id": self.variation_metadata.original_question_id,
                "variation_type": self.variation_metadata.variation_type.value,
                "variation_index": self.variation_metadata.variation_index,
                "context": self.variation_metadata.context_used,
                "difficulty_delta": self.variation_metadata.difficulty_delta
            },
            "explanation": self.explanation
        }


@dataclass
class ConceptMastery:
    """Maîtrise d'un concept à travers ses variations"""
    concept_id: str
    variations_seen: List[str] = field(default_factory=list)  # IDs des variations vues
    variations_mastered: List[str] = field(default_factory=list)  # Variations réussies
    contexts_mastered: List[str] = field(default_factory=list)  # Contextes maîtrisés
    transfer_score: float = 0.0  # Score de transfert (0-1)


class VariationPracticeEngine:
    """
    Moteur de pratique avec variations

    Usage:
        engine = VariationPracticeEngine()

        # Générer des variations
        variations = engine.generate_variations(question, domain="mathematics")

        # Sélectionner la prochaine variation optimale
        next_var = engine.select_optimal_variation(concept_id, variations, user_history)

        # Enregistrer le résultat
        engine.record_variation_result(user_id, variation, was_correct)
    """

    def __init__(self):
        self.concept_mastery: Dict[str, ConceptMastery] = {}
        self.variation_history: Dict[str, List[Dict]] = {}  # user_id -> history

    def generate_variations(
        self,
        question: Dict[str, Any],
        domain: str = "default",
        num_variations: int = 5,
        include_types: List[VariationType] = None
    ) -> List[QuestionVariation]:
        """
        Génère des variations d'une question

        Args:
            question: Question originale avec text, answer, options
            domain: Domaine (mathematics, programming, etc.)
            num_variations: Nombre de variations à générer
            include_types: Types de variations à inclure (tous par défaut)

        Returns:
            Liste de variations
        """
        if include_types is None:
            include_types = list(VariationType)

        variations = []
        original_id = question.get("id", self._generate_id(question.get("question_text", "")))

        # Générer chaque type de variation
        for i, var_type in enumerate(include_types):
            if len(variations) >= num_variations:
                break

            variation = self._create_variation(
                question=question,
                variation_type=var_type,
                domain=domain,
                index=i
            )

            if variation:
                variations.append(variation)

        return variations

    def _create_variation(
        self,
        question: Dict[str, Any],
        variation_type: VariationType,
        domain: str,
        index: int
    ) -> Optional[QuestionVariation]:
        """Crée une variation spécifique"""
        original_text = question.get("question_text", "")
        original_answer = question.get("correct_answer", "")
        original_options = question.get("options", [])
        original_id = question.get("id", self._generate_id(original_text))

        var_id = f"{original_id}_var_{variation_type.value}_{index}"

        if variation_type == VariationType.SURFACE:
            return self._create_surface_variation(
                question, original_id, var_id, index
            )

        elif variation_type == VariationType.CONTEXT:
            return self._create_context_variation(
                question, original_id, var_id, domain, index
            )

        elif variation_type == VariationType.INVERSE:
            return self._create_inverse_variation(
                question, original_id, var_id, index
            )

        elif variation_type == VariationType.DIFFICULTY:
            return self._create_difficulty_variation(
                question, original_id, var_id, index
            )

        elif variation_type == VariationType.APPLICATION:
            return self._create_application_variation(
                question, original_id, var_id, domain, index
            )

        return None

    def _create_surface_variation(
        self,
        question: Dict[str, Any],
        original_id: str,
        var_id: str,
        index: int
    ) -> QuestionVariation:
        """Crée une variation de surface (reformulation)"""
        original_text = question.get("question_text", "")

        # Synonymes et reformulations simples
        reformulations = [
            original_text,  # Garder l'original comme fallback
            self._simple_reformulate(original_text),
        ]

        new_text = reformulations[min(index, len(reformulations) - 1)]

        return QuestionVariation(
            id=var_id,
            original_id=original_id,
            question_text=new_text,
            correct_answer=question.get("correct_answer", ""),
            options=question.get("options", []),
            variation_type=VariationType.SURFACE,
            variation_metadata=VariationMetadata(
                original_question_id=original_id,
                variation_type=VariationType.SURFACE,
                variation_index=index
            ),
            explanation=question.get("explanation")
        )

    def _create_context_variation(
        self,
        question: Dict[str, Any],
        original_id: str,
        var_id: str,
        domain: str,
        index: int
    ) -> QuestionVariation:
        """Crée une variation contextuelle"""
        original_text = question.get("question_text", "")
        contexts = CONTEXT_TEMPLATES.get(domain, CONTEXT_TEMPLATES["default"])

        # Sélectionner un contexte
        context = contexts[index % len(contexts)]
        new_text = context.format(concept=original_text)

        return QuestionVariation(
            id=var_id,
            original_id=original_id,
            question_text=new_text,
            correct_answer=question.get("correct_answer", ""),
            options=question.get("options", []),
            variation_type=VariationType.CONTEXT,
            variation_metadata=VariationMetadata(
                original_question_id=original_id,
                variation_type=VariationType.CONTEXT,
                variation_index=index,
                context_used=context.split(":")[0] if ":" in context else context
            ),
            explanation=question.get("explanation")
        )

    def _create_inverse_variation(
        self,
        question: Dict[str, Any],
        original_id: str,
        var_id: str,
        index: int
    ) -> QuestionVariation:
        """Crée une variation inversée"""
        original_text = question.get("question_text", "")
        original_answer = question.get("correct_answer", "")
        options = question.get("options", [])

        # Inverser: la réponse devient la question
        new_text = f"Quel concept ou terme correspond à: {original_answer}?"

        # Réorganiser les options (l'ancienne question devient une option)
        new_options = [{"id": "a", "text": original_text, "is_correct": True}]
        for i, opt in enumerate(options[:3]):
            if not opt.get("is_correct", False):
                new_options.append({
                    "id": chr(ord('b') + i),
                    "text": opt.get("text", ""),
                    "is_correct": False
                })

        return QuestionVariation(
            id=var_id,
            original_id=original_id,
            question_text=new_text,
            correct_answer=original_text,  # L'ancienne question est la réponse
            options=new_options,
            variation_type=VariationType.INVERSE,
            variation_metadata=VariationMetadata(
                original_question_id=original_id,
                variation_type=VariationType.INVERSE,
                variation_index=index
            ),
            explanation=f"Question inversée - la réponse originale était: {original_answer}"
        )

    def _create_difficulty_variation(
        self,
        question: Dict[str, Any],
        original_id: str,
        var_id: str,
        index: int
    ) -> QuestionVariation:
        """Crée une variation de difficulté"""
        original_text = question.get("question_text", "")
        original_difficulty = question.get("difficulty", "medium")

        # Alterner entre plus facile et plus difficile
        if index % 2 == 0:
            # Plus facile: ajouter un indice
            new_text = f"{original_text}\n\n💡 Indice: Pensez aux concepts de base."
            difficulty_delta = -1
        else:
            # Plus difficile: ajouter une contrainte
            new_text = f"{original_text}\n\n⚡ Défi: Expliquez votre raisonnement."
            difficulty_delta = 1

        return QuestionVariation(
            id=var_id,
            original_id=original_id,
            question_text=new_text,
            correct_answer=question.get("correct_answer", ""),
            options=question.get("options", []),
            variation_type=VariationType.DIFFICULTY,
            variation_metadata=VariationMetadata(
                original_question_id=original_id,
                variation_type=VariationType.DIFFICULTY,
                variation_index=index,
                difficulty_delta=difficulty_delta
            ),
            explanation=question.get("explanation")
        )

    def _create_application_variation(
        self,
        question: Dict[str, Any],
        original_id: str,
        var_id: str,
        domain: str,
        index: int
    ) -> QuestionVariation:
        """Crée une variation application pratique"""
        original_text = question.get("question_text", "")

        # Templates d'application
        applications = [
            f"Comment appliqueriez-vous le concept suivant dans la pratique?\n\n{original_text}",
            f"Donnez un exemple concret pour illustrer:\n\n{original_text}",
            f"Dans quelle situation réelle pourriez-vous utiliser:\n\n{original_text}",
        ]

        new_text = applications[index % len(applications)]

        return QuestionVariation(
            id=var_id,
            original_id=original_id,
            question_text=new_text,
            correct_answer=question.get("correct_answer", ""),
            options=question.get("options", []),
            variation_type=VariationType.APPLICATION,
            variation_metadata=VariationMetadata(
                original_question_id=original_id,
                variation_type=VariationType.APPLICATION,
                variation_index=index
            ),
            explanation=question.get("explanation")
        )

    def _simple_reformulate(self, text: str) -> str:
        """Reformulation simple (version basique)"""
        # Remplacements simples
        replacements = [
            ("Qu'est-ce que", "Pouvez-vous définir"),
            ("Comment", "De quelle manière"),
            ("Pourquoi", "Pour quelle raison"),
            ("Quel est", "Indiquez"),
            ("Quels sont", "Énumérez"),
            ("Expliquez", "Décrivez"),
        ]

        new_text = text
        for old, new in replacements:
            if old in text:
                new_text = text.replace(old, new, 1)
                break

        return new_text

    def _generate_id(self, text: str) -> str:
        """Génère un ID unique basé sur le texte"""
        return hashlib.md5(text.encode()).hexdigest()[:12]

    def select_optimal_variation(
        self,
        concept_id: str,
        variations: List[QuestionVariation],
        user_history: List[str] = None
    ) -> QuestionVariation:
        """
        Sélectionne la variation optimale à présenter

        Critères:
        - Variation pas encore vue
        - Type de variation pas encore maîtrisé
        - Contexte différent des précédents

        Args:
            concept_id: ID du concept
            variations: Variations disponibles
            user_history: IDs des variations déjà vues

        Returns:
            Variation optimale
        """
        user_history = user_history or []

        # Filtrer les variations non vues
        unseen = [v for v in variations if v.id not in user_history]

        if not unseen:
            # Toutes vues - retourner une aléatoire
            return random.choice(variations)

        # Prioriser les types de variation non maîtrisés
        mastery = self.concept_mastery.get(concept_id, ConceptMastery(concept_id=concept_id))

        # Scorer chaque variation
        scored = []
        for var in unseen:
            score = 0

            # Bonus si type non encore vu
            var_type = var.variation_type.value
            if var_type not in [v.split("_")[2] for v in mastery.variations_mastered if "_" in v]:
                score += 10

            # Bonus si contexte non encore vu
            if var.variation_metadata.context_used:
                if var.variation_metadata.context_used not in mastery.contexts_mastered:
                    score += 5

            # Légère randomisation
            score += random.uniform(0, 2)

            scored.append((var, score))

        # Retourner la meilleure
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[0][0]

    def record_variation_result(
        self,
        user_id: str,
        variation: QuestionVariation,
        was_correct: bool,
        response_time: int = None
    ):
        """
        Enregistre le résultat d'une variation

        Args:
            user_id: ID de l'utilisateur
            variation: Variation tentée
            was_correct: Réponse correcte?
            response_time: Temps de réponse (optionnel)
        """
        concept_id = variation.original_id

        # Initialiser si nécessaire
        if concept_id not in self.concept_mastery:
            self.concept_mastery[concept_id] = ConceptMastery(concept_id=concept_id)

        mastery = self.concept_mastery[concept_id]

        # Enregistrer la variation vue
        if variation.id not in mastery.variations_seen:
            mastery.variations_seen.append(variation.id)

        # Si correct, marquer comme maîtrisée
        if was_correct:
            if variation.id not in mastery.variations_mastered:
                mastery.variations_mastered.append(variation.id)

            # Contexte maîtrisé
            if variation.variation_metadata.context_used:
                context = variation.variation_metadata.context_used
                if context not in mastery.contexts_mastered:
                    mastery.contexts_mastered.append(context)

        # Calculer le score de transfert
        mastery.transfer_score = self._calculate_transfer_score(mastery)

        # Historique utilisateur
        if user_id not in self.variation_history:
            self.variation_history[user_id] = []

        self.variation_history[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "variation_id": variation.id,
            "concept_id": concept_id,
            "variation_type": variation.variation_type.value,
            "was_correct": was_correct,
            "response_time": response_time
        })

    def _calculate_transfer_score(self, mastery: ConceptMastery) -> float:
        """
        Calcule le score de transfert basé sur la diversité des variations maîtrisées

        Un score élevé indique une bonne maîtrise du concept dans différents contextes
        """
        if not mastery.variations_seen:
            return 0.0

        # Facteurs
        variations_ratio = len(mastery.variations_mastered) / max(1, len(mastery.variations_seen))
        contexts_diversity = len(set(mastery.contexts_mastered)) / 5  # Max 5 contextes

        # Types de variations uniques maîtrisées
        unique_types = set()
        for var_id in mastery.variations_mastered:
            parts = var_id.split("_")
            if len(parts) >= 3:
                unique_types.add(parts[2])
        types_diversity = len(unique_types) / len(VariationType)

        # Score composite
        transfer_score = (
            variations_ratio * 0.4 +
            contexts_diversity * 0.3 +
            types_diversity * 0.3
        )

        return min(1.0, transfer_score)

    def get_concept_mastery_report(self, concept_id: str) -> Dict[str, Any]:
        """
        Génère un rapport de maîtrise pour un concept

        Returns:
            Dict avec les métriques de maîtrise
        """
        mastery = self.concept_mastery.get(concept_id)

        if not mastery:
            return {
                "concept_id": concept_id,
                "status": "not_started",
                "variations_seen": 0,
                "variations_mastered": 0,
                "transfer_score": 0.0
            }

        # Analyser les types maîtrisés
        types_mastered = set()
        for var_id in mastery.variations_mastered:
            parts = var_id.split("_")
            if len(parts) >= 3:
                types_mastered.add(parts[2])

        return {
            "concept_id": concept_id,
            "status": "mastered" if mastery.transfer_score > 0.7 else "learning",
            "variations_seen": len(mastery.variations_seen),
            "variations_mastered": len(mastery.variations_mastered),
            "contexts_mastered": mastery.contexts_mastered,
            "types_mastered": list(types_mastered),
            "transfer_score": round(mastery.transfer_score, 2),
            "recommendation": self._get_recommendation(mastery, types_mastered)
        }

    def _get_recommendation(
        self,
        mastery: ConceptMastery,
        types_mastered: set
    ) -> str:
        """Génère une recommandation pour améliorer la maîtrise"""
        all_types = {t.value for t in VariationType}
        missing_types = all_types - types_mastered

        if mastery.transfer_score > 0.8:
            return "🎉 Excellent! Concept maîtrisé dans tous les contextes."

        if mastery.transfer_score > 0.5:
            if missing_types:
                return f"💪 Bonne progression! Essayez les variations: {', '.join(list(missing_types)[:2])}"
            return "📈 Continuez à pratiquer pour renforcer le transfert."

        if len(mastery.contexts_mastered) < 2:
            return "🔄 Pratiquez le concept dans différents contextes."

        return "📚 Continuez à explorer les différentes variations de ce concept."


# ═══════════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════════

def create_variation_practice_session(
    questions: List[Dict[str, Any]],
    domain: str = "default",
    variations_per_question: int = 3
) -> List[QuestionVariation]:
    """
    Crée une session de pratique avec variations

    Args:
        questions: Questions originales
        domain: Domaine
        variations_per_question: Nombre de variations par question

    Returns:
        Liste de variations mélangées
    """
    engine = VariationPracticeEngine()
    all_variations = []

    for question in questions:
        variations = engine.generate_variations(
            question,
            domain=domain,
            num_variations=variations_per_question
        )
        all_variations.extend(variations)

    # Mélanger pour l'interleaving
    random.shuffle(all_variations)

    return all_variations


def calculate_variation_benefit(
    success_rate_original: float,
    success_rate_variations: float
) -> Dict[str, float]:
    """
    Calcule le bénéfice de la pratique avec variations

    Returns:
        Métriques de bénéfice
    """
    transfer_improvement = success_rate_variations - success_rate_original

    return {
        "original_success_rate": round(success_rate_original, 2),
        "variations_success_rate": round(success_rate_variations, 2),
        "transfer_improvement": round(transfer_improvement, 2),
        "estimated_retention_boost": round(transfer_improvement * 0.3, 2),  # 30% du gain
        "recommendation": (
            "excellent" if transfer_improvement > 0.2 else
            "good" if transfer_improvement > 0.1 else
            "needs_more_practice"
        )
    }


__all__ = [
    "VariationPracticeEngine",
    "VariationType",
    "QuestionVariation",
    "ConceptMastery",
    "VariationMetadata",
    "create_variation_practice_session",
    "calculate_variation_benefit",
    "CONTEXT_TEMPLATES",
]
