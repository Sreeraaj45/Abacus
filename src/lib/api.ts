import { UserRole, Profile } from '../types';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface ProfileResponse {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json();
    },

    register: async (email: string, password: string, name: string, role: UserRole): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return response.json();
    },

    logout: async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem('token');
    },
  },

  profile: {
    getByUserId: async (userId: string): Promise<ProfileResponse> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Failed to fetch profile');
      }

      return response.json();
    },

    update: async (userId: string, updates: Partial<ProfileResponse>): Promise<ProfileResponse> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
  },

  levels: {
    getAll: async (): Promise<Array<{ id: string; name: string; description: string | null; level_order: number; min_accuracy: number; min_speed_seconds: number; exercises_required: number; created_at: string; updated_at: string }>> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/levels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch levels');
      }

      return response.json();
    },

    getById: async (id: string): Promise<{ id: string; name: string; description: string | null; level_order: number; min_accuracy: number; min_speed_seconds: number; exercises_required: number; created_at: string; updated_at: string }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/levels/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch level');
      }

      return response.json();
    },
  },

  students: {
    getByTeacherId: async (teacherId: string): Promise<Array<{ id: string; profile_id: string; teacher_id: string; current_level_id: string | null; enrolled_at: string; is_active: boolean; notes: string | null; updated_at: string; profile: { id: string; name: string; email: string; role: UserRole }; level: { id: string; name: string } | null }>> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/students?teacher_id=${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      return response.json();
    },

    create: async (studentData: { profile_id: string; teacher_id: string; current_level_id: string | null; notes: string | null }): Promise<{ id: string; profile_id: string; teacher_id: string; current_level_id: string | null; enrolled_at: string; is_active: boolean; notes: string | null; updated_at: string }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create student');
      }

      return response.json();
    },
  },

  exercises: {
    getAll: async (): Promise<Array<{ id: string; lesson_id: string; exercise_type: string; problem: string; answer: string | number; difficulty: number; created_at: string; updated_at: string }>> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/exercises`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }

      return response.json();
    },

    create: async (exerciseData: { lesson_id: string; exercise_type: string; problem: string; answer: string | number; difficulty: number }): Promise<{ id: string; lesson_id: string; exercise_type: string; problem: string; answer: string | number; difficulty: number; created_at: string; updated_at: string }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }

      return response.json();
    },
  },

  exerciseAttempts: {
    create: async (attemptData: { 
                operation: string; 
                num1: number; 
                num2: number; 
                correct_answer: number; 
                user_answer: number; 
                is_correct: boolean; 
                time_taken: number; 
            }): Promise<{ id: number }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/exercise-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attemptData),
      });

      if (!response.ok) {
        throw new Error('Failed to record exercise attempt');
      }

      return response.json();
    },

    getByTeacherId: async (teacherId: string): Promise<Array<{ id: number; student_id: number; operation: string; num1: number; num2: number; correct_answer: number; user_answer: number; is_correct: boolean; time_taken: number; created_at: string; student: { id: number; name: string; email: string } }>> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/exercise-attempts/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercise attempts');
      }

      return response.json();
    },
  },
};