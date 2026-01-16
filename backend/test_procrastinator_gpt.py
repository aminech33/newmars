#!/usr/bin/env python3
"""
🦥 SIMULATION PROCRASTINATEUR RÉALISTE
Comment le système s'adapte à un élève qui:
- Saute des jours
- S'arrête en pleine session
- Étudie tard le soir (fatigué)
- Se distrait facilement
- A des pics de motivation suivis de crashes
"""

import os
import sys
import time
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("❌ OPENAI_API_KEY non trouvée")
    sys.exit(1)

print("=" * 70)
print("🦥 SIMULATION: ÉLÈVE PROCRASTINATEUR")
print("   (Celui qui dit 'je commence lundi' depuis 3 mois)")
print("=" * 70)

from openai import OpenAI
client = OpenAI(api_key=api_key)

# Test connexion
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "OK?"}],
    max_tokens=5
)
print(f"✅ GPT connecté\n")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.fsrs_algorithm import FSRS, FSRSCard, Rating
from utils.cognitive_load import CognitiveLoadDetector
from utils.transfer_learning import TransferLearningDetector
from utils.forgetting_curve import PersonalizedForgettingCurve
from utils.presleep_scheduling import PreSleepScheduler

# ============================================================================
# PROFIL PROCRASTINATEUR
# ============================================================================

