"""
Skill Graph Database - Système de compétences avec relations et prérequis.

Architecture:
- skills: Compétences avec catégories et niveaux
- skill_relations: Relations entre compétences (prérequis, similaires)
- user_skills: Maîtrise utilisateur avec decay temporel

Ce module remplace le simple topic_mastery par un système structuré
qui permet:
- Graphe de prérequis (pas de React sans JS)
- Decay temporel (oubli progressif)
- Détection de gaps (compétences manquantes)
- Suggestions de parcours optimaux
"""

import sqlite3
import json
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

logger = logging.getLogger(__name__)

# Database path
DB_PATH = Path(__file__).parent / "skill_graph.db"


class SkillCategory(str, Enum):
    """Catégories de compétences."""
    PROGRAMMING = "programming"
    FRAMEWORK = "framework"
    DATABASE = "database"
    DEVOPS = "devops"
    DESIGN = "design"
    SOFT_SKILL = "soft_skill"
    LANGUAGE = "language"
    MATH = "math"
    SCIENCE = "science"
    OTHER = "other"


class RelationType(str, Enum):
    """Types de relations entre compétences."""
    REQUIRES = "requires"      # A requiert B (prérequis strict)
    RECOMMENDS = "recommends"  # A recommande B (prérequis souple)
    SIMILAR = "similar"        # A et B sont similaires
    INCLUDES = "includes"      # A inclut B (parent-enfant)


@dataclass
class Skill:
    """Représente une compétence."""
    id: str
    name: str
    category: SkillCategory
    level: int = 1  # 1-5 (difficulté/complexité)
    tier: int = 0   # 0-3 (position dans la carte: Fondations→Expert)
    domain: str = ""  # Domaine d'origine (ex: "Python", "React")
    description: str = ""
    keywords: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class SkillRelation:
    """Relation entre deux compétences."""
    skill_id: str
    related_skill_id: str
    relation_type: RelationType
    strength: float = 1.0  # 0-1, importance de la relation


@dataclass
class UserSkill:
    """Maîtrise d'une compétence par un utilisateur."""
    user_id: str
    skill_id: str
    mastery: float  # 0-100
    last_practiced: datetime
    practice_count: int = 0
    decay_rate: float = 0.1  # Taux d'oubli par jour


@dataclass
class SkillGap:
    """Représente un gap de compétence détecté."""
    skill: Skill
    current_mastery: float
    required_mastery: float
    gap: float
    is_prerequisite: bool = False
    blocking_skills: List[str] = field(default_factory=list)


# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_connection() -> sqlite3.Connection:
    """Get database connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Skills table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            tier INTEGER DEFAULT 0,
            domain TEXT DEFAULT '',
            description TEXT,
            keywords TEXT,  -- JSON array
            created_at TEXT
        )
    """)

    # Skill relations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_relations (
            skill_id TEXT,
            related_skill_id TEXT,
            relation_type TEXT NOT NULL,
            strength REAL DEFAULT 1.0,
            PRIMARY KEY (skill_id, related_skill_id, relation_type),
            FOREIGN KEY (skill_id) REFERENCES skills(id),
            FOREIGN KEY (related_skill_id) REFERENCES skills(id)
        )
    """)

    # User skills table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_skills (
            user_id TEXT,
            skill_id TEXT,
            mastery REAL DEFAULT 0,
            last_practiced TEXT,
            practice_count INTEGER DEFAULT 0,
            decay_rate REAL DEFAULT 0.1,
            PRIMARY KEY (user_id, skill_id),
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        )
    """)

    # Skill aliases for fuzzy matching
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_aliases (
            alias TEXT PRIMARY KEY,
            skill_id TEXT,
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        )
    """)

    # Domain maps table (cartes de domaines générées par IA)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS domain_maps (
            id TEXT PRIMARY KEY,
            domain TEXT NOT NULL,
            title TEXT,
            user_id TEXT,
            created_at TEXT,
            UNIQUE(domain, user_id)
        )
    """)

    # Domain map skills (liens entre carte et compétences avec tier)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS domain_map_skills (
            domain_map_id TEXT,
            skill_id TEXT,
            tier INTEGER DEFAULT 0,
            PRIMARY KEY (domain_map_id, skill_id),
            FOREIGN KEY (domain_map_id) REFERENCES domain_maps(id),
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        )
    """)

    # Migration: Add tier and domain columns if missing
    try:
        cursor.execute("SELECT tier FROM skills LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE skills ADD COLUMN tier INTEGER DEFAULT 0")
        logger.info("Migration: Added 'tier' column to skills table")

    try:
        cursor.execute("SELECT domain FROM skills LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE skills ADD COLUMN domain TEXT DEFAULT ''")
        logger.info("Migration: Added 'domain' column to skills table")

    # Indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_skills_user
        ON user_skills (user_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_skill_relations_skill
        ON skill_relations (skill_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_skills_category
        ON skills (category)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_skills_domain
        ON skills (domain)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_domain_maps_user
        ON domain_maps (user_id)
    """)

    conn.commit()
    conn.close()

    # Seed initial skills if empty
    _seed_initial_skills()

    logger.info("Skill Graph DB initialized")


