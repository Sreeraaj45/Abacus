export type UserRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Level {
  id: string;
  name: string;
  description: string | null;
  level_order: number;
  min_accuracy: number;
  min_speed_seconds: number;
  exercises_required: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  teacher_id: string;
  current_level_id: string | null;
  enrolled_at: string;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
  // Joined data
  profile?: Profile;
  level?: Level | null;
  teacher?: Profile;
}

export interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  loading: boolean;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  difficulty: 'easy' | 'medium' | 'hard';
  num1: number;
  num2: number;
  correct_answer: number;
  time_limit_seconds: number;
  order: number;
  created_at: string;
}

export interface ExerciseAttempt {
  id: string;
  student_id: string;
  exercise_id: string;
  user_answer: number;
  is_correct: boolean;
  time_taken_seconds: number;
  attempted_at: string;
}