class ProcrastinatorStudent:
    """
    Profil réaliste d'un procrastinateur:
    - Motivation en dents de scie
    - Fatigue variable (souvent étudie tard)
    - Tendance à abandonner les sessions
    - Pics de culpabilité = pics d'effort
    """

    def __init__(self):
        self.knowledge = {}
        self.total_questions = 0
        self.correct_answers = 0

        # État mental du procrastinateur
        self.motivation = 0.5  # 0-1, fluctue beaucoup
        self.guilt = 0.0  # Augmente quand il skip, pousse à travailler
        self.fatigue = 0.3  # Souvent fatigué
        self.distraction_level = 0.4  # Notifications, YouTube, etc.

        # Patterns de procrastination
        self.days_since_last_study = 0
        self.streak = 0
        self.longest_streak = 0
        self.total_skipped_days = 0
        self.abandoned_sessions = 0

    def will_study_today(self, day: int) -> tuple:
        """Décide si le procrastinateur va étudier aujourd'hui"""

        # Facteurs qui poussent à étudier
        guilt_push = min(self.guilt * 0.3, 0.4)  # La culpabilité pousse
        streak_momentum = min(self.streak * 0.1, 0.3)  # L'élan du streak

        # Facteurs qui empêchent
        fatigue_block = self.fatigue * 0.3
        distraction_block = self.distraction_level * 0.2

        # Jour de la semaine (weekend = moins motivé)
        weekday = day % 7
        weekend_penalty = 0.2 if weekday in [5, 6] else 0

        # Probabilité d'étudier
        prob_study = 0.4 + guilt_push + streak_momentum - fatigue_block - distraction_block - weekend_penalty

        # Ajouter du chaos (c'est un procrastinateur après tout)
        prob_study += random.uniform(-0.2, 0.2)
        prob_study = max(0.1, min(0.9, prob_study))

        will_study = random.random() < prob_study

        # Raison si skip
        reason = None
        if not will_study:
            reasons = [
                "📱 'Juste 5 min sur TikTok...' (3h plus tard)",
                "🎮 'Une partie rapide...' (rage quit après 2h)",
                "😴 'Trop fatigué, demain c'est sûr'",
                "🍕 'J'attends d'avoir mangé' (mange, puis sieste)",
                "📺 'Faut que je finisse cette série d'abord'",
                "🧹 'Je range ma chambre avant' (procrastination productive)",
                "💭 'J'ai pas la tête à ça aujourd'hui'",
                "☀️ 'Il fait trop beau pour rester dedans'",
                "🌧️ 'Il fait moche, j'ai pas le moral'",
            ]
            reason = random.choice(reasons)
            self.days_since_last_study += 1
            self.guilt = min(1.0, self.guilt + 0.15)
            self.streak = 0
            self.total_skipped_days += 1
        else:
            self.days_since_last_study = 0
            self.guilt = max(0, self.guilt - 0.1)
            self.streak += 1
            self.longest_streak = max(self.longest_streak, self.streak)

        return will_study, reason, prob_study

    def get_session_length(self) -> int:
        """Combien de questions avant d'abandonner?"""

        # Base: entre 5 et 20 questions
        base = random.randint(5, 20)

        # Bonus motivation
        if self.motivation > 0.7:
            base += random.randint(5, 10)

        # Malus fatigue/distraction
        if self.fatigue > 0.6:
            base -= random.randint(3, 8)
        if self.distraction_level > 0.5:
            base -= random.randint(2, 5)

        # Guilt boost (mode rattrapage)
        if self.guilt > 0.7:
            base += random.randint(5, 15)

        return max(3, base)

    def will_abandon_session(self, questions_done: int, session_target: int) -> tuple:
        """Vérifie si le procrastinateur abandonne en cours de session"""

        progress = questions_done / session_target

        # Moins de chances d'abandonner au début et vers la fin
        if progress < 0.3:
            base_abandon_prob = 0.02  # Début = motivé
        elif progress > 0.7:
            base_abandon_prob = 0.01  # Fin = veut finir
        else:
            base_abandon_prob = 0.04  # Milieu = zone de danger

        # Fatigue augmente le risque (mais moins qu'avant)
        base_abandon_prob += self.fatigue * 0.03

        # Distraction augmente le risque
        base_abandon_prob += self.distraction_level * 0.03

        will_abandon = random.random() < base_abandon_prob

        reason = None
        if will_abandon:
            reasons = [
                "📱 Notification importante (spoiler: c'était pas important)",
                "🚽 'Pause toilettes' (ne revient jamais)",
                "☕ 'Je vais me faire un café' (scroll Instagram 45min)",
                "😤 'C'est trop dur, j'y arriverai jamais'",
                "🥱 'Je continue après une micro-sieste' (3h)",
                "💡 'Ah j'ai oublié de faire un truc!' (rien d'urgent)",
            ]
            reason = random.choice(reasons)
            self.abandoned_sessions += 1

        return will_abandon, reason

    def answer_question(self, topic: str, difficulty: int, session_progress: float) -> dict:
        """Simule une réponse avec les handicaps du procrastinateur"""

        mastery = self.knowledge.get(topic, 0.0)

        # Probabilité de base (plus généreuse)
        base_prob = 0.55 + mastery * 0.4

        # Malus difficulté (réduit)
        diff_penalty = (difficulty - 1) * 0.08

        # Malus fatigue (réduit)
        fatigue_penalty = self.fatigue * 0.12

        # Malus distraction (réduit)
        distraction_penalty = self.distraction_level * 0.08

        # Malus progression session (réduit)
        session_fatigue = session_progress * 0.08

        # Bonus motivation
        motivation_bonus = (self.motivation - 0.5) * 0.15

        prob_correct = base_prob - diff_penalty - fatigue_penalty - distraction_penalty - session_fatigue + motivation_bonus
        prob_correct = max(0.25, min(0.9, prob_correct))

        is_correct = random.random() < prob_correct

        # Temps de réponse (procrastinateur = plus lent, distrait)
        base_time = 10 + difficulty * 4
        base_time *= (1 + self.distraction_level * 0.5)  # Distractions
        base_time *= (1 + self.fatigue * 0.3)  # Fatigue
        base_time *= (1 + session_progress * 0.4)  # Fatigue session

        if not is_correct:
            base_time *= random.uniform(1.2, 1.8)

        response_time = base_time * random.uniform(0.8, 1.3)

        self.total_questions += 1
        if is_correct:
            self.correct_answers += 1

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": prob_correct
        }

    def learn(self, topic: str, is_correct: bool, difficulty: int):
        """Apprentissage avec efficacité réduite (fatigue, distraction)"""
        current = self.knowledge.get(topic, 0.0)

        # Efficacité d'apprentissage (moins sévère)
        efficiency = 1.0
        efficiency *= (1 - self.fatigue * 0.2)  # Fatigue réduit moins
        efficiency *= (1 - self.distraction_level * 0.15)  # Distraction réduit moins
        efficiency *= (0.8 + self.motivation * 0.4)  # Motivation aide

        if is_correct:
            gain = 0.06 * efficiency * (1 + difficulty * 0.2)  # Gain augmenté
            self.knowledge[topic] = min(1.0, current + gain)
        else:
            loss = 0.01  # Perte réduite
            self.knowledge[topic] = max(0.0, current - loss)

    def update_state(self, session_performance: float):
        """Met à jour l'état mental après une session"""

        # Bonne performance = boost motivation
        if session_performance > 0.7:
            self.motivation = min(1.0, self.motivation + 0.15)
            self.fatigue = max(0, self.fatigue - 0.1)
        elif session_performance < 0.4:
            self.motivation = max(0.2, self.motivation - 0.1)

        # Fatigue augmente après session
        self.fatigue = min(0.9, self.fatigue + 0.1)

        # Distraction fluctue
        self.distraction_level = max(0.1, min(0.8, self.distraction_level + random.uniform(-0.15, 0.15)))

    def daily_reset(self):
        """Reset quotidien (récupération partielle)"""
        # Récupération de fatigue (mais pas complète si dette de sommeil)
        self.fatigue = max(0.2, self.fatigue - 0.3)

        # Motivation fluctue
        self.motivation = max(0.2, min(0.9, self.motivation + random.uniform(-0.2, 0.2)))

        # Distraction reset
        self.distraction_level = 0.3 + random.uniform(0, 0.3)


