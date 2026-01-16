"""
❓ ELABORATIVE INTERROGATION ENGINE
Basé sur la technique d'Interrogation Élaborative (Pressley et al., 1987)

Principe scientifique:
- Poser des questions "Pourquoi?" et "Comment?" sur les faits améliore la rétention
- Force l'apprenant à générer des connexions avec ses connaissances existantes
- Active la mémoire sémantique et crée des "hooks" pour le rappel

Recherche:
- Pressley et al. (1987): First demonstration of elaborative interrogation
- Woloshyn et al. (1994): Extension to various domains
- Dunlosky et al. (2013): Meta-analysis showing high utility
- McDaniel & Donnelly (1996): Generation effect combined

Efficacité:
- +20-50% de rétention vs lecture simple
- Particulièrement efficace pour les faits et concepts

Implémentation:
- Génère automatiquement des questions d'interrogation
- Adapte le type de question au contenu
- Track les réponses générées pour renforcement
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
import re
import random

logger = logging.getLogger(__name__)


class QuestionType(Enum):
    """Types de questions d'interrogation élaborative"""
    WHY = "why"                    # Pourquoi ce fait est-il vrai?
    HOW = "how"                    # Comment cela fonctionne-t-il?
    CAUSE_EFFECT = "cause_effect"  # Quelle est la cause/l'effet?
    COMPARISON = "comparison"      # En quoi c'est différent de X?
    APPLICATION = "application"    # Comment appliquer cela?
    CONSEQUENCE = "consequence"    # Que se passerait-il si...?
    MECHANISM = "mechanism"        # Quel est le mécanisme?
    PURPOSE = "purpose"            # Quel est le but/fonction?
    EVIDENCE = "evidence"          # Quelles preuves supportent cela?
    CONNECTION = "connection"      # Comment cela se relie à X?


class ContentCategory(Enum):
    """Catégories de contenu pour adapter les questions"""
    FACTUAL = "factual"           # Faits, dates, noms
    CONCEPTUAL = "conceptual"     # Concepts, théories
    PROCEDURAL = "procedural"     # Processus, méthodes
    CAUSAL = "causal"            # Relations cause-effet
    COMPARATIVE = "comparative"   # Comparaisons
    DEFINITIONAL = "definitional"  # Définitions


# Templates de questions par type
QUESTION_TEMPLATES: Dict[QuestionType, List[str]] = {
    QuestionType.WHY: [
        "Pourquoi {subject} {predicate}?",
        "Quelle est la raison pour laquelle {subject} {predicate}?",
        "Comment expliquer que {subject} {predicate}?",
        "Qu'est-ce qui fait que {subject} {predicate}?",
    ],
    QuestionType.HOW: [
        "Comment {subject} {predicate}?",
        "De quelle manière {subject} {predicate}?",
        "Par quel processus {subject} {predicate}?",
        "Quel mécanisme permet à {subject} de {predicate}?",
    ],
    QuestionType.CAUSE_EFFECT: [
        "Quelle est la cause de {effect}?",
        "Quel effet {cause} a-t-il?",
        "Que provoque {cause}?",
        "Qu'est-ce qui entraîne {effect}?",
    ],
    QuestionType.COMPARISON: [
        "En quoi {subject1} diffère de {subject2}?",
        "Quels sont les points communs entre {subject1} et {subject2}?",
        "Pourquoi {subject1} plutôt que {subject2}?",
    ],
    QuestionType.APPLICATION: [
        "Comment appliquer {concept} dans {context}?",
        "Dans quelle situation utiliserait-on {concept}?",
        "Quel exemple illustre {concept}?",
    ],
    QuestionType.CONSEQUENCE: [
        "Que se passerait-il si {condition}?",
        "Quelles seraient les conséquences de {action}?",
        "Si {hypothesis}, alors quoi?",
    ],
    QuestionType.MECHANISM: [
        "Quel est le mécanisme derrière {phenomenon}?",
        "Comment fonctionne {system}?",
        "Quelles sont les étapes de {process}?",
    ],
    QuestionType.PURPOSE: [
        "Quel est le but de {element}?",
        "À quoi sert {element}?",
        "Quelle est la fonction de {element}?",
    ],
    QuestionType.EVIDENCE: [
        "Quelles preuves soutiennent {claim}?",
        "Comment vérifier que {fact}?",
        "Qu'est-ce qui démontre {assertion}?",
    ],
    QuestionType.CONNECTION: [
        "Comment {concept1} se relie à {concept2}?",
        "Quel est le lien entre {concept1} et {concept2}?",
        "En quoi {concept1} influence {concept2}?",
    ],
}


