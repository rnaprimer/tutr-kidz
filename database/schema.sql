-- ============================================================================
-- Tutr Kidz — Phase 13: PostgreSQL Database Schema & Row Level Security
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES (Parent User)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. FAMILIES (Family Account)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. CHILDREN (Individual Learners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('toddler', 'class-1', 'class-2', 'class-3', 'class-4')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. CHILD PREFERENCES (One-to-one with children)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.child_preferences (
  child_id UUID PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
  daily_question_goal INTEGER NOT NULL DEFAULT 5 CHECK (daily_question_goal IN (5, 10, 15, 20)),
  show_all_levels BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. TOPIC PROGRESS (Summary records per child & topic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  incorrect_answers INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_answers >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  best_total INTEGER NOT NULL DEFAULT 0 CHECK (best_total >= 0),
  last_score INTEGER NOT NULL DEFAULT 0 CHECK (last_score >= 0),
  last_total INTEGER NOT NULL DEFAULT 0 CHECK (last_total >= 0),
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_child_level_topic UNIQUE (child_id, level, topic),
  CONSTRAINT valid_answers CHECK (correct_answers + incorrect_answers <= questions_answered)
);

-- ============================================================================
-- 6. QUIZ ATTEMPTS (Immutable historical log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_attempt_score CHECK (score <= total)
);

-- ============================================================================
-- 7. FAMILY SETTINGS (App configuration for family)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_settings (
  family_id UUID PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  daily_question_goal_enabled BOOLEAN NOT NULL DEFAULT true,
  default_daily_question_goal INTEGER NOT NULL DEFAULT 5 CHECK (default_daily_question_goal IN (5, 10, 15, 20)),
  show_all_levels_by_default BOOLEAN NOT NULL DEFAULT true,
  session_question_count INTEGER NOT NULL DEFAULT 5 CHECK (session_question_count IN (5, 10)),
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  parent_lock_enabled BOOLEAN NOT NULL DEFAULT false,
  require_parent_confirmation_for_reset BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_families_owner_id ON public.families(owner_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);
CREATE INDEX IF NOT EXISTS idx_child_preferences_child_id ON public.child_preferences(child_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_child_id ON public.topic_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_child_level ON public.topic_progress(child_id, level);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_child_id ON public.quiz_attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_child_completed ON public.quiz_attempts(child_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_settings_family_id ON public.family_settings(family_id);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_settings ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles Policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 9.2 Families Policies
CREATE POLICY "families_select_own" ON public.families
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "families_insert_own" ON public.families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_update_own" ON public.families
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_delete_own" ON public.families
  FOR DELETE USING (owner_id = auth.uid());

-- 9.3 Children Policies
CREATE POLICY "children_select_family" ON public.children
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "children_insert_family" ON public.children
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "children_update_family" ON public.children
  FOR UPDATE USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  ) WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "children_delete_family" ON public.children
  FOR DELETE USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

-- 9.4 Child Preferences Policies
CREATE POLICY "child_preferences_select_family" ON public.child_preferences
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "child_preferences_insert_family" ON public.child_preferences
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "child_preferences_update_family" ON public.child_preferences
  FOR UPDATE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  ) WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "child_preferences_delete_family" ON public.child_preferences
  FOR DELETE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

-- 9.5 Topic Progress Policies
CREATE POLICY "topic_progress_select_family" ON public.topic_progress
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "topic_progress_insert_family" ON public.topic_progress
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "topic_progress_update_family" ON public.topic_progress
  FOR UPDATE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  ) WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "topic_progress_delete_family" ON public.topic_progress
  FOR DELETE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

-- 9.6 Quiz Attempts Policies
CREATE POLICY "quiz_attempts_select_family" ON public.quiz_attempts
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "quiz_attempts_insert_family" ON public.quiz_attempts
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "quiz_attempts_update_family" ON public.quiz_attempts
  FOR UPDATE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  ) WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.owner_id = auth.uid()
    )
  );

-- 9.7 Family Settings Policies
CREATE POLICY "family_settings_select_family" ON public.family_settings
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "family_settings_insert_family" ON public.family_settings
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "family_settings_update_family" ON public.family_settings
  FOR UPDATE USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  ) WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "family_settings_delete_family" ON public.family_settings
  FOR DELETE USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- 10. AUTH TRIGGER FOR AUTOMATIC PROFILE & FAMILY PROVISIONING
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  );

  -- 2. Create Default Family
  INSERT INTO public.families (id, owner_id, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.id, now(), now())
  RETURNING id INTO new_family_id;

  -- 3. Create Default Family Settings
  INSERT INTO public.family_settings (
    family_id,
    daily_question_goal_enabled,
    default_daily_question_goal,
    show_all_levels_by_default,
    session_question_count,
    reduce_motion,
    parent_lock_enabled,
    require_parent_confirmation_for_reset,
    created_at,
    updated_at
  ) VALUES (
    new_family_id,
    true,
    5,
    true,
    5,
    false,
    false,
    true,
    now(),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 11. ROLE PERMISSIONS & POSTGREST SCHEMA CACHE
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
