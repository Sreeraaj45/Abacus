import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import GradientBlinds from '../components/GradientBlinds';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please try again.'
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
          gradientColors={['#0f172a', '#1e3a5f', '#3b82f6', '#10b981', '#064e3b']}
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-3xl mb-4 shadow-2xl shadow-blue-500/30">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Abacus Learning</h1>
          <p className="text-blue-200/80">Master mental math, one bead at a time</p>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-slide-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 animate-scale-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

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
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick test login buttons */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-blue-300 text-center mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Quick test login
              <Sparkles className="w-3 h-3" />
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEmail('teacher@test.com'); setPassword('test123'); }}
                className="flex-1 py-2.5 px-4 text-sm bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-xl hover:bg-blue-500/30 hover:border-blue-400/50 transition-all"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => { setEmail('student@test.com'); setPassword('test123'); }}
                className="flex-1 py-2.5 px-4 text-sm bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-xl hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all"
              >
                Student
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-blue-200/70">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-300 font-semibold hover:text-white transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/40 text-sm mt-8 animate-fade-in stagger-4">
          Empowering young minds through mental math
        </p>
      </div>
    </div>
  );
}
