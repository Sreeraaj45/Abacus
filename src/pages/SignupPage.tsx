import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, User, AlertCircle, Users, BookOpen } from 'lucide-react';
import type { UserRole } from '../types';
import GradientBlinds from '../components/GradientBlinds';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signUp(email, password, name, role);

    if (error) {
      setError(error.message === 'User already registered'
        ? 'An account with this email already exists.'
        : error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a1a]">
      {/* GradientBlinds full-screen background */}
      <div className="absolute inset-0">
        <GradientBlinds
          gradientColors={['#0f172a', '#064e3b', '#10b981', '#3b82f6', '#0f172a']}
          angle={31}
          noise={0.18}
          blindCount={16}
          blindMinWidth={30}
          spotlightRadius={0.55}
          spotlightSoftness={1.2}
          spotlightOpacity={0.9}
          mouseDampening={0.18}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="normal"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-3xl mb-4 shadow-2xl shadow-emerald-500/30">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-blue-200/80">Start your abacus learning journey</p>
        </div>

        {/* Signup card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-slide-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 animate-scale-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    role === 'student'
                      ? 'border-emerald-500/50 bg-emerald-500/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <Users className={`w-8 h-8 mb-2 ${role === 'student' ? 'text-emerald-400' : 'text-blue-300/50'}`} />
                  <span className={`font-medium ${role === 'student' ? 'text-emerald-300' : 'text-blue-200/70'}`}>
                    Student
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    role === 'teacher'
                      ? 'border-blue-500/50 bg-blue-500/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <BookOpen className={`w-8 h-8 mb-2 ${role === 'teacher' ? 'text-blue-400' : 'text-blue-300/50'}`} />
                  <span className={`font-medium ${role === 'teacher' ? 'text-blue-300' : 'text-blue-200/70'}`}>
                    Teacher
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-blue-100 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                  placeholder={role === 'teacher' ? 'Dr. Smith' : 'John Doe'}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200/70">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-300 font-semibold hover:text-white transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/40 text-sm mt-8 animate-fade-in stagger-4">
          Join thousands of students mastering mental math
        </p>
      </div>
    </div>
  );
}