def _seed_initial_skills():
    """Seed database with common programming skills."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM skills")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # Common skills with relations
    skills_data = [
        # Programming fundamentals
        ("variables", "Variables", "programming", 1, ["var", "let", "const", "variable"]),
        ("conditions", "Conditions", "programming", 1, ["if", "else", "switch", "condition"]),
        ("loops", "Boucles", "programming", 1, ["for", "while", "loop", "iteration"]),
        ("functions", "Fonctions", "programming", 2, ["function", "def", "method", "procedure"]),
        ("arrays", "Tableaux", "programming", 2, ["array", "list", "tableau"]),
        ("objects", "Objets", "programming", 2, ["object", "dict", "dictionary", "objet"]),
        ("oop", "POO", "programming", 3, ["class", "inheritance", "polymorphism", "encapsulation"]),
        ("async", "Asynchrone", "programming", 3, ["async", "await", "promise", "callback"]),
        ("algorithms", "Algorithmes", "programming", 3, ["algorithm", "sort", "search", "complexity"]),
        ("data_structures", "Structures de données", "programming", 3, ["tree", "graph", "stack", "queue"]),

        # Languages
        ("javascript", "JavaScript", "language", 2, ["js", "javascript", "ecmascript"]),
        ("python", "Python", "language", 2, ["python", "py"]),
        ("typescript", "TypeScript", "language", 3, ["ts", "typescript"]),
        ("html", "HTML", "language", 1, ["html", "markup"]),
        ("css", "CSS", "language", 1, ["css", "style", "stylesheet"]),
        ("sql", "SQL", "database", 2, ["sql", "query", "database"]),

        # Frameworks
        ("react", "React", "framework", 3, ["react", "jsx", "hooks", "component"]),
        ("vue", "Vue.js", "framework", 3, ["vue", "vuejs", "composition"]),
        ("node", "Node.js", "framework", 3, ["node", "nodejs", "express"]),
        ("fastapi", "FastAPI", "framework", 3, ["fastapi", "api", "pydantic"]),
        ("django", "Django", "framework", 3, ["django", "orm"]),

        # DevOps
        ("git", "Git", "devops", 2, ["git", "version control", "github", "gitlab"]),
        ("docker", "Docker", "devops", 3, ["docker", "container", "dockerfile"]),
        ("ci_cd", "CI/CD", "devops", 3, ["ci", "cd", "pipeline", "github actions"]),

        # Database
        ("database_design", "Conception BDD", "database", 3, ["schema", "normalization", "erd"]),
        ("nosql", "NoSQL", "database", 3, ["mongodb", "redis", "nosql"]),

        # Design
        ("ui_design", "UI Design", "design", 2, ["ui", "interface", "design"]),
        ("ux_design", "UX Design", "design", 3, ["ux", "user experience", "usability"]),
    ]

    for skill_id, name, category, level, keywords in skills_data:
        cursor.execute("""
            INSERT INTO skills (id, name, category, level, keywords, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (skill_id, name, category, level, json.dumps(keywords), datetime.now().isoformat()))

        # Add aliases
        for kw in keywords:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO skill_aliases (alias, skill_id)
                    VALUES (?, ?)
                """, (kw.lower(), skill_id))
            except:
                pass

    # Relations (prerequisites)
    relations = [
        # Programming progression
        ("conditions", "variables", "requires"),
        ("loops", "variables", "requires"),
        ("loops", "conditions", "requires"),
        ("functions", "variables", "requires"),
        ("functions", "conditions", "requires"),
        ("arrays", "variables", "requires"),
        ("objects", "variables", "requires"),
        ("oop", "functions", "requires"),
        ("oop", "objects", "requires"),
        ("async", "functions", "requires"),
        ("algorithms", "loops", "requires"),
        ("algorithms", "arrays", "requires"),
        ("data_structures", "arrays", "requires"),
        ("data_structures", "objects", "requires"),

        # JavaScript ecosystem
        ("javascript", "variables", "requires"),
        ("javascript", "functions", "requires"),
        ("typescript", "javascript", "requires"),
        ("react", "javascript", "requires"),
        ("react", "html", "requires"),
        ("react", "css", "recommends"),
        ("vue", "javascript", "requires"),
        ("vue", "html", "requires"),
        ("node", "javascript", "requires"),
        ("node", "async", "recommends"),

        # Python ecosystem
        ("python", "variables", "requires"),
        ("python", "functions", "requires"),
        ("fastapi", "python", "requires"),
        ("fastapi", "async", "recommends"),
        ("django", "python", "requires"),
        ("django", "sql", "recommends"),

        # Database
        ("sql", "variables", "requires"),
        ("database_design", "sql", "requires"),
        ("nosql", "objects", "requires"),

        # DevOps
        ("docker", "git", "recommends"),
        ("ci_cd", "git", "requires"),
        ("ci_cd", "docker", "recommends"),

        # Similarities
        ("react", "vue", "similar"),
        ("fastapi", "django", "similar"),
        ("javascript", "typescript", "similar"),
    ]

    for skill_id, related_id, rel_type in relations:
        cursor.execute("""
            INSERT OR IGNORE INTO skill_relations (skill_id, related_skill_id, relation_type)
            VALUES (?, ?, ?)
        """, (skill_id, related_id, rel_type))

    conn.commit()
    conn.close()
    logger.info("Seeded initial skills and relations")


# ============================================================================
# SKILL CRUD
# ============================================================================

def get_skill(skill_id: str) -> Optional[Skill]:
    """Get a skill by ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM skills WHERE id = ?", (skill_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return Skill(
        id=row["id"],
        name=row["name"],
        category=SkillCategory(row["category"]),
        level=row["level"],
        description=row["description"] or "",
        keywords=json.loads(row["keywords"]) if row["keywords"] else [],
        created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now()
    )


