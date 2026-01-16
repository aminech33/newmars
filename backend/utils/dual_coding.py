"""
🎨 DUAL CODING ENGINE
Basé sur la théorie du Double Codage de Paivio (1971, 1986)

Principe scientifique:
- Le cerveau traite l'information via 2 canaux distincts: verbal et visuel
- L'information encodée dans LES DEUX canaux est 2x plus mémorable
- Les connexions référentielles entre canaux renforcent la mémoire

Recherche:
- Paivio (1971): "Imagery and Verbal Processes"
- Mayer (2001): Principes du multimedia learning
- Clark & Paivio (1991): Dual coding theory and education

Implémentation:
- Génère des indices visuels pour accompagner le contenu verbal
- Recommande des types de visualisation selon le contenu
- Track l'utilisation des deux canaux pour optimiser
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
import re

logger = logging.getLogger(__name__)


class ContentType(Enum):
    """Types de contenu avec recommandations d'encodage"""
    CONCEPT = "concept"          # Idée abstraite → schéma conceptuel
    PROCESS = "process"          # Étapes séquentielles → flowchart
    COMPARISON = "comparison"    # Différences → tableau/Venn
    HIERARCHY = "hierarchy"      # Relations → arbre/mind map
    SPATIAL = "spatial"          # Positions → carte/diagramme
    TEMPORAL = "temporal"        # Chronologie → timeline
    QUANTITATIVE = "quantitative"  # Nombres → graphique
    CAUSAL = "causal"           # Cause-effet → diagramme flèches
    PROCEDURAL = "procedural"   # Comment faire → étapes illustrées
    FACTUAL = "factual"         # Fait simple → image mnémotechnique


class VisualType(Enum):
    """Types de visualisation disponibles"""
    DIAGRAM = "diagram"          # Diagramme général
    FLOWCHART = "flowchart"      # Flux de processus
    MINDMAP = "mindmap"          # Carte mentale
    TIMELINE = "timeline"        # Ligne temporelle
    VENN = "venn"               # Diagramme de Venn
    TABLE = "table"             # Tableau comparatif
    GRAPH = "graph"             # Graphique (bar, line, pie)
    ICON = "icon"               # Icône/emoji simple
    ILLUSTRATION = "illustration"  # Image descriptive
    MNEMONIC_IMAGE = "mnemonic"  # Image mnémotechnique
    SCHEMA = "schema"           # Schéma technique
    TREE = "tree"               # Structure arborescente


# Mapping content type → visual type recommandé
CONTENT_TO_VISUAL: Dict[ContentType, List[VisualType]] = {
    ContentType.CONCEPT: [VisualType.MINDMAP, VisualType.SCHEMA, VisualType.ICON],
    ContentType.PROCESS: [VisualType.FLOWCHART, VisualType.TIMELINE, VisualType.DIAGRAM],
    ContentType.COMPARISON: [VisualType.TABLE, VisualType.VENN, VisualType.GRAPH],
    ContentType.HIERARCHY: [VisualType.TREE, VisualType.MINDMAP, VisualType.DIAGRAM],
    ContentType.SPATIAL: [VisualType.DIAGRAM, VisualType.ILLUSTRATION, VisualType.SCHEMA],
    ContentType.TEMPORAL: [VisualType.TIMELINE, VisualType.FLOWCHART, VisualType.GRAPH],
    ContentType.QUANTITATIVE: [VisualType.GRAPH, VisualType.TABLE, VisualType.DIAGRAM],
    ContentType.CAUSAL: [VisualType.FLOWCHART, VisualType.DIAGRAM, VisualType.MINDMAP],
    ContentType.PROCEDURAL: [VisualType.FLOWCHART, VisualType.ILLUSTRATION, VisualType.TIMELINE],
    ContentType.FACTUAL: [VisualType.MNEMONIC_IMAGE, VisualType.ICON, VisualType.ILLUSTRATION],
}


