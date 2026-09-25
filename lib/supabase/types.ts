/**
 * Tutr Kidz - Supabase Database Types (Phase 13)
 *
 * Strongly-typed definitions matching the PostgreSQL schema.
 */

import { CurriculumLevel } from '../../types/curriculum';

export interface DbProfile {
  id: string; // UUID references auth.users(id)
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFamily {
  id: string; // UUID
  owner_id: string; // UUID references profiles(id)
  created_at: string;
  updated_at: string;
}

export interface DbChild {
  id: string; // UUID
  family_id: string; // UUID references families(id)
  name: string;
  level: CurriculumLevel;
  created_at: string;
  updated_at: string;
}

export interface DbChildPreferences {
  child_id: string; // UUID references children(id)
  daily_question_goal: 5 | 10 | 15 | 20;
  show_all_levels: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTopicProgress {
  id: string; // UUID
  child_id: string; // UUID references children(id)
  level: string;
  topic: string;
  attempts: number;
  questions_answered: number;
  correct_answers: number;
  incorrect_answers: number;
  best_score: number;
  best_total: number;
  last_score: number;
  last_total: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuizAttempt {
  id: string; // UUID
  child_id: string; // UUID references children(id)
  level: string;
  topic: string;
  score: number;
  total: number;
  completed_at: string;
  created_at: string;
}

export interface DbFamilySettings {
  family_id: string; // UUID references families(id)
  daily_question_goal_enabled: boolean;
  default_daily_question_goal: 5 | 10 | 15 | 20;
  show_all_levels_by_default: boolean;
  session_question_count: 5 | 10;
  reduce_motion: boolean;
  parent_lock_enabled: boolean;
  require_parent_confirmation_for_reset: boolean;
  created_at: string;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      families: {
        Row: DbFamily;
        Insert: {
          id?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: DbChild;
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          level: CurriculumLevel;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          level?: CurriculumLevel;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      child_preferences: {
        Row: DbChildPreferences;
        Insert: {
          child_id: string;
          daily_question_goal?: 5 | 10 | 15 | 20;
          show_all_levels?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          child_id?: string;
          daily_question_goal?: 5 | 10 | 15 | 20;
          show_all_levels?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      topic_progress: {
        Row: DbTopicProgress;
        Insert: {
          id?: string;
          child_id: string;
          level: string;
          topic: string;
          attempts?: number;
          questions_answered?: number;
          correct_answers?: number;
          incorrect_answers?: number;
          best_score?: number;
          best_total?: number;
          last_score?: number;
          last_total?: number;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          level?: string;
          topic?: string;
          attempts?: number;
          questions_answered?: number;
          correct_answers?: number;
          incorrect_answers?: number;
          best_score?: number;
          best_total?: number;
          last_score?: number;
          last_total?: number;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: DbQuizAttempt;
        Insert: {
          id?: string;
          child_id: string;
          level: string;
          topic: string;
          score: number;
          total: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          level?: string;
          topic?: string;
          score?: number;
          total?: number;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      family_settings: {
        Row: DbFamilySettings;
        Insert: {
          family_id: string;
          daily_question_goal_enabled?: boolean;
          default_daily_question_goal?: 5 | 10 | 15 | 20;
          show_all_levels_by_default?: boolean;
          session_question_count?: 5 | 10;
          reduce_motion?: boolean;
          parent_lock_enabled?: boolean;
          require_parent_confirmation_for_reset?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          family_id?: string;
          daily_question_goal_enabled?: boolean;
          default_daily_question_goal?: 5 | 10 | 15 | 20;
          show_all_levels_by_default?: boolean;
          session_question_count?: 5 | 10;
          reduce_motion?: boolean;
          parent_lock_enabled?: boolean;
          require_parent_confirmation_for_reset?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