def get_all_skills(category: Optional[str] = None) -> List[Skill]:
    """Get all skills, optionally filtered by category."""
    conn = get_connection()
    cursor = conn.cursor()

    if category:
        cursor.execute("SELECT * FROM skills WHERE category = ?", (category,))
    else:
        cursor.execute("SELECT * FROM skills ORDER BY category, level, name")

    rows = cursor.fetchall()
    conn.close()

    return [
        Skill(
            id=row["id"],
            name=row["name"],
            category=SkillCategory(row["category"]),
            level=row["level"],
            description=row["description"] or "",
            keywords=json.loads(row["keywords"]) if row["keywords"] else []
        )
        for row in rows
    ]


def find_skill_by_keyword(keyword: str) -> Optional[Skill]:
    """Find a skill by keyword or alias (fuzzy matching)."""
    conn = get_connection()
    cursor = conn.cursor()

    keyword_lower = keyword.lower().strip()

    # Try exact alias match first
    cursor.execute("""
        SELECT skill_id FROM skill_aliases WHERE alias = ?
    """, (keyword_lower,))
    row = cursor.fetchone()

    if row:
        conn.close()
        return get_skill(row["skill_id"])

    # Try skill ID match
    cursor.execute("SELECT * FROM skills WHERE LOWER(id) = ?", (keyword_lower,))
    row = cursor.fetchone()

    if row:
        conn.close()
        return Skill(
            id=row["id"],
            name=row["name"],
            category=SkillCategory(row["category"]),
            level=row["level"],
            keywords=json.loads(row["keywords"]) if row["keywords"] else []
        )

    # Try name match (partial)
    cursor.execute("""
        SELECT * FROM skills WHERE LOWER(name) LIKE ?
    """, (f"%{keyword_lower}%",))
    row = cursor.fetchone()

    if row:
        conn.close()
        return Skill(
            id=row["id"],
            name=row["name"],
            category=SkillCategory(row["category"]),
            level=row["level"],
            keywords=json.loads(row["keywords"]) if row["keywords"] else []
        )

    # Try keyword search in JSON
    cursor.execute("SELECT * FROM skills")
    for row in cursor.fetchall():
        keywords = json.loads(row["keywords"]) if row["keywords"] else []
        for kw in keywords:
            if keyword_lower in kw.lower() or kw.lower() in keyword_lower:
                conn.close()
                return Skill(
                    id=row["id"],
                    name=row["name"],
                    category=SkillCategory(row["category"]),
                    level=row["level"],
                    keywords=keywords
                )

    conn.close()
    return None


