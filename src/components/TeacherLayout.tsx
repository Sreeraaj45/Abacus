import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, Users, BookMarked, Settings, BarChart3, TrendingUp, AlertCircle, X } from 'lucide-react';

export default function TeacherLayout() {
  const { profile, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navItems = [
    { to: '/teacher', icon: BarChart3, label: 'Dashboard', end: true },
    { to: '/teacher/students', icon: Users, label: 'Students' },
    { to: '/teacher/levels', icon: BookMarked, label: 'Levels' },
    { to: '/teacher/progress', icon: TrendingUp, label: 'Progress' },
    { to: '/teacher/lessons', icon: BookOpen, label: 'Lessons' },
    { to: '/teacher/settings', icon: Settings, label: 'Settings' },
  ];

  const handleConfirmLogout = async () => {
    setIsLoading(true);
    setShowLogoutConfirm(false);
    await signOut();
    setIsLoading(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <nav className="w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 min-h-screen sticky top-0 flex flex-col shadow-xl shadow-blue-900/5">
          {/* Header */}
          <div className="pl-1 pr-0 py-0.5 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/30 flex items-center justify-between">
            <Link to="/teacher" className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center m-2">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-baseline space-x-1 -ml-1">
                <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Abacus</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-1 overflow-y-auto">
            <div className="space-y-0">
              {navItems.map((item) => (
                <div key={item.to} className="px-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-2 px-2 py-2 rounded-xl text-left transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/10 border-l-4 border-blue-500 shadow-sm'
                          : 'hover:bg-gray-100/80 hover:shadow-sm'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`p-1.5 rounded-lg flex-shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm'
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <item.icon className={`h-4 w-4 ${
                            isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                        </div>
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>{item.label}</p>
                      </>
                    )}
                  </NavLink>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-2 ml-1">
              <div className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{profile?.name?.charAt(0).toUpperCase() || 'T'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate">{profile?.name}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.role}</p>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                disabled={isLoading}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50 bg-white hover:bg-red-50/50 border border-gray-200 shadow-sm"
                aria-label={isLoading ? 'Signing out' : 'Logout'}
              >
                <LogOut className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                  isLoading ? 'text-gray-400' : 'text-gray-600 group-hover:text-red-600'
                }`} />
                <span className={`transition-colors duration-200 ${
                  isLoading ? 'text-gray-500' : 'text-gray-700 group-hover:text-red-700'
                }`}>{isLoading ? 'Signing out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8">
          <Outlet />
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
                disabled={isLoading}
              >Cancel</button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-60"
              >
                {isLoading ? (
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
