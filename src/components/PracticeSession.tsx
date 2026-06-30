import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Level, Student } from '../types';
import { generateExercise, formatTime, type GeneratedExercise } from '../lib/exercises';
import { Check, X, Clock, Target, ArrowLeft } from 'lucide-react';

interface PracticeSessionProps {
  level: Level;
  student: Student;
  onEnd: (stats: SessionStats) => void;
  onCancel: () => void;
}

export interface SessionStats {
  totalExercises: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  averageTime: number;
  totalTime: number;
}

export default function PracticeSession({ level, student, onEnd, onCancel }: PracticeSessionProps) {
  useAuth();
  const [currentExercise, setCurrentExercise] = useState<GeneratedExercise | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState(Date.now());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const TARGET_EXERCISES = Math.min(level.exercises_required, 20);

  // Generate new exercise
  const generateNewExercise = useCallback(() => {
    const exercise = generateExercise(level);
    setCurrentExercise(exercise);
    setUserAnswer('');
    setExerciseStartTime(Date.now());
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [level]);

  // Timer for session
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize first exercise
  useEffect(() => {
    generateNewExercise();
  }, [generateNewExercise]);

  // Check answer
  const checkAnswer = async () => {
    if (!currentExercise || !userAnswer) return;

    const answer = parseInt(userAnswer);
    const timeTaken = Math.round((Date.now() - exerciseStartTime) / 1000);
    const isCorrect = answer === currentExercise.correctAnswer;

    // Save exercise attempt to database
    try {
      await api.exerciseAttempts.create({
        operation: currentExercise.operation,
        num1: currentExercise.num1,
        num2: currentExercise.num2,
        correct_answer: currentExercise.correctAnswer,
        user_answer: answer,
        is_correct: isCorrect,
        time_taken: timeTaken,
      });
    } catch (error) {
      console.error('Failed to save exercise attempt:', error);
    }

    // Update counts
    setExercisesCompleted((prev) => prev + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('correct');
    } else {
      setIncorrectCount((prev) => prev + 1);
      setFeedback('incorrect');
    }

    // Check if session is complete
    const newTotal = exercisesCompleted + 1;
    if (newTotal >= TARGET_EXERCISES) {
      // End session
      const stats: SessionStats = {
        totalExercises: newTotal,
        correct: correctCount + (isCorrect ? 1 : 0),
        incorrect: incorrectCount + (isCorrect ? 0 : 1),
        accuracy: Math.round(((correctCount + (isCorrect ? 1 : 0)) / newTotal) * 100),
        averageTime: Math.round(sessionTime / newTotal),
        totalTime: sessionTime,
      };
      setSessionFinished(true);
      onEnd(stats);
      return;
    }

    // Generate next exercise after short delay
    setTimeout(() => {
      generateNewExercise();
    }, 800);
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer && !feedback) {
      checkAnswer();
    }
  };

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionFinished) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Exit
        </button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg">{formatTime(sessionTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="w-5 h-5" />
            <span className="font-medium">{exercisesCompleted}/{TARGET_EXERCISES}</span>
          </div>
        </div>
      </div>

      {/* Level indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{level.name}</h3>
            <p className="text-sm text-gray-500">{level.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
              <p className="text-xs text-gray-500">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
              <p className="text-xs text-gray-500">Incorrect</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise */}
      <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 transition-all duration-300 ${
        feedback === 'correct' ? 'border-emerald-400 bg-emerald-50' :
        feedback === 'incorrect' ? 'border-red-400 bg-red-50' :
        'border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-4">Solve:</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-6xl font-bold text-gray-900">{currentExercise.num1}</span>
            <span className="text-4xl font-bold text-blue-600">
              {currentExercise.operation === 'addition' && '+'}
              {currentExercise.operation === 'subtraction' && '−'}
              {currentExercise.operation === 'multiplication' && '×'}
              {currentExercise.operation === 'division' && '÷'}
            </span>
            <span className="text-6xl font-bold text-gray-900">{currentExercise.num2}</span>
            <span className="text-4xl font-bold text-gray-400 ml-2">=</span>
            <span className="text-6xl font-bold text-blue-600">?</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!feedback}
            className="w-48 text-center text-4xl font-bold px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            placeholder="?"
            autoFocus
          />
          <button
            onClick={checkAnswer}
            disabled={!userAnswer || !!feedback}
            className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check
          </button>
        </div>

        {feedback && (
          <div className={`mt-6 flex items-center justify-center gap-2 ${
            feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {feedback === 'correct' ? (
              <>
                <Check className="w-6 h-6" />
                <span className="text-xl font-semibold">Correct!</span>
              </>
            ) : (
              <>
                <X className="w-6 h-6" />
                <span className="text-xl font-semibold">
                  Incorrect. Answer: {currentExercise.correctAnswer}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 transition-all duration-500"
            style={{ width: `${(exercisesCompleted / TARGET_EXERCISES) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {exercisesCompleted} of {TARGET_EXERCISES} exercises completed
        </p>
      </div>
    </div>
  );
}