# Mots-clés pour détecter la catégorie de contenu
CATEGORY_KEYWORDS: Dict[ContentCategory, List[str]] = {
    ContentCategory.FACTUAL: ["est", "sont", "date", "nom", "lieu", "nombre", "mesure"],
    ContentCategory.CONCEPTUAL: ["concept", "théorie", "principe", "idée", "notion", "abstrait"],
    ContentCategory.PROCEDURAL: ["étape", "processus", "méthode", "comment faire", "procédure"],
    ContentCategory.CAUSAL: ["cause", "effet", "résulte", "provoque", "entraîne", "car"],
    ContentCategory.COMPARATIVE: ["différent", "similaire", "comparé", "versus", "contrairement"],
    ContentCategory.DEFINITIONAL: ["définition", "signifie", "désigne", "appelé"],
}


# Questions recommandées par catégorie
RECOMMENDED_QUESTIONS: Dict[ContentCategory, List[QuestionType]] = {
    ContentCategory.FACTUAL: [QuestionType.WHY, QuestionType.CONNECTION, QuestionType.PURPOSE],
    ContentCategory.CONCEPTUAL: [QuestionType.HOW, QuestionType.APPLICATION, QuestionType.COMPARISON],
    ContentCategory.PROCEDURAL: [QuestionType.MECHANISM, QuestionType.PURPOSE, QuestionType.CONSEQUENCE],
    ContentCategory.CAUSAL: [QuestionType.CAUSE_EFFECT, QuestionType.EVIDENCE, QuestionType.MECHANISM],
    ContentCategory.COMPARATIVE: [QuestionType.COMPARISON, QuestionType.CONNECTION, QuestionType.WHY],
    ContentCategory.DEFINITIONAL: [QuestionType.PURPOSE, QuestionType.APPLICATION, QuestionType.COMPARISON],
}


@dataclass
class ElaborativeQuestion:
    """Une question d'interrogation élaborative"""
    id: str
    question_text: str
    question_type: QuestionType
    source_content: str
    expected_elements: List[str]  # Éléments clés attendus dans la réponse
    hint: Optional[str] = None
    difficulty: float = 0.5  # 0-1
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ElaborativeResponse:
    """Réponse à une question élaborative"""
    question_id: str
    user_response: str
    elements_found: List[str]   # Éléments clés trouvés
    completeness: float         # 0-1, complétude de la réponse
    depth: float               # 0-1, profondeur de l'explication
    generation_quality: float   # 0-1, qualité de la génération
    feedback: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class UserElaborativeProfile:
    """Profil d'interrogation élaborative par utilisateur"""
    user_id: str
    questions_generated: int = 0
    responses_submitted: int = 0
    average_completeness: float = 0.0
    average_depth: float = 0.0
    preferred_question_types: List[QuestionType] = field(default_factory=list)
    weak_question_types: List[QuestionType] = field(default_factory=list)
    topics_elaborated: Dict[str, int] = field(default_factory=dict)
    history: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