def add_skill(skill: Skill) -> bool:
    """Add a new skill."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO skills (id, name, category, level, description, keywords, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            skill.id,
            skill.name,
            skill.category.value,
            skill.level,
            skill.description,
            json.dumps(skill.keywords),
            skill.created_at.isoformat()
        ))

        # Add aliases
        for kw in skill.keywords:
            cursor.execute("""
                INSERT OR IGNORE INTO skill_aliases (alias, skill_id)
                VALUES (?, ?)
            """, (kw.lower(), skill.id))

        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error adding skill: {e}")
        return False
    finally:
        conn.close()


# ============================================================================
# SKILL RELATIONS
# ============================================================================

def get_prerequisites(skill_id: str, include_recommended: bool = False) -> List[Skill]:
    """Get prerequisites for a skill."""
    conn = get_connection()
    cursor = conn.cursor()

    relation_types = ["requires"]
    if include_recommended:
        relation_types.append("recommends")

    placeholders = ",".join("?" * len(relation_types))
    cursor.execute(f"""
        SELECT related_skill_id FROM skill_relations
        WHERE skill_id = ? AND relation_type IN ({placeholders})
    """, [skill_id] + relation_types)

    prereq_ids = [row["related_skill_id"] for row in cursor.fetchall()]
    conn.close()

    return [get_skill(pid) for pid in prereq_ids if get_skill(pid)]


def get_dependent_skills(skill_id: str) -> List[Skill]:
    """Get skills that depend on this skill."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT skill_id FROM skill_relations
        WHERE related_skill_id = ? AND relation_type IN ('requires', 'recommends')
    """, (skill_id,))

    dep_ids = [row["skill_id"] for row in cursor.fetchall()]
    conn.close()

    return [get_skill(did) for did in dep_ids if get_skill(did)]


def get_similar_skills(skill_id: str) -> List[Skill]:
    """Get skills similar to this one."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT related_skill_id FROM skill_relations
        WHERE skill_id = ? AND relation_type = 'similar'
        UNION
        SELECT skill_id FROM skill_relations
        WHERE related_skill_id = ? AND relation_type = 'similar'
    """, (skill_id, skill_id))

    similar_ids = [row[0] for row in cursor.fetchall()]
    conn.close()

    return [get_skill(sid) for sid in similar_ids if get_skill(sid)]


def add_relation(skill_id: str, related_id: str, relation_type: RelationType, strength: float = 1.0):
    """Add a relation between skills."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO skill_relations (skill_id, related_skill_id, relation_type, strength)
        VALUES (?, ?, ?, ?)
    """, (skill_id, related_id, relation_type.value, strength))

    conn.commit()
    conn.close()


# ============================================================================
# USER SKILLS (with decay)
# ============================================================================

def get_user_skill(user_id: str, skill_id: str) -> Optional[UserSkill]:
    """Get user's mastery of a skill."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?
    """, (user_id, skill_id))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return UserSkill(
        user_id=row["user_id"],
        skill_id=row["skill_id"],
        mastery=row["mastery"],
        last_practiced=datetime.fromisoformat(row["last_practiced"]) if row["last_practiced"] else datetime.now(),
        practice_count=row["practice_count"],
        decay_rate=row["decay_rate"]
    )


def get_user_skills(user_id: str) -> Dict[str, UserSkill]:
    """Get all skills for a user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM user_skills WHERE user_id = ?
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    return {
        row["skill_id"]: UserSkill(
            user_id=row["user_id"],
            skill_id=row["skill_id"],
            mastery=row["mastery"],
            last_practiced=datetime.fromisoformat(row["last_practiced"]) if row["last_practiced"] else datetime.now(),
            practice_count=row["practice_count"],
            decay_rate=row["decay_rate"]
        )
        for row in rows
    }


def calculate_decayed_mastery(user_skill: UserSkill) -> float:
    """
    Calculate current mastery with decay.

    Uses exponential decay: mastery * e^(-decay_rate * days_since_practice)
    """
    if not user_skill.last_practiced:
        return user_skill.mastery

    days_since = (datetime.now() - user_skill.last_practiced).days
    if days_since <= 0:
        return user_skill.mastery

    # Exponential decay
    decayed = user_skill.mastery * math.exp(-user_skill.decay_rate * days_since)

    # Floor at 10% of original (never completely forget)
    min_mastery = user_skill.mastery * 0.1
    return max(decayed, min_mastery)


