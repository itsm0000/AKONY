-- Supabase Schema Update for AI Categorization Cache

CREATE TABLE IF NOT EXISTS categorized_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  categorized_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we only cache once per unique scope per material
  UNIQUE(material_id, start_page, end_page)
);

-- Note for the user: Please run this in your Supabase SQL Editor.
