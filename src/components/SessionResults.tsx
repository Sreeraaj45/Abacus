import { useEffect } from 'react';
import type { SessionStats } from './PracticeSession';
import { Award, Clock, Target, TrendingUp, RotateCcw, Home } from 'lucide-react';

interface SessionResultsProps {
  stats: SessionStats;
  levelName: string;
  passed: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export default function SessionResults({ stats, levelName, passed, onRetry, onHome }: SessionResultsProps) {
  const accuracyColor = stats.accuracy >= 80 ? 'text-emerald-600' :
                         stats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 m-4 animate-in fade-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-emerald-100' : 'bg-orange-100'
          }`}>
            {passed ? (
              <Award className="w-10 h-10 text-emerald-600" />
            ) : (
              <Target className="w-10 h-10 text-orange-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {passed ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-gray-500 mt-1">
            {passed
              ? `You've completed ${levelName}`
              : `You need more practice on ${levelName}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalExercises}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className={`text-2xl font-bold ${accuracyColor}`}>{stats.accuracy}%</p>
            <p className="text-xs text-gray-500">Accuracy</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold text-gray-900">{stats.averageTime}s</p>
            <p className="text-xs text-gray-500">Avg Time</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.correct}</p>
            <p className="text-sm text-gray-500">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">{stats.incorrect}</p>
            <p className="text-sm text-gray-500">Incorrect</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600">{formatTime(stats.totalTime)}</p>
            <p className="text-sm text-gray-500">Total Time</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
