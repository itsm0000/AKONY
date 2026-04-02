-- AKONY K-12 Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================
-- 1. SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CHAPTERS
-- ============================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, chapter_number)
);

-- ============================================
-- 3. QUESTIONS (Master Repository)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'definition',
    'problem',
    'explanation',
    'activity',
    'comparison',
    'drawing',
    'mcq',
    'short_answer'
  )),
  content JSONB NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  is_ministerial BOOLEAN DEFAULT false,
  years_appeared TEXT[] DEFAULT '{}',
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXAM BLUEPRINTS
-- ============================================
CREATE TABLE IF NOT EXISTS exam_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('daily', 'monthly', 'midterm', 'ministerial')),
  structure_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, exam_type)
);

-- ============================================
-- 5. USER PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_post_generate_action TEXT DEFAULT 'editor' CHECK (default_post_generate_action IN ('editor', 'preview')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON questions(subject_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_ministerial ON questions(is_ministerial) WHERE is_ministerial = true;
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_subject ON exam_blueprints(subject_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for curriculum data (subjects, chapters, questions, blueprints)
CREATE POLICY "Allow public read subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public read blueprints" ON exam_blueprints FOR SELECT USING (true);

-- User preferences: users can only read/write their own
CREATE POLICY "Users can read own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for seeding scripts)
-- No explicit policy needed — service role bypasses RLS
