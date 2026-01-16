"""
🧩 CHUNKING ENGINE
Basé sur la théorie du Chunking de Miller (1956)

Principe scientifique:
- La mémoire de travail a une capacité limitée: 7 ± 2 éléments (Miller's Law)
- Recherche récente (Cowan, 2001): plus proche de 4 ± 1 chunks
- Le "chunking" regroupe les éléments en unités significatives
- Un expert "chunk" plus efficacement qu'un novice (Chase & Simon, 1973 - échecs)

Recherche:
- Miller (1956): "The Magical Number Seven, Plus or Minus Two"
- Cowan (2001): "The magical number 4 in short-term memory"
- Chase & Simon (1973): Chunking expertise in chess
- Gobet et al. (2001): Chunks in expert memory

Implémentation:
- Détecte et crée des chunks logiques dans le contenu
- Adapte la taille des chunks au niveau de l'apprenant
- Track les chunks maîtrisés pour créer des super-chunks
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
import re

logger = logging.getLogger(__name__)


class ChunkType(Enum):
    """Types de chunks"""
    ATOMIC = "atomic"           # Élément indivisible
    SEMANTIC = "semantic"       # Groupe par sens
    PROCEDURAL = "procedural"   # Groupe par étapes
    HIERARCHICAL = "hierarchical"  # Groupe par niveau
    ACRONYM = "acronym"         # Regroupé par acronyme
    PATTERN = "pattern"         # Regroupé par pattern récurrent
    NARRATIVE = "narrative"     # Regroupé par histoire
    SPATIAL = "spatial"         # Regroupé par position/lieu


class ExpertiseLevel(Enum):
    """Niveau d'expertise (affecte la taille optimale des chunks)"""
    NOVICE = "novice"           # 3-4 items par chunk
    INTERMEDIATE = "intermediate"  # 5-6 items
    ADVANCED = "advanced"       # 7-9 items
    EXPERT = "expert"           # 10+ items (super-chunks)


# Capacité de working memory par niveau
CHUNK_CAPACITY: Dict[ExpertiseLevel, Tuple[int, int]] = {
    ExpertiseLevel.NOVICE: (3, 4),
    ExpertiseLevel.INTERMEDIATE: (4, 6),
    ExpertiseLevel.ADVANCED: (6, 8),
    ExpertiseLevel.EXPERT: (8, 12),
}


@dataclass
class Chunk:
    """Un chunk de connaissances"""
    id: str
    name: str
    items: List[str]              # Éléments dans ce chunk
    chunk_type: ChunkType
    parent_chunk: Optional[str] = None  # Pour super-chunks
    child_chunks: List[str] = field(default_factory=list)
    semantic_label: str = ""      # Label pour identifier le chunk
    mnemonic: Optional[str] = None  # Aide-mémoire
    mastery: float = 0.0          # 0-1, maîtrise du chunk
    practice_count: int = 0
    last_practiced: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ChunkedContent:
    """Contenu découpé en chunks optimaux"""
    original_content: str
    chunks: List[Chunk]
    total_items: int
    chunk_count: int
    recommended_learning_order: List[str]  # IDs des chunks dans l'ordre
    estimated_sessions: int       # Sessions estimées pour maîtriser
    working_memory_load: float    # 0-1, charge cognitive estimée
    expertise_level_used: ExpertiseLevel


