import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Student, Profile, Level, ExerciseAttempt } from '../types';
import { Calendar, Clock, Target, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type AttemptWithProfile = ExerciseAttempt & {
  student: { id: string; profile: Profile };
};

export default function ProgressPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<(Student & { profile: Profile; level: Level | null })[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AttemptWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    if (profile) {
      fetchAllData();
    }
  }, [profile]);

  const fetchAllData = async () => {
    await Promise.all([fetchStudents(), fetchLevels(), fetchRecentAttempts()]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('students')
      .select(`
        *,
        profile:profiles!students_profile_id_fkey(*),
        level:levels(*)
      `)
      .eq('teacher_id', profile.id)
      .order('enrolled_at', { ascending: false });

    if (data) {
      setStudents(data as (Student & { profile: Profile; level: Level | null })[]);
    }
  };

  const fetchLevels = async () => {
    const { data } = await supabase.from('levels').select('*').order('level_order');
    if (data) setLevels(data);
  };

  const fetchRecentAttempts = async () => {
    if (!profile) return;

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const { data: studentIds } = await supabase
      .from('students')
      .select('id, profile_id')
      .eq('teacher_id', profile.id);

    if (!studentIds || studentIds.length === 0) return;

    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('*')
      .in('student_id', studentIds.map((s) => s.id))
      .gte('attempted_at', startDate)
      .order('attempted_at', { ascending: false })
      .limit(100);

    if (attempts && studentIds) {
      const profileIds = studentIds.map((s) => s.profile_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', profileIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      const studentMap = new Map(studentIds.map((s) => [s.id, s]));

      const attemptsWithProfiles: AttemptWithProfile[] = attempts.map((a) => ({
        ...a,
        student: {
          id: a.student_id,
          profile: profileMap.get(studentMap.get(a.student_id)?.profile_id) || ({} as Profile),
        },
      }));

      setRecentAttempts(attemptsWithProfiles);
    }
  };

  useEffect(() => {
    fetchRecentAttempts();
  }, [timeRange]);

  const getStudentStats = (studentId: string) => {
    const studentAttempts = recentAttempts.filter((a) => a.student_id === studentId);
    const correct = studentAttempts.filter((a) => a.is_correct).length;
    const totalTime = studentAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

    return {
      total: studentAttempts.length,
      correct,
      accuracy: studentAttempts.length > 0 ? Math.round((correct / studentAttempts.length) * 100) : 0,
      avgTime: studentAttempts.length > 0 ? Math.round(totalTime / studentAttempts.length) : 0,
    };
  };

  const getOverallStats = () => {
    const total = recentAttempts.length;
    const correct = recentAttempts.filter((a) => a.is_correct).length;
    const totalTime = recentAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

    return {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      avgTime: total > 0 ? Math.round(totalTime / total) : 0,
    };
  };

  const getOperationStats = () => {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
    return operations.map((op) => {
      const opAttempts = recentAttempts.filter((a) => a.operation === op);
      const correct = opAttempts.filter((a) => a.is_correct).length;
      return {
        operation: op,
        total: opAttempts.length,
        accuracy: opAttempts.length > 0 ? Math.round((correct / opAttempts.length) * 100) : 0,
      };
    });
  };

  const filteredStudents = selectedStudent
    ? students.filter((s) => s.id === selectedStudent)
    : students;

  const overall = getOverallStats();
  const operationStats = getOperationStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Progress</h2>
          <p className="text-gray-600 mt-1">Track and analyze student performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.profile.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'all' ? 'All Time' : `Last ${range}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Exercises</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{overall.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Accuracy</p>
              <p className={`text-3xl font-bold mt-1 ${
                overall.accuracy >= 80 ? 'text-emerald-600' :
                overall.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>{overall.accuracy}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{filteredStudents.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{overall.avgTime}s</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Performance Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Student Performance</h3>
          </div>
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No students found. Add students from the Students page.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Level</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Exercises</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Accuracy</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const stats = getStudentStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.profile.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.profile.name}</p>
                            <p className="text-sm text-gray-500">{student.profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {student.level?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{stats.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${
                          stats.accuracy >= 80 ? 'text-emerald-600' :
                          stats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stats.accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{stats.avgTime}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Operation Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">By Operation</h3>
          <div className="space-y-4">
            {operationStats.map((op) => (
              <div key={op.operation} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{op.operation}</span>
                  <span className="text-sm text-gray-500">{op.total} exercises</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      op.accuracy >= 80 ? 'bg-emerald-500' :
                      op.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${op.accuracy}%` }}
                  />
                </div>
                <p className="text-xs text-right text-gray-500">{op.accuracy}% accuracy</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
        </div>
        {recentAttempts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No exercise attempts recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentAttempts.slice(0, 50).map((attempt) => (
              <div key={attempt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    attempt.is_correct ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {attempt.is_correct ? (
                      <Award className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Target className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {attempt.num1} {attempt.operation === 'addition' && '+'}
                      {attempt.operation === 'subtraction' && '−'}
                      {attempt.operation === 'multiplication' && '×'}
                      {attempt.operation === 'division' && '÷'}
                      {' '}{attempt.num2} = {attempt.correct_answer}
                    </p>
                    <p className="text-sm text-gray-500">
                      {attempt.student.profile.name || 'Unknown'} • {attempt.user_answer ?? 'No answer'}
                      {attempt.user_answer !== attempt.correct_answer && (
                        <span className="text-red-500 ml-1">(incorrect)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(attempt.attempted_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">{attempt.time_taken_seconds}s</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