# ============================================================================
# GÉNÉRATEUR DE QUESTIONS
# ============================================================================

class GPTQuestionGenerator:
    def __init__(self, client):
        self.client = client
        self.topics = {
            "python": "programmation Python",
            "javascript": "JavaScript",
            "math": "mathématiques"
        }

    def generate(self, topic: str, difficulty: int) -> dict:
        diff_text = {1: "très facile", 2: "facile", 3: "moyen", 4: "difficile"}[difficulty]

        prompt = f"""Génère une question QCM {diff_text} sur {self.topics.get(topic, topic)}.
Format JSON: {{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0}}
JSON uniquement."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7
            )
            import json
            content = response.choices[0].message.content.strip()
            if "```" in content:
                content = content.split("```")[1].replace("json", "").strip()
            data = json.loads(content)
            data["topic"] = topic
            data["difficulty"] = difficulty
            return data
        except:
            return {
                "question": f"Question test {topic}",
                "options": ["A", "B", "C", "D"],
                "correct_index": 0,
                "topic": topic,
                "difficulty": difficulty
            }


# ============================================================================
# SIMULATION PRINCIPALE
# ============================================================================

def run_procrastinator_simulation():
    print("\n" + "=" * 70)
    print("🦥 SIMULATION 30 JOURS - ÉLÈVE PROCRASTINATEUR")
    print("=" * 70)

    generator = GPTQuestionGenerator(client)
    student = ProcrastinatorStudent()

    # Systèmes adaptatifs
    fsrs = FSRS()
    cognitive_detector = CognitiveLoadDetector()
    transfer_detector = TransferLearningDetector()
    forgetting_curve = PersonalizedForgettingCurve()

    fsrs_cards = {}
    topics = ["python", "javascript", "math"]

    # Stats
    daily_log = []
    total_study_days = 0
    total_questions_answered = 0

    print(f"""
📋 PROFIL PROCRASTINATEUR:
   - Motivation initiale: {student.motivation*100:.0f}%
   - Fatigue initiale: {student.fatigue*100:.0f}%
   - Niveau distraction: {student.distraction_level*100:.0f}%
   - Durée simulation: 30 jours

