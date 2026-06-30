import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserRole, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // We have a token, try to get the user profile
      // First, we need to get the user data from the token (we don't have it stored, so we'll fetch from /me endpoint)
      // Alternatively, we can store user data in localStorage along with token
      // For now, let's assume we have a /me endpoint that returns user data
      fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            // Now fetch the profile
            await fetchProfile(userData.id);
          } else if (res.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('token');
          setUser(null);
          setProfile(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        await fetchProfile(data.user.id);
        return { error: null };
      } else {
        const errorData = await response.json();
        return { error: new Error(errorData.message || 'Login failed') };
      }
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        await fetchProfile(data.user.id);
        return { error: null };
      } else {
        const errorData = await response.json();
        return { error: new Error(errorData.message || 'Sign up failed') };
      }
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    // Optionally, call backend to invalidate token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