def update_user_skill(
    user_id: str,
    skill_id: str,
    mastery_delta: float = 0,
    is_practice: bool = True
) -> UserSkill:
    """
    Update user's skill mastery.

    Args:
        mastery_delta: Amount to add to mastery (can be negative)
        is_practice: Whether this counts as practice (resets decay)
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Get current or create new
    cursor.execute("""
        SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?
    """, (user_id, skill_id))
    row = cursor.fetchone()

    now = datetime.now()

    if row:
        current_mastery = row["mastery"]
        practice_count = row["practice_count"]
        decay_rate = row["decay_rate"]
    else:
        current_mastery = 0
        practice_count = 0
        decay_rate = 0.1

    # Calculate new mastery
    new_mastery = max(0, min(100, current_mastery + mastery_delta))

    # Update decay rate based on practice frequency (more practice = slower decay)
    if is_practice and practice_count > 5:
        decay_rate = max(0.02, decay_rate * 0.95)  # Reduce decay rate

    # Upsert
    cursor.execute("""
        INSERT INTO user_skills (user_id, skill_id, mastery, last_practiced, practice_count, decay_rate)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
            mastery = ?,
            last_practiced = ?,
            practice_count = practice_count + ?,
            decay_rate = ?
    """, (
        user_id, skill_id, new_mastery, now.isoformat(), practice_count + (1 if is_practice else 0), decay_rate,
        new_mastery, now.isoformat() if is_practice else row["last_practiced"] if row else now.isoformat(),
        1 if is_practice else 0, decay_rate
    ))

    conn.commit()
    conn.close()

    return UserSkill(
        user_id=user_id,
        skill_id=skill_id,
        mastery=new_mastery,
        last_practiced=now,
        practice_count=practice_count + (1 if is_practice else 0),
        decay_rate=decay_rate
    )


def get_user_skill_with_decay(user_id: str, skill_id: str) -> Tuple[float, Optional[UserSkill]]:
    """Get user's current mastery with decay applied."""
    user_skill = get_user_skill(user_id, skill_id)

    if not user_skill:
        return 0.0, None

    decayed_mastery = calculate_decayed_mastery(user_skill)
    return decayed_mastery, user_skill


# ============================================================================
# SKILL GAP ANALYSIS
# ============================================================================

def analyze_skill_gaps(
    user_id: str,
    required_skills: List[str],
    min_mastery: float = 60.0
) -> List[SkillGap]:
    """
    Analyze gaps between user's skills and required skills.

    Returns list of SkillGap sorted by priority (biggest gaps first).
    """
    gaps = []
    user_skills = get_user_skills(user_id)

    for skill_id in required_skills:
        skill = get_skill(skill_id)
        if not skill:
            # Try to find by keyword
            skill = find_skill_by_keyword(skill_id)
            if not skill:
                continue

        # Get current mastery with decay
        if skill.id in user_skills:
            current = calculate_decayed_mastery(user_skills[skill.id])
        else:
            current = 0.0

        # Check if gap exists
        if current < min_mastery:
            # Check prerequisites
            prereqs = get_prerequisites(skill.id, include_recommended=True)
            blocking = []

            for prereq in prereqs:
                prereq_mastery = 0.0
                if prereq.id in user_skills:
                    prereq_mastery = calculate_decayed_mastery(user_skills[prereq.id])

                if prereq_mastery < min_mastery * 0.8:  # Need 80% of required for prereqs
                    blocking.append(prereq.id)

            gaps.append(SkillGap(
                skill=skill,
                current_mastery=current,
                required_mastery=min_mastery,
                gap=min_mastery - current,
                is_prerequisite=False,
                blocking_skills=blocking
            ))

    # Sort by: prerequisites first, then by gap size
    gaps.sort(key=lambda g: (not g.blocking_skills, -g.gap))

    return gaps


def get_learning_path(
    user_id: str,
    target_skill_id: str,
    min_mastery: float = 60.0
) -> List[Skill]:
    """
    Get optimal learning path to acquire a skill.

    Returns ordered list of skills to learn (prerequisites first).
    """
    path = []
    visited = set()
    user_skills = get_user_skills(user_id)

    def _add_to_path(skill_id: str):
        if skill_id in visited:
            return

        visited.add(skill_id)
        skill = get_skill(skill_id)
        if not skill:
            return

        # Check if user already has this skill
        if skill_id in user_skills:
            mastery = calculate_decayed_mastery(user_skills[skill_id])
            if mastery >= min_mastery:
                return  # Already mastered

        # Add prerequisites first (recursive)
        prereqs = get_prerequisites(skill_id)
        for prereq in prereqs:
            _add_to_path(prereq.id)

        path.append(skill)

    _add_to_path(target_skill_id)
    return path