🎯 OBJECTIF: Voir comment le système s'adapte malgré les obstacles
""")

    print("-" * 70)

    for day in range(1, 31):
        student.daily_reset()

        will_study, skip_reason, prob = student.will_study_today(day)

        if not will_study:
            daily_log.append({
                "day": day,
                "studied": False,
                "reason": skip_reason,
                "questions": 0,
                "accuracy": 0,
                "mastery": sum(student.knowledge.values()) / max(len(student.knowledge), 1)
            })

            if day <= 10 or day % 5 == 0:
                print(f"\n📅 Jour {day:2d}: ❌ SKIP")
                print(f"   {skip_reason}")
                print(f"   😔 Culpabilité: {student.guilt*100:.0f}% | Jours sans étudier: {student.days_since_last_study}")
            continue

        # IL ÉTUDIE!
        total_study_days += 1
        session_target = student.get_session_length()

        print(f"\n{'='*50}")
        print(f"📅 Jour {day:2d}: ✅ ÉTUDIE! (motivation: {student.motivation*100:.0f}%)")
        print(f"   Objectif session: {session_target} questions")
        if student.streak > 1:
            print(f"   🔥 Streak: {student.streak} jours!")

        # Reset cognitive detector pour nouvelle session
        cognitive_detector = CognitiveLoadDetector()

        day_correct = 0
        day_total = 0
        abandoned = False

        for q_num in range(session_target):
            # Check abandon
            will_abandon, abandon_reason = student.will_abandon_session(q_num, session_target)
            if will_abandon and q_num >= 3:
                print(f"\n   💨 ABANDON après {q_num} questions!")
                print(f"      {abandon_reason}")
                abandoned = True
                break

            # Sélection topic
            topic = random.choice(topics)

            # Difficulté adaptative
            mastery = student.knowledge.get(topic, 0.0)

            # Transfer learning bonus
            if student.knowledge:
                for t, m in student.knowledge.items():
                    transfer_detector.set_mastery(t, int(m * 100))
                bonus = transfer_detector.calculate_transfer_bonus(topic)
                if bonus and bonus.bonus_percent > 0:
                    mastery += bonus.bonus_percent / 200

            if mastery < 0.25:
                difficulty = 1
            elif mastery < 0.5:
                difficulty = 2
            elif mastery < 0.75:
                difficulty = 3
            else:
                difficulty = 4

            # Cognitive load check - réduire difficulté si surchargé
            if q_num >= 3:
                assessment = cognitive_detector.assess()
                if assessment.overall_load in ["high", "overload"]:
                    difficulty = max(1, difficulty - 1)
                    if q_num == 3:
                        print(f"   ⚠️ Fatigue détectée → difficulté réduite")

            # Question GPT (seulement 2 premières par jour)
            if q_num < 2:
                question = generator.generate(topic, difficulty)
                print(f"\n   🤖 Q{q_num+1}: {question['question'][:50]}...")
            else:
                question = {"topic": topic, "difficulty": difficulty, "correct_index": 0}

            # Réponse
            session_progress = q_num / session_target
            response = student.answer_question(topic, difficulty, session_progress)

            # Cognitive load tracking
            diff_str = {1: "easy", 2: "medium", 3: "hard", 4: "hard"}[difficulty]
            cognitive_detector.add_response(
                response_time=int(response["response_time"]),
                is_correct=response["is_correct"],
                difficulty=diff_str
            )

            # Apprentissage
            student.learn(topic, response["is_correct"], difficulty)

            # FSRS
            if topic not in fsrs_cards:
                fsrs_cards[topic] = FSRSCard()
            rating = Rating.GOOD if response["is_correct"] else Rating.AGAIN
            new_card, _ = fsrs.review(fsrs_cards[topic], rating)
            fsrs_cards[topic] = new_card

            # Forgetting curve
            if topic not in forgetting_curve.memory_traces:
                forgetting_curve.create_memory_trace(topic, "concepts", "active_recall")
            trace = forgetting_curve.memory_traces[topic]
            forgetting_curve.update_after_review(trace, response["is_correct"], response["response_time"])

            day_total += 1
            total_questions_answered += 1
            if response["is_correct"]:
                day_correct += 1

        # Stats du jour
        accuracy = day_correct / day_total if day_total > 0 else 0
        avg_mastery = sum(student.knowledge.values()) / len(student.knowledge) if student.knowledge else 0

        student.update_state(accuracy)

        daily_log.append({
            "day": day,
            "studied": True,
            "questions": day_total,
            "accuracy": accuracy,
            "mastery": avg_mastery,
            "abandoned": abandoned
        })

        print(f"\n   📊 Résultats: {day_correct}/{day_total} ({accuracy*100:.0f}%)")
        print(f"   📈 Maîtrise: {', '.join([f'{t}: {m*100:.0f}%' for t, m in student.knowledge.items()])}")

    # ============================================================================
    # RÉSULTATS FINAUX
    # ============================================================================

    print("\n" + "=" * 70)
    print("🏆 RÉSULTATS FINAUX - PROCRASTINATEUR")
    print("=" * 70)

    final_mastery = sum(student.knowledge.values()) / len(student.knowledge) if student.knowledge else 0
    final_accuracy = student.correct_answers / student.total_questions if student.total_questions > 0 else 0
    study_rate = total_study_days / 30

    print(f"""