class ElaborativeInterrogationEngine:
    """
    Moteur d'interrogation élaborative.

    Génère automatiquement des questions "Pourquoi?" et "Comment?"
    pour renforcer la compréhension et la mémorisation.
    """

    def __init__(self):
        self._user_profiles: Dict[str, UserElaborativeProfile] = {}
        self._questions_db: Dict[str, ElaborativeQuestion] = {}

        logger.info("❓ Elaborative Interrogation Engine initialized")

    def _get_user_profile(self, user_id: str) -> UserElaborativeProfile:
        """Récupère ou crée le profil utilisateur"""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserElaborativeProfile(user_id=user_id)
        return self._user_profiles[user_id]

    def _generate_question_id(self) -> str:
        """Génère un ID unique pour une question"""
        return f"eq_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"

    def detect_content_category(self, content: str) -> ContentCategory:
        """
        Détecte la catégorie de contenu.

        Args:
            content: Le texte à analyser

        Returns:
            ContentCategory détectée
        """
        content_lower = content.lower()
        scores: Dict[ContentCategory, int] = {cat: 0 for cat in ContentCategory}

        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in content_lower:
                    scores[category] += 1

        best_category = max(scores, key=scores.get)

        # Défaut à FACTUAL si aucun match
        if scores[best_category] == 0:
            return ContentCategory.FACTUAL

        return best_category

    def extract_key_elements(self, content: str) -> Dict[str, str]:
        """
        Extrait les éléments clés pour les questions.

        Args:
            content: Le texte source

        Returns:
            Dict avec subject, predicate, etc.
        """
        elements = {}

        # Extraction simple basée sur la structure
        sentences = content.split('.')
        if sentences:
            first_sentence = sentences[0].strip()

            # Tenter de séparer sujet/prédicat
            parts = first_sentence.split(' ', 3)
            if len(parts) >= 2:
                elements["subject"] = parts[0]
                elements["predicate"] = " ".join(parts[1:]) if len(parts) > 1 else ""

        # Extraire les concepts clés (mots avec majuscule ou entre guillemets)
        concepts = re.findall(r'"([^"]+)"|\'([^\']+)\'|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', content)
        flat_concepts = [c for group in concepts for c in group if c]
        if flat_concepts:
            elements["concept1"] = flat_concepts[0]
            if len(flat_concepts) > 1:
                elements["concept2"] = flat_concepts[1]

        # Extraire cause/effet si présent
        cause_match = re.search(r'(?:car|parce que|cause)\s+([^.]+)', content, re.IGNORECASE)
        if cause_match:
            elements["cause"] = cause_match.group(1).strip()

        effect_match = re.search(r'(?:donc|ainsi|résulte|provoque)\s+([^.]+)', content, re.IGNORECASE)
        if effect_match:
            elements["effect"] = effect_match.group(1).strip()

        # Fallbacks
        elements.setdefault("subject", "cela")
        elements.setdefault("predicate", "est ainsi")
        elements.setdefault("concept", content[:50])
        elements.setdefault("phenomenon", content[:30])
        elements.setdefault("element", "cet élément")
        elements.setdefault("system", "ce système")
        elements.setdefault("process", "ce processus")
        elements.setdefault("claim", "cette affirmation")
        elements.setdefault("fact", "ce fait")
        elements.setdefault("assertion", "cette assertion")
        elements.setdefault("condition", "cela change")
        elements.setdefault("action", "cette action")
        elements.setdefault("hypothesis", "cela était différent")
        elements.setdefault("context", "la pratique")
        elements.setdefault("subject1", "A")
        elements.setdefault("subject2", "B")
        elements.setdefault("concept1", "ce concept")
        elements.setdefault("concept2", "un autre concept")

        return elements

    def generate_questions(
        self,
        content: str,
        topic: str = "",
        num_questions: int = 3,
        user_id: Optional[str] = None
    ) -> List[ElaborativeQuestion]:
        """
        Génère des questions d'interrogation élaborative.

        Args:
            content: Le contenu sur lequel poser des questions
            topic: Le sujet/topic
            num_questions: Nombre de questions à générer
            user_id: ID utilisateur pour personnalisation

        Returns:
            Liste de questions élaboratives
        """
        # 1. Détecter la catégorie
        category = self.detect_content_category(content)

        # 2. Obtenir les types de questions recommandés
        recommended_types = RECOMMENDED_QUESTIONS.get(category, [QuestionType.WHY, QuestionType.HOW])

        # 3. Personnaliser si profil utilisateur
        if user_id:
            profile = self._get_user_profile(user_id)
            # Éviter les types faibles, favoriser les forts
            if profile.weak_question_types:
                # Quand même inclure 1 question du type faible pour renforcer
                weak_type = profile.weak_question_types[0]
                if weak_type not in recommended_types:
                    recommended_types = recommended_types[:2] + [weak_type]

        # 4. Extraire les éléments
        elements = self.extract_key_elements(content)

        # 5. Générer les questions
        questions = []
        used_types = set()

        for i in range(num_questions):
            # Sélectionner un type (éviter les doublons)
            available_types = [t for t in recommended_types if t not in used_types]
            if not available_types:
                available_types = recommended_types

            q_type = random.choice(available_types)
            used_types.add(q_type)

            # Sélectionner un template
            templates = QUESTION_TEMPLATES.get(q_type, ["Pourquoi {subject}?"])
            template = random.choice(templates)

            # Remplir le template
            try:
                question_text = template.format(**elements)
            except KeyError:
                question_text = f"Pourquoi {elements.get('subject', 'cela')} {elements.get('predicate', 'est-il ainsi')}?"

            # Créer la question
            question_id = self._generate_question_id()

            # Éléments attendus (simplifiés)
            expected = [elements.get("subject", ""), elements.get("concept1", "")]
            expected = [e for e in expected if e and len(e) > 2]

            # Hint basé sur le type
            hints = {
                QuestionType.WHY: "Pensez aux causes sous-jacentes et aux raisons...",
                QuestionType.HOW: "Décrivez le processus étape par étape...",
                QuestionType.CAUSE_EFFECT: "Identifiez la chaîne causale...",
                QuestionType.COMPARISON: "Listez les similitudes et différences...",
                QuestionType.APPLICATION: "Donnez un exemple concret...",
                QuestionType.CONSEQUENCE: "Imaginez les effets domino...",
                QuestionType.MECHANISM: "Expliquez le fonctionnement interne...",
                QuestionType.PURPOSE: "Réfléchissez à l'objectif visé...",
                QuestionType.EVIDENCE: "Citez des preuves ou exemples...",
                QuestionType.CONNECTION: "Trouvez les liens et relations...",
            }

            question = ElaborativeQuestion(
                id=question_id,
                question_text=question_text,
                question_type=q_type,
                source_content=content[:200],
                expected_elements=expected,
                hint=hints.get(q_type, "Réfléchissez en profondeur..."),
                difficulty=0.3 + i * 0.2  # Difficulté croissante
            )

            questions.append(question)
            self._questions_db[question_id] = question

        # Mettre à jour le profil
        if user_id:
            profile = self._get_user_profile(user_id)
            profile.questions_generated += num_questions
            if topic:
                profile.topics_elaborated[topic] = profile.topics_elaborated.get(topic, 0) + num_questions

        return questions

    def evaluate_response(
        self,
        question_id: str,
        user_response: str,
        user_id: Optional[str] = None
    ) -> ElaborativeResponse:
        """
        Évalue une réponse à une question élaborative.

        Args:
            question_id: ID de la question
            user_response: La réponse de l'utilisateur
            user_id: ID utilisateur

        Returns:
            ElaborativeResponse avec évaluation
        """
        if question_id not in self._questions_db:
            return ElaborativeResponse(
                question_id=question_id,
                user_response=user_response,
                elements_found=[],
                completeness=0.0,
                depth=0.0,
                generation_quality=0.0,
                feedback="Question non trouvée"
            )

        question = self._questions_db[question_id]

        # 1. Vérifier les éléments clés trouvés
        response_lower = user_response.lower()
        elements_found = []
        for elem in question.expected_elements:
            if elem.lower() in response_lower:
                elements_found.append(elem)

        # 2. Calculer la complétude (basé sur longueur et structure)
        word_count = len(user_response.split())
        min_words = 20  # Minimum pour une bonne élaboration
        completeness = min(1.0, word_count / min_words)

        # Bonus si contient des connecteurs logiques
        connectors = ["parce que", "car", "donc", "ainsi", "cependant", "en effet", "par exemple"]
        connector_count = sum(1 for c in connectors if c in response_lower)
        completeness = min(1.0, completeness + connector_count * 0.1)

        # 3. Calculer la profondeur (basé sur la structure)
        depth = 0.3  # Base

        # Phrases multiples = plus de profondeur
        sentence_count = user_response.count('.') + user_response.count('!')
        depth += min(0.3, sentence_count * 0.1)

        # Exemples = profondeur
        if any(ex in response_lower for ex in ["par exemple", "comme", "tel que", "notamment"]):
            depth += 0.2

        # Nuances = profondeur
        if any(nu in response_lower for nu in ["cependant", "mais", "toutefois", "néanmoins"]):
            depth += 0.2

        depth = min(1.0, depth)

        # 4. Qualité de génération (l'utilisateur a-t-il vraiment réfléchi?)
        generation_quality = 0.5

        # Réponse personnalisée (pas juste copié le contenu)
        source_words = set(question.source_content.lower().split())
        response_words = set(response_lower.split())
        overlap = len(source_words & response_words) / max(1, len(response_words))

        if overlap < 0.5:  # Moins de 50% de mots copiés = bon
            generation_quality += 0.3
        else:
            generation_quality -= 0.2

        # Points bonus pour les questions de suivi implicites
        if "?" in user_response:
            generation_quality += 0.2

        generation_quality = max(0.0, min(1.0, generation_quality))

        # 5. Feedback
        feedback = self._generate_feedback(completeness, depth, generation_quality, question.question_type)

        response = ElaborativeResponse(
            question_id=question_id,
            user_response=user_response,
            elements_found=elements_found,
            completeness=completeness,
            depth=depth,
            generation_quality=generation_quality,
            feedback=feedback
        )

        # Mettre à jour le profil
        if user_id:
            profile = self._get_user_profile(user_id)
            profile.responses_submitted += 1

            # Moyenne mobile
            n = profile.responses_submitted
            profile.average_completeness += (completeness - profile.average_completeness) / n
            profile.average_depth += (depth - profile.average_depth) / n

            # Identifier les forces/faiblesses
            avg_score = (completeness + depth + generation_quality) / 3
            if avg_score >= 0.7:
                if question.question_type not in profile.preferred_question_types:
                    profile.preferred_question_types.append(question.question_type)
            elif avg_score < 0.4:
                if question.question_type not in profile.weak_question_types:
                    profile.weak_question_types.append(question.question_type)

            profile.history.append({
                "question_id": question_id,
                "question_type": question.question_type.value,
                "completeness": completeness,
                "depth": depth,
                "generation_quality": generation_quality,
                "timestamp": datetime.now().isoformat()
            })

        return response

    def _generate_feedback(
        self,
        completeness: float,
        depth: float,
        generation_quality: float,
        question_type: QuestionType
    ) -> str:
        """Génère un feedback constructif"""
        avg = (completeness + depth + generation_quality) / 3

        feedbacks = []

        if avg >= 0.8:
            feedbacks.append("🌟 Excellente élaboration!")
        elif avg >= 0.6:
            feedbacks.append("👍 Bonne réflexion.")
        elif avg >= 0.4:
            feedbacks.append("📝 Réponse acceptable mais peut être améliorée.")
        else:
            feedbacks.append("💭 Essayez d'approfondir votre réflexion.")

        # Conseils spécifiques
        if completeness < 0.5:
            feedbacks.append("Développez davantage votre réponse.")

        if depth < 0.5:
            feedbacks.append("Ajoutez des exemples ou des nuances.")

        if generation_quality < 0.5:
            feedbacks.append("Essayez d'utiliser vos propres mots et de faire des liens personnels.")

        # Conseil spécifique au type de question
        type_tips = {
            QuestionType.WHY: "Pour les questions 'Pourquoi', identifiez les causes profondes.",
            QuestionType.HOW: "Pour les questions 'Comment', décrivez les étapes ou mécanismes.",
            QuestionType.CAUSE_EFFECT: "Pensez à la chaîne complète: cause → effet → conséquences.",
            QuestionType.COMPARISON: "Utilisez un tableau mental: similitudes vs différences.",
            QuestionType.APPLICATION: "Un bon exemple vaut mille explications!",
        }

        if avg < 0.6 and question_type in type_tips:
            feedbacks.append(type_tips[question_type])

        return " ".join(feedbacks)

    def get_retention_bonus(
        self,
        question_id: str,
        response_quality: float
    ) -> float:
        """
        Calcule le bonus de rétention basé sur l'interrogation élaborative.

        Recherche: +20-50% de rétention avec élaboration de qualité

        Args:
            question_id: ID de la question
            response_quality: Qualité de la réponse (0-1)

        Returns:
            Multiplicateur de rétention (1.0 = pas de bonus)
        """
        # Base: +20% pour avoir tenté l'élaboration
        base_bonus = 1.2

        # Bonus qualité: jusqu'à +30% supplémentaire
        quality_bonus = response_quality * 0.3

        return base_bonus + quality_bonus

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retourne le profil d'interrogation élaborative"""
        profile = self._get_user_profile(user_id)

        return {
            "user_id": profile.user_id,
            "questions_generated": profile.questions_generated,
            "responses_submitted": profile.responses_submitted,
            "average_completeness": profile.average_completeness,
            "average_depth": profile.average_depth,
            "overall_quality": (profile.average_completeness + profile.average_depth) / 2,
            "preferred_types": [t.value for t in profile.preferred_question_types],
            "weak_types": [t.value for t in profile.weak_question_types],
            "topics_elaborated": profile.topics_elaborated,
            "recommendation": self._get_recommendation(profile)
        }

    def _get_recommendation(self, profile: UserElaborativeProfile) -> str:
        """Génère une recommandation personnalisée"""
        if profile.responses_submitted < 5:
            return "Continuez à pratiquer l'interrogation élaborative pour améliorer votre mémorisation."

        avg_quality = (profile.average_completeness + profile.average_depth) / 2

        if avg_quality >= 0.7:
            return "🌟 Excellent travail d'élaboration! Vos explications sont profondes et complètes."
        elif avg_quality >= 0.5:
            if profile.weak_question_types:
                weak = profile.weak_question_types[0].value
                return f"📈 Bonne progression. Travaillez particulièrement les questions de type '{weak}'."
            return "📈 Bonne progression. Continuez à approfondir vos explications."
        else:
            return "💡 Conseil: Prenez plus de temps pour réfléchir avant de répondre. Posez-vous des sous-questions."


# Instance globale
elaborative_engine = ElaborativeInterrogationEngine()