def get_recommended_next_skills(
    user_id: str,
    limit: int = 5
) -> List[Tuple[Skill, float]]:
    """
    Recommend next skills to learn based on current profile.

    Returns list of (skill, score) tuples.
    Score is based on: prerequisites met, skill level, potential unlocks.
    """
    user_skills = get_user_skills(user_id)
    all_skills = get_all_skills()
    recommendations = []

    for skill in all_skills:
        # Skip if already mastered
        if skill.id in user_skills:
            mastery = calculate_decayed_mastery(user_skills[skill.id])
            if mastery >= 60:
                continue

        # Check prerequisites
        prereqs = get_prerequisites(skill.id)
        prereqs_met = 0
        total_prereqs = len(prereqs)

        for prereq in prereqs:
            if prereq.id in user_skills:
                if calculate_decayed_mastery(user_skills[prereq.id]) >= 50:
                    prereqs_met += 1

        # Skip if prerequisites not met
        if total_prereqs > 0 and prereqs_met < total_prereqs * 0.8:
            continue

        # Calculate score
        # - More unlocks = better
        dependents = get_dependent_skills(skill.id)
        unlock_score = len(dependents) * 10

        # - Lower level = easier to learn now
        level_score = (6 - skill.level) * 5

        # - Category diversity bonus
        user_categories = set()
        for sid in user_skills:
            s = get_skill(sid)
            if s:
                user_categories.add(s.category)

        diversity_score = 15 if skill.category not in user_categories else 0

        total_score = unlock_score + level_score + diversity_score
        recommendations.append((skill, total_score))

    # Sort by score descending
    recommendations.sort(key=lambda x: -x[1])
    return recommendations[:limit]


# ============================================================================
# SKILL SUMMARY
# ============================================================================

def get_user_skill_summary(user_id: str) -> Dict[str, Any]:
    """Get comprehensive skill summary for a user."""
    user_skills = get_user_skills(user_id)

    # Calculate stats
    total_skills = len(user_skills)
    mastered_skills = 0
    learning_skills = 0
    rusty_skills = 0

    by_category = {}
    strongest = None
    strongest_mastery = 0
    weakest = None
    weakest_mastery = 100

    for skill_id, user_skill in user_skills.items():
        skill = get_skill(skill_id)
        if not skill:
            continue

        current_mastery = calculate_decayed_mastery(user_skill)

        if current_mastery >= 80:
            mastered_skills += 1
        elif current_mastery >= 40:
            learning_skills += 1
        else:
            rusty_skills += 1

        # Track by category
        cat = skill.category.value
        if cat not in by_category:
            by_category[cat] = {"count": 0, "avg_mastery": 0, "skills": []}
        by_category[cat]["count"] += 1
        by_category[cat]["skills"].append({
            "id": skill_id,
            "name": skill.name,
            "mastery": round(current_mastery, 1),
            "raw_mastery": round(user_skill.mastery, 1),
            "days_since_practice": (datetime.now() - user_skill.last_practiced).days if user_skill.last_practiced else 999
        })

        if current_mastery > strongest_mastery:
            strongest_mastery = current_mastery
            strongest = skill

        if current_mastery < weakest_mastery and current_mastery > 0:
            weakest_mastery = current_mastery
            weakest = skill

    # Calculate category averages
    for cat in by_category:
        skills = by_category[cat]["skills"]
        if skills:
            by_category[cat]["avg_mastery"] = round(
                sum(s["mastery"] for s in skills) / len(skills), 1
            )

    # Get recommendations
    recommendations = get_recommended_next_skills(user_id, limit=3)

    return {
        "total_skills": total_skills,
        "mastered": mastered_skills,
        "learning": learning_skills,
        "rusty": rusty_skills,
        "strongest": {
            "id": strongest.id,
            "name": strongest.name,
            "mastery": round(strongest_mastery, 1)
        } if strongest else None,
        "weakest": {
            "id": weakest.id,
            "name": weakest.name,
            "mastery": round(weakest_mastery, 1)
        } if weakest else None,
        "by_category": by_category,
        "recommendations": [
            {"id": s.id, "name": s.name, "score": score}
            for s, score in recommendations
        ]
    }


# ============================================================================
# DOMAIN MAPS - Cartes de domaines (niveaux 0-3)
# ============================================================================

@dataclass
class DomainMap:
    """Carte de domaine générée par IA."""
    id: str
    domain: str
    title: str
    user_id: str
    created_at: datetime = field(default_factory=datetime.now)


