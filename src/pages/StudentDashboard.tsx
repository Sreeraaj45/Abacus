import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Student, Level } from '../types';
import type { SessionStats } from '../components/PracticeSession';
import PracticeSession from '../components/PracticeSession';
import SessionResults from '../components/SessionResults';
import { LogOut, BookOpen, Award, Target, Clock, Play, BarChart2, Home, AlertCircle, X } from 'lucide-react';
import { calculateAccuracy, formatTime } from '../lib/exercises';

type ViewState = 'dashboard' | 'practice';

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
  const [notEnrolled, setNotEnrolled] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      let studentData;
      try {
        studentData = await api.students.getMe();
      } catch {
        setNotEnrolled(true);
        return;
      }

      setStudent(studentData);
      setCurrentLevel(studentData.level);

      const [levelsData, attempts] = await Promise.all([
        api.levels.getAll(),
        api.exerciseAttempts.getByMe(),
      ]);

      setLevels(levelsData);
      if (!studentData.level && levelsData.length > 0) {
        setCurrentLevel(levelsData[0]);
      }

      if (attempts && attempts.length > 0) {
        const correct = attempts.filter((a) => a.is_correct).length;
        const totalTime = attempts.reduce((sum: number, a: { time_taken_seconds?: number }) => sum + (a.time_taken_seconds || 0), 0);

        setStats({
          totalExercises: attempts.length,
          correctExercises: correct,
          totalTime,
          averageAccuracy: calculateAccuracy(correct, attempts.length),
          exercisesThisLevel: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch student dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setShowLogoutConfirm(false);
    await signOut();
    setIsSigningOut(false);
  };

  const startPractice = () => {
    setViewState('practice');
  };

  const handleSessionEnd = (sStats: SessionStats) => {
    setSessionStats(sStats);
  };

  const handleRetry = () => {
    setSessionStats(null);
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

  const navItems = [
    { id: 'dashboard' as ViewState, icon: Home, label: 'Dashboard', onClick: () => { setViewState('dashboard'); setSessionStats(null); } },
    { id: 'practice' as ViewState, icon: Play, label: 'Practice', onClick: startPractice },
  ];

  // Dashboard view
  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      <nav className="w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 min-h-screen sticky top-0 flex flex-col shadow-xl shadow-blue-900/5">
        {/* Header */}
        <div className="pl-1 pr-0 py-0.5 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/30 flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center m-2">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-baseline space-x-1 -ml-1">
            <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Abacus</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-1 overflow-y-auto">
          <div className="space-y-0">
            {navItems.map((item) => {
              const isActive = viewState === item.id;
              return (
                <div key={item.id} className="px-1">
                  <button
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-2 px-2 py-2 rounded-xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/10 border-l-4 border-blue-500 shadow-sm'
                        : 'hover:bg-gray-100/80 hover:shadow-sm'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 transition-all duration-200 ${
                      isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <item.icon className={`h-4 w-4 ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                    </div>
                    <p className={`text-sm font-medium truncate ${
                      isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>{item.label}</p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-2 mb-2 ml-1">
            <div className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{profile?.name?.charAt(0).toUpperCase() || 'S'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">{profile?.name}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.role}</p>
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isSigningOut}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50 bg-white hover:bg-red-50/50 border border-gray-200 shadow-sm"
              aria-label={isSigningOut ? 'Signing out' : 'Logout'}
            >
              <LogOut className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                isSigningOut ? 'text-gray-400' : 'text-gray-600 group-hover:text-red-600'
              }`} />
              <span className={`transition-colors duration-200 ${
                isSigningOut ? 'text-gray-500' : 'text-gray-700 group-hover:text-red-700'
              }`}>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8">
        {/* Not enrolled state */}
        {notEnrolled && (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Enrolled Yet</h2>
            <p className="text-gray-500 max-w-sm">Your account is set up, but you haven't been enrolled by a teacher yet. Please contact your teacher to get started.</p>
          </div>
        )}

        {/* Practice session (inline, keeps sidebar) */}
        {!notEnrolled && viewState === 'practice' && currentLevel && student && (
          <>
            <PracticeSession
              level={currentLevel}
              student={student}
              onEnd={handleSessionEnd}
              onCancel={handleBackToDashboard}
            />
            {sessionStats && (
              <SessionResults
                stats={sessionStats}
                levelName={currentLevel.name}
                passed={sessionStats.accuracy >= currentLevel.min_accuracy}
                onRetry={handleRetry}
                onHome={handleBackToDashboard}
              />
            )}
          </>
        )}

        {/* Dashboard view */}
        {!notEnrolled && viewState === 'dashboard' && (
        <>
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
        </>
        )}
      </main>
    </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-50/80 to-red-100/50 border-b border-red-200/40">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertCircle className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-600">End your session</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-700 mb-1">Are you sure you want to logout?</p>
              <div className="mt-4 flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs text-gray-500 font-medium">Current session: <span className="text-gray-700">{profile?.name}</span></p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/40 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300/60 hover:border-gray-400/60 rounded-xl transition-all duration-200"
                disabled={isSigningOut}
              >Cancel</button>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-60"
              >
                {isSigningOut ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Logging out...</span></>
                ) : (
                  <><LogOut className="h-4 w-4" /><span>Yes, Logout</span></>
                )}
              </button>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