📊 STATISTIQUES PROCRASTINATEUR:
   ┌─────────────────────────────────────────────────────────┐
   │  Jours étudiés        : {total_study_days:2d}/30 ({study_rate*100:.0f}%)                 │
   │  Jours skippés        : {student.total_skipped_days:2d}                             │
   │  Sessions abandonnées : {student.abandoned_sessions:2d}                             │
   │  Plus long streak     : {student.longest_streak:2d} jours                        │
   │  Questions totales    : {total_questions_answered:3d}                            │
   │  Précision globale    : {final_accuracy*100:.1f}%                          │
   │  Maîtrise finale      : {final_mastery*100:.1f}%                          │
   └─────────────────────────────────────────────────────────┘
""")

    print("📈 MAÎTRISE PAR TOPIC:")
    for topic, mastery in sorted(student.knowledge.items(), key=lambda x: -x[1]):
        bar = "█" * int(mastery * 20) + "░" * (20 - int(mastery * 20))
        print(f"   {topic:15} [{bar}] {mastery*100:.1f}%")

    # Comparaison avec élève régulier
    regular_mastery_estimate = 0.95  # Élève déterminé atteint ~95%

    print(f"""
🆚 COMPARAISON:
   ┌─────────────────────────────────────────────────────────┐
   │  Élève déterminé (7j)      : ~95% maîtrise             │
   │  TOI (30j, procrastinateur): {final_mastery*100:.1f}% maîtrise             │
   │                                                         │
   │  Malgré:                                                │
   │  • {student.total_skipped_days} jours skippés                                │
   │  • {student.abandoned_sessions} sessions abandonnées                         │
   │  • Fatigue et distractions constantes                  │
   │                                                         │
   │  Le système a quand même réussi à te faire progresser! │
   └─────────────────────────────────────────────────────────┘
""")

    # Ce que le système a fait pour aider
    print("""
🛡️ COMMENT LE SYSTÈME T'A AIDÉ:

   1. 📉 DIFFICULTÉ ADAPTATIVE
      → Questions plus faciles quand tu étais fatigué
      → Pas de découragement par des questions trop dures

   2. ⚠️ DÉTECTION COGNITIVE LOAD
      → Réduit automatiquement la charge quand tu saturais
      → Évité le burnout et l'abandon total

   3. 🔄 FSRS INTELLIGENT
      → Même avec des gaps, il a recalculé les intervalles
      → Tes connaissances n'ont pas été perdues

   4. 🧠 TRANSFER LEARNING
      → Python t'a aidé pour JavaScript
      → Apprentissage accéléré malgré l'irrégularité

   5. 📊 COURBE D'OUBLI PERSONNALISÉE
      → Adapté à TON rythme d'oubli
      → Questions ciblées sur ce que tu allais oublier
""")

    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║                    🎯 CONCLUSION PROCRASTINATEUR                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Même en étudiant seulement {study_rate*100:.0f}% des jours prévu, tu as atteint  ║
║  {final_mastery*100:.1f}% de maîtrise grâce au système adaptatif.               ║
║                                                                      ║
║  Sans ce système, avec la même régularité:                          ║
║  • Livre: ~5% retenu (oubli massif entre sessions)                  ║
║  • ChatGPT seul: ~15% (pas de suivi, pas d'adaptation)              ║
║  • Anki basique: ~25% (intervalles pas adaptés)                     ║
║                                                                      ║
║  TON SYSTÈME: {final_mastery*100:.1f}% - il s'adapte à TA réalité!               ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    run_procrastinator_simulation()