@dataclass
class UserChunkingProfile:
    """Profil de chunking par utilisateur"""
    user_id: str
    expertise_level: ExpertiseLevel = ExpertiseLevel.NOVICE
    mastered_chunks: Dict[str, float] = field(default_factory=dict)  # chunk_id → mastery
    super_chunks_formed: int = 0
    optimal_chunk_size: int = 4   # Taille optimale détectée
    practice_history: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class ChunkingEngine:
    """
    Moteur de chunking cognitif.

    Découpe automatiquement le contenu en chunks optimaux pour
    la mémoire de travail, et adapte selon l'expertise de l'utilisateur.
    """

    def __init__(self):
        self._user_profiles: Dict[str, UserChunkingProfile] = {}
        self._chunks_db: Dict[str, Chunk] = {}  # Tous les chunks créés

        # Patterns pour détecter les structures naturelles
        self._list_pattern = re.compile(r'^\s*[-•*]\s+|^\s*\d+[.)]\s+', re.MULTILINE)
        self._section_pattern = re.compile(r'^#{1,6}\s+|^[A-Z][A-Za-z\s]+:\s*$', re.MULTILINE)

        logger.info("🧩 Chunking Engine initialized")

    def _get_user_profile(self, user_id: str) -> UserChunkingProfile:
        """Récupère ou crée le profil utilisateur"""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserChunkingProfile(user_id=user_id)
        return self._user_profiles[user_id]

    def _generate_chunk_id(self, content_hash: str, index: int) -> str:
        """Génère un ID unique pour un chunk"""
        return f"chunk_{hash(content_hash) % 10000}_{index}"

    def detect_expertise_from_mastery(self, mastery: float) -> ExpertiseLevel:
        """
        Détecte le niveau d'expertise basé sur la maîtrise.

        Args:
            mastery: Niveau de maîtrise 0-100

        Returns:
            ExpertiseLevel approprié
        """
        if mastery < 30:
            return ExpertiseLevel.NOVICE
        elif mastery < 60:
            return ExpertiseLevel.INTERMEDIATE
        elif mastery < 85:
            return ExpertiseLevel.ADVANCED
        else:
            return ExpertiseLevel.EXPERT

    def get_optimal_chunk_size(
        self,
        user_id: Optional[str] = None,
        expertise: Optional[ExpertiseLevel] = None
    ) -> int:
        """
        Retourne la taille optimale de chunk pour l'utilisateur.

        Args:
            user_id: ID utilisateur
            expertise: Niveau d'expertise override

        Returns:
            Taille optimale (nombre d'items par chunk)
        """
        if user_id:
            profile = self._get_user_profile(user_id)
            if profile.optimal_chunk_size > 0:
                return profile.optimal_chunk_size
            expertise = profile.expertise_level

        if not expertise:
            expertise = ExpertiseLevel.NOVICE

        min_size, max_size = CHUNK_CAPACITY[expertise]
        return (min_size + max_size) // 2

    def extract_items(self, content: str) -> List[str]:
        """
        Extrait les items individuels du contenu.

        Args:
            content: Le contenu à analyser

        Returns:
            Liste des items identifiés
        """
        items = []

        # 1. Chercher les listes (bullets, numéros)
        if self._list_pattern.search(content):
            # Séparer par lignes et filtrer les items de liste
            for line in content.split('\n'):
                line = line.strip()
                if self._list_pattern.match(line):
                    # Retirer le préfixe de liste
                    item = self._list_pattern.sub('', line).strip()
                    if item:
                        items.append(item)

        # 2. Si pas de liste, séparer par phrases
        if not items:
            # Séparer par .!? mais garder les abréviations
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', content)
            items = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]

        # 3. Si toujours rien, séparer par virgules/points-virgules
        if not items:
            items = [i.strip() for i in re.split(r'[,;]', content) if i.strip()]

        return items

    def create_semantic_chunks(
        self,
        items: List[str],
        chunk_size: int,
        content_topic: str = ""
    ) -> List[Chunk]:
        """
        Crée des chunks sémantiquement cohérents.

        Args:
            items: Liste des items à chunker
            chunk_size: Taille cible par chunk
            content_topic: Topic pour le naming

        Returns:
            Liste de Chunks
        """
        chunks = []
        current_items = []
        chunk_index = 0

        for i, item in enumerate(items):
            current_items.append(item)

            # Créer un nouveau chunk quand on atteint la taille
            if len(current_items) >= chunk_size or i == len(items) - 1:
                chunk_id = self._generate_chunk_id(content_topic, chunk_index)

                # Générer un label sémantique
                semantic_label = self._generate_semantic_label(current_items, chunk_index)

                # Générer un mnémonique si possible
                mnemonic = self._generate_chunk_mnemonic(current_items)

                chunk = Chunk(
                    id=chunk_id,
                    name=f"{content_topic} - Partie {chunk_index + 1}" if content_topic else f"Chunk {chunk_index + 1}",
                    items=current_items.copy(),
                    chunk_type=ChunkType.SEMANTIC,
                    semantic_label=semantic_label,
                    mnemonic=mnemonic
                )

                chunks.append(chunk)
                self._chunks_db[chunk_id] = chunk

                current_items = []
                chunk_index += 1

        return chunks

    def _generate_semantic_label(self, items: List[str], index: int) -> str:
        """Génère un label sémantique pour le chunk"""
        if not items:
            return f"Groupe {index + 1}"

        # Extraire les premiers mots de chaque item
        first_words = []
        for item in items[:3]:
            words = item.split()[:2]
            first_words.extend(words)

        # Créer un label basé sur les mots communs ou les premiers
        if first_words:
            return " / ".join(first_words[:3])

        return f"Groupe {index + 1}"

    def _generate_chunk_mnemonic(self, items: List[str]) -> Optional[str]:
        """Génère un mnémonique pour le chunk (acronyme ou phrase)"""
        if len(items) < 2:
            return None

        # Prendre les premières lettres
        initials = []
        for item in items:
            words = item.split()
            if words:
                initials.append(words[0][0].upper())

        if len(initials) >= 2:
            acronym = "".join(initials)
            # Vérifier si ça forme quelque chose de prononçable
            if len(acronym) <= 6:
                return f"🔤 Mémo: {acronym}"

        return None

    def chunk_content(
        self,
        content: str,
        topic: str = "",
        user_id: Optional[str] = None,
        mastery: float = 0
    ) -> ChunkedContent:
        """
        Découpe le contenu en chunks optimaux pour l'apprentissage.

        Args:
            content: Le contenu à découper
            topic: Topic/sujet du contenu
            user_id: ID utilisateur pour personnalisation
            mastery: Niveau de maîtrise actuel (0-100)

        Returns:
            ChunkedContent avec tous les chunks
        """
        # 1. Déterminer le niveau d'expertise
        expertise = self.detect_expertise_from_mastery(mastery)
        if user_id:
            profile = self._get_user_profile(user_id)
            # Utiliser le niveau du profil s'il est plus élevé
            if profile.expertise_level.value > expertise.value:
                expertise = profile.expertise_level

        # 2. Obtenir la taille optimale de chunk
        chunk_size = self.get_optimal_chunk_size(user_id, expertise)

        # 3. Extraire les items
        items = self.extract_items(content)

        if not items:
            # Fallback: traiter le contenu entier comme un seul item
            items = [content]

        # 4. Créer les chunks
        chunks = self.create_semantic_chunks(items, chunk_size, topic)

        # 5. Calculer la charge cognitive
        # Cowan (2001): 4 chunks = 100% charge
        working_memory_load = min(1.0, len(chunks) / 4)

        # 6. Ordre d'apprentissage recommandé
        # Simple: ordre séquentiel (pourrait être amélioré)
        learning_order = [chunk.id for chunk in chunks]

        # 7. Estimer les sessions nécessaires
        # Heuristique: 3-4 chunks par session, révision 3x
        sessions_per_round = max(1, len(chunks) // 3)
        estimated_sessions = sessions_per_round * 3  # 3 rounds de révision

        return ChunkedContent(
            original_content=content,
            chunks=chunks,
            total_items=len(items),
            chunk_count=len(chunks),
            recommended_learning_order=learning_order,
            estimated_sessions=estimated_sessions,
            working_memory_load=working_memory_load,
            expertise_level_used=expertise
        )

    def create_super_chunk(
        self,
        user_id: str,
        chunk_ids: List[str],
        name: str
    ) -> Optional[Chunk]:
        """
        Crée un super-chunk à partir de chunks maîtrisés.

        Quand plusieurs chunks sont bien maîtrisés, ils peuvent être
        combinés en un seul "super-chunk" libérant de la working memory.

        Args:
            user_id: ID utilisateur
            chunk_ids: IDs des chunks à combiner
            name: Nom du super-chunk

        Returns:
            Le super-chunk créé ou None si échec
        """
        profile = self._get_user_profile(user_id)

        # Vérifier que tous les chunks existent et sont maîtrisés
        chunks_to_combine = []
        for chunk_id in chunk_ids:
            if chunk_id not in self._chunks_db:
                logger.warning(f"Chunk {chunk_id} not found")
                return None

            chunk = self._chunks_db[chunk_id]
            mastery = profile.mastered_chunks.get(chunk_id, chunk.mastery)

            if mastery < 0.8:  # Besoin de 80% de maîtrise
                logger.info(f"Chunk {chunk_id} not mastered enough ({mastery:.0%})")
                return None

            chunks_to_combine.append(chunk)

        # Créer le super-chunk
        super_chunk_id = f"super_{hash(tuple(chunk_ids)) % 10000}"

        all_items = []
        for chunk in chunks_to_combine:
            all_items.extend(chunk.items)

        super_chunk = Chunk(
            id=super_chunk_id,
            name=name,
            items=all_items,
            chunk_type=ChunkType.HIERARCHICAL,
            child_chunks=chunk_ids,
            semantic_label=f"Super-chunk: {name}",
            mnemonic=f"🏆 {name} ({len(chunks_to_combine)} concepts combinés)"
        )

        # Marquer les chunks enfants
        for chunk in chunks_to_combine:
            chunk.parent_chunk = super_chunk_id

        self._chunks_db[super_chunk_id] = super_chunk
        profile.super_chunks_formed += 1
        profile.updated_at = datetime.now()

        logger.info(f"🏆 Super-chunk created: {name} from {len(chunks_to_combine)} chunks")

        return super_chunk

    def record_practice(
        self,
        user_id: str,
        chunk_id: str,
        was_recalled: bool,
        response_time: float
    ) -> Dict[str, Any]:
        """
        Enregistre une pratique de chunk.

        Args:
            user_id: ID utilisateur
            chunk_id: ID du chunk pratiqué
            was_recalled: Si correctement rappelé
            response_time: Temps de réponse en secondes

        Returns:
            Dict avec mise à jour du mastery et recommandations
        """
        profile = self._get_user_profile(user_id)

        if chunk_id not in self._chunks_db:
            return {"error": "Chunk not found"}

        chunk = self._chunks_db[chunk_id]
        current_mastery = profile.mastered_chunks.get(chunk_id, 0.0)

        # Mise à jour de la maîtrise
        if was_recalled:
            # Bonus pour rapidité (< 10 sec = très bon)
            speed_bonus = max(0, (10 - response_time) / 10) * 0.1
            gain = 0.15 + speed_bonus
            new_mastery = min(1.0, current_mastery + gain)
        else:
            new_mastery = max(0, current_mastery - 0.1)

        profile.mastered_chunks[chunk_id] = new_mastery
        chunk.mastery = new_mastery
        chunk.practice_count += 1
        chunk.last_practiced = datetime.now()

        # Enregistrer dans l'historique
        profile.practice_history.append({
            "chunk_id": chunk_id,
            "was_recalled": was_recalled,
            "response_time": response_time,
            "mastery_after": new_mastery,
            "timestamp": datetime.now().isoformat()
        })

        # Vérifier si on peut créer un super-chunk
        can_super_chunk = False
        if new_mastery >= 0.8 and chunk.parent_chunk is None:
            # Chercher des chunks "frères" bien maîtrisés
            sibling_ids = self._find_sibling_chunks(chunk_id, profile)
            if len(sibling_ids) >= 2:
                can_super_chunk = True

        # Ajuster la taille optimale de chunk
        self._adjust_optimal_chunk_size(profile)

        profile.updated_at = datetime.now()

        return {
            "chunk_id": chunk_id,
            "previous_mastery": current_mastery,
            "new_mastery": new_mastery,
            "chunk_practice_count": chunk.practice_count,
            "can_form_super_chunk": can_super_chunk,
            "recommendation": self._get_practice_recommendation(profile, chunk)
        }

    def _find_sibling_chunks(
        self,
        chunk_id: str,
        profile: UserChunkingProfile
    ) -> List[str]:
        """Trouve des chunks "frères" bien maîtrisés"""
        siblings = []

        for cid, mastery in profile.mastered_chunks.items():
            if cid != chunk_id and mastery >= 0.8:
                chunk = self._chunks_db.get(cid)
                if chunk and chunk.parent_chunk is None:
                    siblings.append(cid)

        return siblings[:3]  # Max 3 siblings

    def _adjust_optimal_chunk_size(self, profile: UserChunkingProfile) -> None:
        """Ajuste la taille optimale de chunk basé sur la performance"""
        if len(profile.practice_history) < 10:
            return

        # Analyser les 20 dernières pratiques
        recent = profile.practice_history[-20:]
        success_rate = sum(1 for p in recent if p["was_recalled"]) / len(recent)

        if success_rate > 0.85:
            # Très bon → augmenter la taille des chunks
            profile.optimal_chunk_size = min(10, profile.optimal_chunk_size + 1)
            profile.expertise_level = ExpertiseLevel(
                min(3, list(ExpertiseLevel).index(profile.expertise_level) + 1)
            )
        elif success_rate < 0.6:
            # Difficile → réduire la taille
            profile.optimal_chunk_size = max(3, profile.optimal_chunk_size - 1)
            profile.expertise_level = ExpertiseLevel(
                max(0, list(ExpertiseLevel).index(profile.expertise_level) - 1)
            )

    def _get_practice_recommendation(
        self,
        profile: UserChunkingProfile,
        chunk: Chunk
    ) -> str:
        """Génère une recommandation de pratique"""
        if chunk.mastery >= 0.9:
            return "🏆 Excellent! Ce chunk est bien ancré. Passez à de nouveaux contenus."
        elif chunk.mastery >= 0.7:
            return "📈 Bonne progression. Une révision espacée renforcera la mémorisation."
        elif chunk.mastery >= 0.5:
            return "🔄 Continuez à pratiquer. Essayez de verbaliser le contenu à voix haute."
        else:
            return "💡 Décomposez ce chunk en parties plus petites si nécessaire."

    def get_chunk_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un chunk par son ID"""
        chunk = self._chunks_db.get(chunk_id)
        if not chunk:
            return None

        return {
            "id": chunk.id,
            "name": chunk.name,
            "items": chunk.items,
            "type": chunk.chunk_type.value,
            "semantic_label": chunk.semantic_label,
            "mnemonic": chunk.mnemonic,
            "mastery": chunk.mastery,
            "practice_count": chunk.practice_count,
            "parent_chunk": chunk.parent_chunk,
            "child_chunks": chunk.child_chunks
        }

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retourne le profil chunking de l'utilisateur"""
        profile = self._get_user_profile(user_id)

        return {
            "user_id": profile.user_id,
            "expertise_level": profile.expertise_level.value,
            "optimal_chunk_size": profile.optimal_chunk_size,
            "super_chunks_formed": profile.super_chunks_formed,
            "mastered_chunks_count": sum(1 for m in profile.mastered_chunks.values() if m >= 0.8),
            "total_chunks_practiced": len(profile.mastered_chunks),
            "working_memory_capacity": CHUNK_CAPACITY[profile.expertise_level],
            "recommendation": self._get_overall_recommendation(profile)
        }

    def _get_overall_recommendation(self, profile: UserChunkingProfile) -> str:
        """Recommandation globale"""
        mastered = sum(1 for m in profile.mastered_chunks.values() if m >= 0.8)

        if mastered >= 10 and profile.super_chunks_formed < 2:
            return "🏆 Vous avez maîtrisé beaucoup de chunks! Essayez de les combiner en super-chunks."
        elif profile.expertise_level == ExpertiseLevel.NOVICE:
            return "📚 Gardez des chunks de 3-4 éléments pour bien mémoriser."
        elif profile.expertise_level == ExpertiseLevel.EXPERT:
            return "🎯 Expert level! Vous pouvez gérer des chunks complexes de 8+ éléments."
        else:
            return "📈 Bonne progression. Continuez à pratiquer régulièrement."


# Instance globale
chunking_engine = ChunkingEngine()
