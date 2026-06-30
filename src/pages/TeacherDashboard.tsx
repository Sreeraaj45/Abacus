import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/Skeleton';
import type { Student, Profile, Level, ExerciseAttempt, UserRole } from '../types';
import { Users, BookOpen, Award, BarChart3, Plus, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeLevels: 0,
    totalExercises: 0,
    avgAccuracy: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<ExerciseAttempt & { student: { profile: Profile } }>>([]);
  const [topStudents, setTopStudents] = useState<Array<Student & { profile: Profile; accuracy: number }>>([]);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch students for this teacher
      const studentsResponse = await api.students.getByTeacherId(profile.id);
      const students = studentsResponse || [];

      // Fetch all levels
      const levelsResponse = await api.levels.getAll();
      const levels = levelsResponse || [];

      // Fetch exercise attempts for this teacher's students
      const attemptsResponse = await api.exerciseAttempts.getByTeacherId(profile.id);
      const attempts = attemptsResponse || [];

      // Calculate stats
      const totalStudents = students.length;
      const activeLevels = levels.length;
      const totalExercises = attempts.length;
      const correctExercises = attempts.filter(a => a.is_correct).length;
      const avgAccuracy = totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0;

      setStats({
        totalStudents,
        activeLevels,
        totalExercises,
        avgAccuracy,
      });

      // Process recent activity with student profiles
      if (attempts.length > 0 && students.length > 0) {
        // Create a map of student ID to student object for quick lookup
        const studentMap = new Map(students.map(s => [s.id, s]));
        
        // Get the most recent attempts (limit to 10 for processing)
        const recentAttempts = attempts.slice(0, 10).map(attempt => {
          const student = studentMap.get(attempt.student_id);
          return {
            ...attempt,
            student: {
              ...student,
              profile: student?.profile || ({} as Profile)
            }
          };
        });

        setRecentActivity(recentAttempts as Array<ExerciseAttempt & { student: { profile: Profile } }>);
      }

      // Calculate top students by accuracy
      if (students.length > 0) {
        const studentStats = students.map(student => {
          const studentAttempts = attempts.filter(a => a.student_id === student.id);
          const correct = studentAttempts.filter(a => a.is_correct).length;
          const accuracy = studentAttempts.length > 0 ? Math.round((correct / studentAttempts.length) * 100) : 0;
          
          return {
            ...student,
            accuracy
          } as Student & { profile: Profile; accuracy: number };
        });

        // Sort by accuracy descending and take top 5
        const topStudents = studentStats
          .sort((a, b) => b.accuracy - a.accuracy)
          .slice(0, 5);
          
        setTopStudents(topStudents);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name}!</h2>
        <p className="text-gray-600 mt-1">Manage your students and track their progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover animate-slide-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <Link to="/teacher/students" className="text-blue-600 hover:underline flex items-center gap-1">
              Manage students <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover animate-slide-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Levels</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeLevels}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <Link to="/teacher/levels" className="text-emerald-600 hover:underline flex items-center gap-1">
              View levels <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover animate-slide-up stagger-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Exercises</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExercises}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <Link to="/teacher/progress" className="text-orange-600 hover:underline flex items-center gap-1">
              View details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover animate-slide-up stagger-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Accuracy</p>
              <p className={`text-3xl font-bold mt-1 ${
                stats.avgAccuracy >= 80 ? 'text-emerald-600' :
                stats.avgAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>{stats.avgAccuracy}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <Link to="/teacher/progress" className="text-purple-600 hover:underline flex items-center gap-1">
              View analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/teacher/students"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Add Student</p>
                <p className="text-sm text-gray-500">Invite new students</p>
              </div>
            </Link>
            <Link
              to="/teacher/levels"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Configure Levels</p>
                <p className="text-sm text-gray-500">Manage curriculum</p>
              </div>
            </Link>
            <Link
              to="/teacher/progress"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Progress</p>
                <p className="text-sm text-gray-500">Track student growth</p>
              </div>
            </Link>
            <Link
              to="/teacher/progress"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500">Detailed insights</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slide-in-right">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Students</h3>
          {topStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No students enrolled yet</p>
              <Link to="/teacher/students" className="text-blue-600 text-sm hover:underline">
                Add your first student
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {student.profile?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.profile?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{student.accuracy}% accuracy</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/teacher/progress" className="text-blue-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Student practice attempts will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      attempt.is_correct ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {attempt.is_correct ? (
                        <Target className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Target className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attempt.student.profile?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attempt.num1} {attempt.operation === 'addition' ? '+' : attempt.operation === 'subtraction' ? '−' : attempt.operation === 'multiplication' ? '×' : '÷'} {attempt.num2} = {attempt.correct_answer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">{attempt.time_taken}s</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}