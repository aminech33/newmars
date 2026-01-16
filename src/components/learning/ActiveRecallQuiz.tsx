/**
 * ActiveRecallQuiz - Quiz basé sur la récupération active
 *
 * Principes d'apprentissage appliqués:
 * 1. DIFFICULTÉ DÉSIRABLE - Le cerveau encode ce qui lui coûte
 * 2. RÉCUPÉRATION ACTIVE - Écrire avant de voir (pas de QCM)
 * 3. INDICES PROGRESSIFS - Aide graduelle, pas immédiate
 * 4. ÉVALUATION FORMATIVE - Feedback qui guide, pas qui juge
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Lightbulb,
  Send,
  RotateCcw,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock,
  Target
} from 'lucide-react';

interface ActiveRecallQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];           // Indices progressifs
  keyPoints: string[];       // Points clés attendus
  masteryLevel: number;
}

interface EvaluationResult {
  score: number;             // 0-100
  missingPoints: string[];   // Ce qui manque
  correctPoints: string[];   // Ce qui est bien
  suggestion: string;        // Piste d'amélioration
  canRetry: boolean;         // Peut réessayer?
  masteryChange: number;
}

interface Props {
  sessionId: string;
  onComplete?: (stats: SessionStats) => void;
}

interface SessionStats {
  questionsAnswered: number;
  averageScore: number;
  hintsUsed: number;
  retriesUsed: number;
  totalEffort: number;       // Temps + tentatives
}

type Phase = 'thinking' | 'writing' | 'evaluating' | 'feedback' | 'retry';

export default function ActiveRecallQuiz({ sessionId, onComplete }: Props) {
  // État principal
  const [question, setQuestion] = useState<ActiveRecallQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('thinking');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Indices et tentatives
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [previousAnswers, setPreviousAnswers] = useState<string[]>([]);

  // Timing
  const [thinkingTime, setThinkingTime] = useState(0);
  const [writingTime, setWritingTime] = useState(0);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const writingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats session
  const [stats, setStats] = useState<SessionStats>({
    questionsAnswered: 0,
    averageScore: 0,
    hintsUsed: 0,
    retriesUsed: 0,
    totalEffort: 0
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Charger la première question
  useEffect(() => {
    loadNextQuestion();
  }, [sessionId]);

  // Timer phase "thinking"
  useEffect(() => {
    if (phase === 'thinking') {
      thinkingTimerRef.current = setInterval(() => {
        setThinkingTime(t => t + 1);
      }, 1000);
    } else if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
    }
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, [phase]);

  // Timer phase "writing"
  useEffect(() => {
    if (phase === 'writing') {
      writingTimerRef.current = setInterval(() => {
        setWritingTime(t => t + 1);
      }, 1000);
    } else if (writingTimerRef.current) {
      clearInterval(writingTimerRef.current);
    }
    return () => {
      if (writingTimerRef.current) clearInterval(writingTimerRef.current);
    };
  }, [phase]);

  const loadNextQuestion = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/learning/active-recall/question/${sessionId}`
      );
      const data = await response.json();

      setQuestion(data);
      setPhase('thinking');
      setUserAnswer('');
      setEvaluation(null);
      setHintsRevealed(0);
      setRetryCount(0);
      setPreviousAnswers([]);
      setThinkingTime(0);
      setWritingTime(0);
    } catch (error) {
      console.error('Erreur chargement question:', error);
    }
  };

  const startWriting = () => {
    setPhase('writing');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const revealHint = () => {
    if (question && hintsRevealed < question.hints.length) {
      setHintsRevealed(h => h + 1);
      setStats(s => ({ ...s, hintsUsed: s.hintsUsed + 1 }));
    }
  };

  const submitAnswer = async () => {
    if (!question || !userAnswer.trim()) return;

    setPhase('evaluating');

    try {
      const response = await fetch(
        `http://localhost:8000/api/learning/active-recall/evaluate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: question.id,
            user_answer: userAnswer,
            hints_used: hintsRevealed,
            retry_count: retryCount,
            thinking_time: thinkingTime,
            writing_time: writingTime,
            previous_answers: previousAnswers
          })
        }
      );

      const result: EvaluationResult = await response.json();
      setEvaluation(result);
      setPhase('feedback');

      // Mettre à jour stats si pas de retry possible ou score suffisant
      if (!result.canRetry || result.score >= 70) {
        setStats(s => ({
          ...s,
          questionsAnswered: s.questionsAnswered + 1,
          averageScore: (s.averageScore * s.questionsAnswered + result.score) / (s.questionsAnswered + 1),
          totalEffort: s.totalEffort + thinkingTime + writingTime + retryCount * 30
        }));
      }
    } catch (error) {
      console.error('Erreur évaluation:', error);
      setPhase('writing');
    }
  };

  const retry = () => {
    if (evaluation?.canRetry) {
      setPreviousAnswers([...previousAnswers, userAnswer]);
      setUserAnswer('');
      setRetryCount(r => r + 1);
      setStats(s => ({ ...s, retriesUsed: s.retriesUsed + 1 }));
      setPhase('retry');
      setWritingTime(0);
      setTimeout(() => {
        setPhase('writing');
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const nextQuestion = () => {
    loadNextQuestion();
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {question.topic}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {phase === 'thinking' ? thinkingTime : thinkingTime + writingTime}s
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <Brain className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {question.question}
            </h2>
            {retryCount > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Tentative {retryCount + 1} - Utilise le feedback pour améliorer ta réponse
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Phase: Thinking */}
      {phase === 'thinking' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Prends le temps de réfléchir</span>
            </div>
            <p className="text-sm text-amber-600 mt-1">
              Avant d'écrire, essaie de formuler mentalement ta réponse.
              L'effort de rappel renforce la mémoire.
            </p>
          </div>

          <button
            onClick={startWriting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            Je suis prêt à répondre
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Phase: Writing */}
      {(phase === 'writing' || phase === 'retry') && (
        <div className="space-y-4">
          {/* Zone de réponse */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Écris ta réponse avec tes propres mots..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={phase === 'evaluating'}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {userAnswer.length} caractères
            </div>
          </div>

          {/* Indices révélés */}
          {hintsRevealed > 0 && (
            <div className="space-y-2">
              {question.hints.slice(0, hintsRevealed).map((hint, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-800">Indice {i + 1}: {hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* Feedback des tentatives précédentes */}
          {retryCount > 0 && evaluation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Piste:</strong> {evaluation.suggestion}
              </p>
              {evaluation.missingPoints.length > 0 && (
                <p className="text-sm text-blue-700 mt-1">
                  Il te manque: {evaluation.missingPoints.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={submitAnswer}
              disabled={!userAnswer.trim() || phase === 'evaluating'}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {phase === 'evaluating' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Évaluation...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Soumettre ma réponse
                </>
              )}
            </button>

            {hintsRevealed < question.hints.length && (
              <button
                onClick={revealHint}
                className="px-4 py-3 border border-yellow-400 text-yellow-700 hover:bg-yellow-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Indice ({question.hints.length - hintsRevealed})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phase: Feedback */}
      {phase === 'feedback' && evaluation && (
        <div className="space-y-4">
          {/* Score global */}
          <div className={`p-4 rounded-xl border ${
            evaluation.score >= 80 ? 'bg-green-50 border-green-200' :
            evaluation.score >= 50 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {evaluation.score >= 80 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : evaluation.score >= 50 ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <span className={`font-semibold ${
                  evaluation.score >= 80 ? 'text-green-700' :
                  evaluation.score >= 50 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {evaluation.score >= 80 ? 'Excellente compréhension!' :
                   evaluation.score >= 50 ? 'Bonne base, mais incomplet' :
                   'Il manque des éléments clés'}
                </span>
              </div>
              <span className={`text-2xl font-bold ${
                evaluation.score >= 80 ? 'text-green-600' :
                evaluation.score >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {evaluation.score}%
              </span>
            </div>

            {/* Mastery change */}
            <div className="mt-2 text-sm">
              Maîtrise: <span className={evaluation.masteryChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {evaluation.masteryChange >= 0 ? '+' : ''}{evaluation.masteryChange}%
              </span>
            </div>
          </div>

          {/* Points corrects */}
          {evaluation.correctPoints.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2">Ce que tu as bien compris:</p>
              <ul className="space-y-1">
                {evaluation.correctPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points manquants */}
          {evaluation.missingPoints.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="font-medium text-orange-800 mb-2">Ce qui manque:</p>
              <ul className="space-y-1">
                {evaluation.missingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestion */}
          {evaluation.suggestion && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Pour aller plus loin:</strong> {evaluation.suggestion}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {evaluation.canRetry && evaluation.score < 70 && (
              <button
                onClick={retry}
                className="flex-1 py-3 border border-orange-400 text-orange-700 hover:bg-orange-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Réessayer (améliore ton score)
              </button>
            )}
            <button
              onClick={nextQuestion}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Question suivante
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats de session */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Questions: {stats.questionsAnswered}</span>
          <span>Score moyen: {Math.round(stats.averageScore)}%</span>
          <span>Indices: {stats.hintsUsed}</span>
          <span>Retries: {stats.retriesUsed}</span>
        </div>
      </div>
    </div>
  );
}