def save_domain_map(
    domain: str,
    title: str,
    user_id: str,
    skills_by_tier: Dict[int, List[Dict[str, str]]]
) -> str:
    """
    Sauvegarde une carte de domaine générée par IA.

    Args:
        domain: Nom du domaine (ex: "Python")
        title: Titre (ex: "Maîtriser Python")
        user_id: ID utilisateur
        skills_by_tier: Dict {tier: [{name, description}, ...]}
                        tier 0-3 (Fondations→Expert)

    Returns:
        ID de la domain_map créée
    """
    import uuid
    conn = get_connection()
    cursor = conn.cursor()

    # Générer ID unique
    domain_map_id = f"dm_{domain.lower().replace(' ', '_')}_{user_id}_{uuid.uuid4().hex[:8]}"
    now = datetime.now().isoformat()

    # Supprimer l'ancienne carte si elle existe
    cursor.execute("""
        DELETE FROM domain_map_skills WHERE domain_map_id IN (
            SELECT id FROM domain_maps WHERE domain = ? AND user_id = ?
        )
    """, (domain, user_id))
    cursor.execute("""
        DELETE FROM domain_maps WHERE domain = ? AND user_id = ?
    """, (domain, user_id))

    # Créer la nouvelle carte
    cursor.execute("""
        INSERT INTO domain_maps (id, domain, title, user_id, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (domain_map_id, domain, title, user_id, now))

    # Créer les skills et les lier à la carte
    for tier, skills in skills_by_tier.items():
        for skill_data in skills:
            skill_name = skill_data.get("name", "")
            skill_desc = skill_data.get("description", "")

            # Générer ID du skill
            skill_id = f"{domain.lower().replace(' ', '_')}_{skill_name.lower().replace(' ', '_')}"

            # Calculer le level (1-5) basé sur le tier (0-3)
            # tier 0 → level 1-2, tier 1 → level 2-3, tier 2 → level 3-4, tier 3 → level 4-5
            level = min(5, tier + 1)

            # Créer ou mettre à jour le skill
            cursor.execute("""
                INSERT OR REPLACE INTO skills (id, name, category, level, tier, domain, description, keywords, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                skill_id,
                skill_name,
                "programming",  # Catégorie par défaut
                level,
                tier,
                domain,
                skill_desc,
                json.dumps([skill_name.lower()]),
                now
            ))

            # Lier à la carte
            cursor.execute("""
                INSERT OR REPLACE INTO domain_map_skills (domain_map_id, skill_id, tier)
                VALUES (?, ?, ?)
            """, (domain_map_id, skill_id, tier))

            # Ajouter alias
            cursor.execute("""
                INSERT OR IGNORE INTO skill_aliases (alias, skill_id)
                VALUES (?, ?)
            """, (skill_name.lower(), skill_id))

    # Créer les relations de prérequis entre tiers
    # Tier N requiert Tier N-1
    for tier in range(1, 4):
        cursor.execute("""
            SELECT skill_id FROM domain_map_skills
            WHERE domain_map_id = ? AND tier = ?
        """, (domain_map_id, tier))
        current_tier_skills = [row[0] for row in cursor.fetchall()]

        cursor.execute("""
            SELECT skill_id FROM domain_map_skills
            WHERE domain_map_id = ? AND tier = ?
        """, (domain_map_id, tier - 1))
        prev_tier_skills = [row[0] for row in cursor.fetchall()]

        # Le premier skill du tier actuel requiert le dernier skill du tier précédent
        if current_tier_skills and prev_tier_skills:
            cursor.execute("""
                INSERT OR IGNORE INTO skill_relations (skill_id, related_skill_id, relation_type, strength)
                VALUES (?, ?, ?, ?)
            """, (current_tier_skills[0], prev_tier_skills[-1], "requires", 1.0))

    conn.commit()
    conn.close()

    logger.info(f"✅ Domain map sauvegardée: {domain} ({sum(len(s) for s in skills_by_tier.values())} skills)")
    return domain_map_id


