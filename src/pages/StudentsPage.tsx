import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import type { Student, Profile, Level } from '../types';
import { UserPlus, Search, Mail, Trash2, X, Users } from 'lucide-react';

export default function StudentsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<(Student & { profile: Profile; level: Level | null })[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    const [studentsRes, levelsRes] = await Promise.all([
      supabase
        .from('students')
        .select(`
          *,
          profile:profiles!students_profile_id_fkey(*),
          level:levels(*)
        `)
        .eq('teacher_id', profile.id)
        .order('enrolled_at', { ascending: false }),
      supabase.from('levels').select('*').order('level_order'),
    ]);

    if (studentsRes.data) {
      setStudents(studentsRes.data as (Student & { profile: Profile; level: Level | null })[]);
    }
    if (levelsRes.data) {
      setLevels(levelsRes.data);
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.profile.name.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (!profile || !newStudentEmail || !newStudentName) return;
    setAdding(true);
    setError(null);

    // Check if a profile with this email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', newStudentEmail)
      .maybeSingle();

    let studentProfile: Profile | null = existingProfile;

    // If not, we need to create an auth user first (in a real app, there would be a proper flow)
    // For this demo, we'll create a profile record directly using the email
    // Note: In production, you'd typically send an invitation email

    if (!studentProfile) {
      // Create a profile for the student (in production, this would happen via invite/signup)
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: crypto.randomUUID(), // Temporary UUID
            email: newStudentEmail,
            name: newStudentName,
            role: 'student',
          },
        ])
        .select()
        .single();

      if (profileError) {
        setError(profileError.message);
        setAdding(false);
        return;
      }
      studentProfile = newProfile as Profile;
    }

    // Create the student record linking to teacher
    const { error: studentError } = await supabase.from('students').insert([
      {
        profile_id: studentProfile!.id,
        teacher_id: profile.id,
        current_level_id: levels[0]?.id || null,
      },
    ]);

    if (studentError) {
      setError(studentError.message);
      setAdding(false);
      return;
    }

    setShowAddModal(false);
    setNewStudentEmail('');
    setNewStudentName('');
    setAdding(false);
    fetchData();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return;

    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (!error) {
      setStudents(students.filter((s) => s.id !== studentId));
    }
  };

  const handleLevelChange = async (studentId: string, levelId: string) => {
    const { error } = await supabase
      .from('students')
      .update({ current_level_id: levelId, updated_at: new Date().toISOString() })
      .eq('id', studentId);

    if (!error) {
      setStudents(
        students.map((s) =>
          s.id === studentId
            ? { ...s, current_level_id: levelId, level: levels.find((l) => l.id === levelId) || null }
            : s
        )
      );
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Students</h2>
          <p className="text-gray-600 mt-1">Manage your enrolled students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or email..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={adding || !newStudentEmail || !newStudentName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title={search ? 'No students found' : 'No students yet'}
            description={search ? 'Try a different search term' : 'Add your first student to get started with your teaching'}
            action={!search ? { label: 'Add Student', onClick: () => setShowAddModal(true) } : undefined}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Current Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Enrolled</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
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
                  <td className="px-6 py-4">
                    <select
                      value={student.current_level_id || ''}
                      onChange={(e) => handleLevelChange(student.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">No level assigned</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(student.enrolled_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
