import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Student, Level } from '../types';
import type { SessionStats } from '../components/PracticeSession';
import PracticeSession from '../components/PracticeSession';
import SessionResults from '../components/SessionResults';
import { LogOut, BookOpen, Award, Target, Clock, TrendingUp, Play, BarChart2 } from 'lucide-react';
import { calculateAccuracy, formatTime } from '../lib/exercises';

type ViewState = 'dashboard' | 'practice' | 'results';

interface StudentStats {
  totalExercises: number;
  correctExercises: number;
  totalTime: number;
  averageAccuracy: number;
  exercisesThisLevel: number;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    totalExercises: 0,
    correctExercises: 0,
    totalTime: 0,
    averageAccuracy: 0,
    exercisesThisLevel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    // Check for dev mode mock student
    const isDevMode = profile.id.startsWith('dev-');

    if (isDevMode) {
      // Create a mock student for dev mode
      const mockStudent: Student = {
        id: 'dev-student-1',
        profile_id: profile.id,
        teacher_id: 'dev-teacher',
        current_level_id: null,
        enrolled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStudent(mockStudent);
    } else {
      // Fetch student record
      const { data: studentData } = await supabase
        .from('students')
        .select('*, level:levels(*)')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (studentData) {
        const typedData = studentData as Student & { level: Level };
        setStudent(typedData);
        setCurrentLevel(typedData.level);

        // Fetch stats for real students
        const { data: attempts } = await supabase
          .from('exercise_attempts')
          .select('*')
          .eq('student_id', typedData.id);

        if (attempts && attempts.length > 0) {
          const correct = attempts.filter((a) => a.is_correct).length;
          const totalTime = attempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

          setStats({
            totalExercises: attempts.length,
            correctExercises: correct,
            totalTime,
            averageAccuracy: calculateAccuracy(correct, attempts.length),
            exercisesThisLevel: 0,
          });
        }
      }
    }

    // Fetch all levels
    const { data: levelsData } = await supabase
      .from('levels')
      .select('*')
      .order('level_order');

    if (levelsData) {
      setLevels(levelsData);
      if (!currentLevel && levelsData.length > 0) {
        setCurrentLevel(levelsData[0]);
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const startPractice = () => {
    setViewState('practice');
  };

  const handleSessionEnd = (sStats: SessionStats) => {
    setSessionStats(sStats);
    setViewState('results');
  };

  const handleRetry = () => {
    setSessionStats(null);
    setViewState('practice');
  };

  const handleBackToDashboard = () => {
    setSessionStats(null);
    setViewState('dashboard');
    fetchData(); // Refresh stats
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show practice session
  if (viewState === 'practice' && currentLevel && student) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <PracticeSession
          level={currentLevel}
          student={student}
          onEnd={handleSessionEnd}
          onCancel={handleBackToDashboard}
        />
      </div>
    );
  }

  // Show results
  if (viewState === 'results' && sessionStats && currentLevel) {
    const passed = sessionStats.accuracy >= currentLevel.min_accuracy;
    return (
      <div className="min-h-screen bg-gray-50">
        <SessionResults
          stats={sessionStats}
          levelName={currentLevel.name}
          passed={passed}
          onRetry={handleRetry}
          onHome={handleBackToDashboard}
        />
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Abacus Learning</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
          <p className="text-gray-600 mt-1">Track your progress and practice exercises</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Level</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {currentLevel?.level_order || 1}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageAccuracy}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Practice Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatTime(stats.totalTime)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exercises</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExercises}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Practice Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Your Level</h3>
              {currentLevel && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {currentLevel.name}
                </span>
              )}
            </div>

            {currentLevel && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress to pass this level</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.exercisesThisLevel}/{currentLevel.exercises_required} exercises
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min((stats.exercisesThisLevel / currentLevel.exercises_required) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Min accuracy: {currentLevel.min_accuracy}%</span>
                  <span>Time limit: {currentLevel.min_speed_seconds}s per problem</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startPractice}
                className="p-6 bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl hover:shadow-md hover:border-blue-400 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <Play className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Start Practice</h4>
                <p className="text-sm text-gray-600 mt-1">Begin your exercise session</p>
              </button>
              <button
                disabled
                className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl opacity-60 cursor-not-allowed text-left"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Take Exam</h4>
                <p className="text-sm text-gray-600 mt-1">Coming soon</p>
              </button>
            </div>
          </div>

          {/* Level Progression */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Level Progression</h3>
            <div className="space-y-2">
              {levels.slice(0, 8).map((level) => {
                const isCurrent = currentLevel?.id === level.id;
                const isCompleted = currentLevel && level.level_order < currentLevel.level_order;
                return (
                  <div
                    key={level.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : isCompleted
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : level.level_order}
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {level.name}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-xs text-blue-600">(current)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