def get_domain_map(domain: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Récupère une carte de domaine avec ses skills par tier."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM domain_maps WHERE domain = ? AND user_id = ?
    """, (domain, user_id))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    domain_map_id = row["id"]

    # Récupérer les skills par tier
    cursor.execute("""
        SELECT dms.tier, s.* FROM domain_map_skills dms
        JOIN skills s ON dms.skill_id = s.id
        WHERE dms.domain_map_id = ?
        ORDER BY dms.tier, s.name
    """, (domain_map_id,))

    skills_by_tier = {0: [], 1: [], 2: [], 3: []}
    for skill_row in cursor.fetchall():
        tier = skill_row["tier"]
        if tier in skills_by_tier:
            skills_by_tier[tier].append({
                "id": skill_row["id"],
                "name": skill_row["name"],
                "description": skill_row["description"] or "",
                "level": skill_row["level"]
            })

    conn.close()

    return {
        "id": domain_map_id,
        "domain": row["domain"],
        "title": row["title"],
        "user_id": row["user_id"],
        "created_at": row["created_at"],
        "tiers": skills_by_tier
    }


def get_user_domain_maps(user_id: str) -> List[Dict[str, Any]]:
    """Liste toutes les cartes de domaine d'un utilisateur."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM domain_maps WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))

    maps = []
    for row in cursor.fetchall():
        # Compter les skills par tier
        cursor.execute("""
            SELECT tier, COUNT(*) as count FROM domain_map_skills
            WHERE domain_map_id = ? GROUP BY tier
        """, (row["id"],))
        tier_counts = {r["tier"]: r["count"] for r in cursor.fetchall()}

        maps.append({
            "id": row["id"],
            "domain": row["domain"],
            "title": row["title"],
            "created_at": row["created_at"],
            "tier_counts": tier_counts,
            "total_skills": sum(tier_counts.values())
        })

    conn.close()
    return maps


# ============================================================================
# TIER PROGRESSION - Progression par cercle (0-3)
# ============================================================================

def get_tier_progress(user_id: str, domain: str) -> Dict[int, Dict[str, Any]]:
    """
    Calcule la progression par tier (0-3) pour un domaine.

    Returns:
        {
            0: {"name": "Fondations", "progress": 85.0, "skills": 5, "mastered": 4, "unlocked": True},
            1: {"name": "Intermédiaire", "progress": 45.0, "skills": 5, "mastered": 2, "unlocked": True},
            2: {"name": "Avancé", "progress": 0.0, "skills": 4, "mastered": 0, "unlocked": False},
            3: {"name": "Expert", "progress": 0.0, "skills": 3, "mastered": 0, "unlocked": False}
        }
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Récupérer la carte du domaine
    cursor.execute("""
        SELECT id FROM domain_maps WHERE domain = ? AND user_id = ?
    """, (domain, user_id))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return {}

    domain_map_id = row["id"]
    user_skills = get_user_skills(user_id)

    tier_names = {0: "Fondations", 1: "Intermédiaire", 2: "Avancé", 3: "Expert"}
    tier_icons = {0: "🎯", 1: "🔵", 2: "🟡", 3: "🔴"}
    result = {}

    for tier in range(4):
        cursor.execute("""
            SELECT skill_id FROM domain_map_skills
            WHERE domain_map_id = ? AND tier = ?
        """, (domain_map_id, tier))
        skill_ids = [r["skill_id"] for r in cursor.fetchall()]

        if not skill_ids:
            result[tier] = {
                "name": tier_names[tier],
                "icon": tier_icons[tier],
                "progress": 0.0,
                "skills": 0,
                "mastered": 0,
                "unlocked": tier == 0
            }
            continue

        # Calculer la maîtrise
        masteries = []
        mastered_count = 0
        for skill_id in skill_ids:
            if skill_id in user_skills:
                mastery = calculate_decayed_mastery(user_skills[skill_id])
                masteries.append(mastery)
                if mastery >= 80:
                    mastered_count += 1
            else:
                masteries.append(0.0)

        avg_progress = sum(masteries) / len(masteries) if masteries else 0.0

        # Vérifier si débloqué (tier précédent >= 80%)
        unlocked = tier == 0
        if tier > 0 and tier - 1 in result:
            unlocked = result[tier - 1]["progress"] >= 80.0

        result[tier] = {
            "name": tier_names[tier],
            "icon": tier_icons[tier],
            "progress": round(avg_progress, 1),
            "skills": len(skill_ids),
            "mastered": mastered_count,
            "unlocked": unlocked
        }

    conn.close()
    return result


def is_tier_unlocked(user_id: str, domain: str, tier: int) -> bool:
    """Vérifie si un tier est débloqué pour un utilisateur."""
    if tier == 0:
        return True

    progress = get_tier_progress(user_id, domain)
    if tier - 1 not in progress:
        return False

    return progress[tier - 1]["progress"] >= 80.0


def get_next_skills_to_learn(user_id: str, domain: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Recommande les prochaines compétences à apprendre dans un domaine.

    Priorité:
    1. Skills du tier actuel non maîtrisées
    2. Skills du tier suivant si débloqué
    """
    progress = get_tier_progress(user_id, domain)
    user_skills = get_user_skills(user_id)

    recommendations = []

    # Trouver le tier actuel (premier non complété à 80%)
    current_tier = 0
    for tier in range(4):
        if tier in progress and progress[tier]["progress"] >= 80:
            current_tier = tier + 1
        else:
            break

    # Récupérer les skills des tiers débloqués
    domain_map = get_domain_map(domain, user_id)
    if not domain_map:
        return []

    for tier in range(min(current_tier + 1, 4)):
        if tier not in progress or not progress[tier]["unlocked"]:
            continue

        for skill in domain_map["tiers"].get(tier, []):
            skill_id = skill["id"]
            current_mastery = 0.0
            if skill_id in user_skills:
                current_mastery = calculate_decayed_mastery(user_skills[skill_id])

            if current_mastery < 80:
                recommendations.append({
                    "skill_id": skill_id,
                    "name": skill["name"],
                    "tier": tier,
                    "tier_name": progress[tier]["name"],
                    "current_mastery": round(current_mastery, 1),
                    "priority": (tier * 100) + (100 - current_mastery)  # Tier bas + mastery basse = priorité haute
                })

    # Trier par priorité et limiter
    recommendations.sort(key=lambda x: x["priority"])
    return recommendations[:limit]


# Initialize on import
init_db()