# Mots-clés pour détecter le type de contenu
CONTENT_KEYWORDS: Dict[ContentType, List[str]] = {
    ContentType.PROCESS: ["étape", "processus", "comment", "procédure", "méthode", "cycle", "phase", "séquence"],
    ContentType.COMPARISON: ["différence", "similaire", "compare", "versus", "vs", "contrairement", "alors que"],
    ContentType.HIERARCHY: ["catégorie", "type", "sous-", "parent", "enfant", "niveau", "classe", "groupe"],
    ContentType.TEMPORAL: ["avant", "après", "date", "année", "siècle", "époque", "histoire", "chronologie"],
    ContentType.QUANTITATIVE: ["nombre", "pourcentage", "statistique", "chiffre", "mesure", "quantité", "taux"],
    ContentType.CAUSAL: ["cause", "effet", "résultat", "conséquence", "provoque", "entraîne", "car", "parce que"],
    ContentType.PROCEDURAL: ["faire", "créer", "construire", "fabriquer", "assembler", "préparer", "réaliser"],
    ContentType.SPATIAL: ["position", "lieu", "espace", "carte", "géographie", "situé", "localisation"],
}


@dataclass
class DualCodedContent:
    """Contenu encodé avec les deux canaux"""
    verbal_content: str              # Le texte/explication verbal
    content_type: ContentType        # Type de contenu détecté
    recommended_visual: VisualType   # Type de visuel recommandé
    visual_description: str          # Description du visuel à créer
    emoji_cue: str                   # Emoji comme indice visuel rapide
    mnemonic_phrase: Optional[str]   # Phrase mnémotechnique (si applicable)
    key_elements: List[str]          # Éléments clés à visualiser
    encoding_strength: float         # Force d'encodage estimée (0-1)
    referential_connections: List[str]  # Connexions entre canaux


@dataclass
class UserDualCodingProfile:
    """Profil d'utilisation dual coding par utilisateur"""
    user_id: str
    visual_preference: float = 0.5    # 0 = verbal only, 1 = highly visual
    best_visual_types: List[VisualType] = field(default_factory=list)
    retention_with_visual: float = 0.0   # Taux de rétention avec visuel
    retention_without_visual: float = 0.0  # Taux sans visuel
    total_with_visual: int = 0
    total_without_visual: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class DualCodingEngine:
    """
    Moteur de double codage.

    Génère automatiquement des indices visuels pour tout contenu verbal
    et track l'efficacité des deux canaux par utilisateur.
    """

    def __init__(self):
        self._user_profiles: Dict[str, UserDualCodingProfile] = {}

        # Mapping emoji par domaine/concept
        self._domain_emojis: Dict[str, str] = {
            # Sciences
            "math": "🔢", "physique": "⚛️", "chimie": "🧪", "biologie": "🧬",
            "informatique": "💻", "médecine": "🏥", "astronomie": "🌟",
            # Langues
            "français": "🇫🇷", "anglais": "🇬🇧", "espagnol": "🇪🇸",
            "grammaire": "📝", "vocabulaire": "📚", "conjugaison": "🔄",
            # Histoire/Géo
            "histoire": "📜", "géographie": "🗺️", "économie": "📊",
            # Arts
            "musique": "🎵", "art": "🎨", "littérature": "📖",
            # Autres
            "sport": "⚽", "cuisine": "👨‍🍳", "droit": "⚖️",
        }

        # Emojis pour concepts abstraits
        self._concept_emojis: Dict[str, str] = {
            "important": "⭐", "attention": "⚠️", "astuce": "💡",
            "exemple": "📋", "définition": "📌", "formule": "🔣",
            "règle": "📏", "exception": "❗", "résumé": "📋",
            "question": "❓", "réponse": "✅", "erreur": "❌",
        }

        logger.info("🎨 Dual Coding Engine initialized")

    def _get_user_profile(self, user_id: str) -> UserDualCodingProfile:
        """Récupère ou crée le profil utilisateur"""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserDualCodingProfile(user_id=user_id)
        return self._user_profiles[user_id]

    def detect_content_type(self, text: str) -> ContentType:
        """
        Détecte automatiquement le type de contenu basé sur les mots-clés.

        Args:
            text: Le contenu textuel à analyser

        Returns:
            ContentType détecté
        """
        text_lower = text.lower()
        scores: Dict[ContentType, int] = {ct: 0 for ct in ContentType}

        for content_type, keywords in CONTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[content_type] += 1

        # Trouver le type avec le plus de matches
        best_type = max(scores, key=scores.get)

        # Si aucun match, défaut à CONCEPT
        if scores[best_type] == 0:
            return ContentType.CONCEPT

        return best_type

    def get_visual_recommendation(
        self,
        content_type: ContentType,
        user_id: Optional[str] = None
    ) -> VisualType:
        """
        Recommande le meilleur type de visuel.

        Args:
            content_type: Type de contenu
            user_id: ID utilisateur pour personnalisation

        Returns:
            VisualType recommandé
        """
        recommendations = CONTENT_TO_VISUAL.get(content_type, [VisualType.DIAGRAM])

        # Si on a un profil utilisateur, adapter
        if user_id:
            profile = self._get_user_profile(user_id)
            if profile.best_visual_types:
                # Chercher intersection avec les types efficaces pour cet utilisateur
                for visual in profile.best_visual_types:
                    if visual in recommendations:
                        return visual

        return recommendations[0]

    def get_emoji_cue(self, text: str, domain: Optional[str] = None) -> str:
        """
        Génère un indice emoji pour le contenu.

        Args:
            text: Le contenu
            domain: Domaine optionnel (math, histoire, etc.)

        Returns:
            Emoji approprié
        """
        # Priorité au domaine si fourni
        if domain:
            domain_lower = domain.lower()
            for key, emoji in self._domain_emojis.items():
                if key in domain_lower:
                    return emoji

        # Sinon, chercher dans le texte
        text_lower = text.lower()

        # Vérifier concepts abstraits
        for concept, emoji in self._concept_emojis.items():
            if concept in text_lower:
                return emoji

        # Vérifier domaines
        for key, emoji in self._domain_emojis.items():
            if key in text_lower:
                return emoji

        # Défaut: ampoule (idée)
        return "💡"

    def extract_key_elements(self, text: str, max_elements: int = 5) -> List[str]:
        """
        Extrait les éléments clés à visualiser.

        Args:
            text: Le contenu
            max_elements: Nombre max d'éléments

        Returns:
            Liste des éléments clés
        """
        # Patterns pour éléments importants
        patterns = [
            r'\*\*(.+?)\*\*',           # **texte en gras**
            r'__(.+?)__',               # __texte souligné__
            r'"(.+?)"',                 # "texte entre guillemets"
            r'\'(.+?)\'',               # 'texte entre apostrophes'
            r':\s*([A-Z][^.!?]+)',      # Définitions après ":"
        ]

        elements = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            elements.extend(matches)

        # Déduplicate et limiter
        seen = set()
        unique = []
        for elem in elements:
            elem_clean = elem.strip()
            if elem_clean and elem_clean not in seen:
                seen.add(elem_clean)
                unique.append(elem_clean)

        return unique[:max_elements]

    def generate_visual_description(
        self,
        text: str,
        content_type: ContentType,
        visual_type: VisualType
    ) -> str:
        """
        Génère une description du visuel à créer.

        Args:
            text: Le contenu verbal
            content_type: Type de contenu
            visual_type: Type de visuel choisi

        Returns:
            Description textuelle du visuel
        """
        templates = {
            VisualType.FLOWCHART: "Créer un flowchart montrant les étapes: {elements}. Utiliser des flèches pour le flux.",
            VisualType.MINDMAP: "Carte mentale avec concept central: '{main}'. Branches: {elements}.",
            VisualType.TIMELINE: "Ligne temporelle avec les événements: {elements}.",
            VisualType.VENN: "Diagramme de Venn comparant: {elements}. Zone centrale = points communs.",
            VisualType.TABLE: "Tableau comparatif avec colonnes: {elements}.",
            VisualType.GRAPH: "Graphique illustrant: {elements}. Type: bar/line selon données.",
            VisualType.TREE: "Arborescence hiérarchique: {elements}.",
            VisualType.SCHEMA: "Schéma technique montrant: {elements}.",
            VisualType.ILLUSTRATION: "Illustration représentant: {elements}.",
            VisualType.MNEMONIC_IMAGE: "Image mnémotechnique associant: {elements}.",
            VisualType.ICON: "Icône simple représentant le concept clé.",
            VisualType.DIAGRAM: "Diagramme montrant les relations entre: {elements}.",
        }

        elements = self.extract_key_elements(text)
        if not elements:
            # Extraire les premiers mots significatifs
            words = [w for w in text.split()[:20] if len(w) > 3]
            elements = words[:5]

        template = templates.get(visual_type, "Visuel représentant: {elements}")

        return template.format(
            elements=", ".join(elements) if elements else "concept principal",
            main=elements[0] if elements else "concept"
        )

    def generate_mnemonic(self, text: str, elements: List[str]) -> Optional[str]:
        """
        Génère une phrase mnémotechnique si applicable.

        Args:
            text: Le contenu
            elements: Éléments clés

        Returns:
            Phrase mnémotechnique ou None
        """
        if len(elements) < 3:
            return None

        # Prendre les premières lettres
        initials = [e[0].upper() for e in elements[:7] if e]

        if len(initials) >= 3:
            return f"Mémo: {''.join(initials)} (pour retenir: {', '.join(elements[:len(initials)])})"

        return None

    def calculate_encoding_strength(
        self,
        has_visual: bool,
        has_mnemonic: bool,
        key_elements_count: int,
        content_type: ContentType
    ) -> float:
        """
        Calcule la force d'encodage estimée.

        Basé sur la recherche:
        - Dual coding double la rétention (Paivio)
        - Mnémoniques +25% (Bellezza, 1981)
        - Plus d'éléments = plus de hooks

        Returns:
            Score 0-1 de force d'encodage
        """
        base_strength = 0.4  # Verbal seul

        if has_visual:
            base_strength += 0.35  # +35% avec visuel (dual coding)

        if has_mnemonic:
            base_strength += 0.15  # +15% avec mnémonique

        # Bonus pour éléments (plus de "hooks" = meilleure rétention)
        element_bonus = min(0.1, key_elements_count * 0.02)
        base_strength += element_bonus

        # Certains types sont naturellement plus mémorables
        type_bonus = {
            ContentType.SPATIAL: 0.05,    # Images spatiales très mémorables
            ContentType.TEMPORAL: 0.03,    # Stories/chronologies
            ContentType.CAUSAL: 0.03,      # Cause-effet = logique
        }
        base_strength += type_bonus.get(content_type, 0)

        return min(1.0, base_strength)

    def encode(
        self,
        verbal_content: str,
        domain: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> DualCodedContent:
        """
        Encode le contenu avec les deux canaux (verbal + visuel).

        Args:
            verbal_content: Le texte à encoder
            domain: Domaine optionnel pour contexte
            user_id: ID utilisateur pour personnalisation

        Returns:
            DualCodedContent avec toutes les informations d'encodage
        """
        # 1. Détecter le type de contenu
        content_type = self.detect_content_type(verbal_content)

        # 2. Recommander le type de visuel
        visual_type = self.get_visual_recommendation(content_type, user_id)

        # 3. Générer l'indice emoji
        emoji = self.get_emoji_cue(verbal_content, domain)

        # 4. Extraire les éléments clés
        key_elements = self.extract_key_elements(verbal_content)

        # 5. Générer la description du visuel
        visual_description = self.generate_visual_description(
            verbal_content, content_type, visual_type
        )

        # 6. Générer mnémonique si possible
        mnemonic = self.generate_mnemonic(verbal_content, key_elements)

        # 7. Calculer la force d'encodage
        encoding_strength = self.calculate_encoding_strength(
            has_visual=True,
            has_mnemonic=mnemonic is not None,
            key_elements_count=len(key_elements),
            content_type=content_type
        )

        # 8. Connexions référentielles (liens verbal ↔ visuel)
        connections = []
        if key_elements:
            connections = [f"{emoji} → {elem}" for elem in key_elements[:3]]

        return DualCodedContent(
            verbal_content=verbal_content,
            content_type=content_type,
            recommended_visual=visual_type,
            visual_description=visual_description,
            emoji_cue=emoji,
            mnemonic_phrase=mnemonic,
            key_elements=key_elements,
            encoding_strength=encoding_strength,
            referential_connections=connections
        )

    def record_retention(
        self,
        user_id: str,
        was_recalled: bool,
        had_visual: bool
    ) -> None:
        """
        Enregistre le résultat de rétention pour optimisation.

        Args:
            user_id: ID utilisateur
            was_recalled: Si le contenu a été rappelé
            had_visual: Si un visuel était présent
        """
        profile = self._get_user_profile(user_id)

        if had_visual:
            profile.total_with_visual += 1
            # Moyenne mobile
            weight = 1 / profile.total_with_visual
            if was_recalled:
                profile.retention_with_visual += weight * (1 - profile.retention_with_visual)
            else:
                profile.retention_with_visual += weight * (0 - profile.retention_with_visual)
        else:
            profile.total_without_visual += 1
            weight = 1 / profile.total_without_visual
            if was_recalled:
                profile.retention_without_visual += weight * (1 - profile.retention_without_visual)
            else:
                profile.retention_without_visual += weight * (0 - profile.retention_without_visual)

        # Mettre à jour la préférence visuelle
        if profile.total_with_visual >= 5 and profile.total_without_visual >= 5:
            # Calcul du bénéfice visuel
            visual_benefit = profile.retention_with_visual - profile.retention_without_visual
            # Ajuster la préférence (0.5 = neutre)
            profile.visual_preference = 0.5 + visual_benefit

        profile.updated_at = datetime.now()

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retourne le profil dual coding de l'utilisateur"""
        profile = self._get_user_profile(user_id)

        return {
            "user_id": profile.user_id,
            "visual_preference": profile.visual_preference,
            "preference_description": self._describe_preference(profile.visual_preference),
            "retention_with_visual": profile.retention_with_visual,
            "retention_without_visual": profile.retention_without_visual,
            "visual_benefit": profile.retention_with_visual - profile.retention_without_visual,
            "total_samples": profile.total_with_visual + profile.total_without_visual,
            "best_visual_types": [v.value for v in profile.best_visual_types],
            "recommendation": self._get_recommendation(profile)
        }

    def _describe_preference(self, pref: float) -> str:
        """Décrit la préférence visuelle en texte"""
        if pref < 0.3:
            return "Apprenant verbal - préfère les explications textuelles"
        elif pref < 0.45:
            return "Légère préférence verbale"
        elif pref < 0.55:
            return "Équilibré - utilise les deux canaux efficacement"
        elif pref < 0.7:
            return "Légère préférence visuelle"
        else:
            return "Apprenant visuel - bénéficie fortement des visuels"

    def _get_recommendation(self, profile: UserDualCodingProfile) -> str:
        """Génère une recommandation personnalisée"""
        if profile.total_with_visual + profile.total_without_visual < 10:
            return "Continuez à explorer les deux modes pour optimiser votre apprentissage"

        benefit = profile.retention_with_visual - profile.retention_without_visual

        if benefit > 0.15:
            return "Utilisez systématiquement des visuels - votre rétention est significativement meilleure (+{:.0%})".format(benefit)
        elif benefit > 0.05:
            return "Les visuels vous aident modérément - utilisez-les pour les concepts difficiles"
        elif benefit > -0.05:
            return "Les deux modes fonctionnent bien pour vous - variez selon le contenu"
        else:
            return "Vous êtes plus efficace avec les explications textuelles - focus sur la compréhension verbale"


# Instance globale
dual_coding_engine = DualCodingEngine()
