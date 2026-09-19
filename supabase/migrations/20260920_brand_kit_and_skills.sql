-- ==============================================================================
-- SOCIALCRAFT / ONYX STUDIO — BRAND KITS & AI SKILLS SCHEMA
-- Migration: 20260920_brand_kit_and_skills.sql
-- ==============================================================================

-- 1. Socialcraft Brand Kits
CREATE TABLE IF NOT EXISTS public.socialcraft_brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Haupt-Brandkit',
  handle TEXT NOT NULL DEFAULT '@creator',
  show_handle BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT DEFAULT '',
  primary_color_hex TEXT NOT NULL DEFAULT '#FF4D17',
  accent_color_hex TEXT NOT NULL DEFAULT '#F04A20',
  background_color_hex TEXT NOT NULL DEFAULT '#0A0705',
  font_family TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
  aspect_ratio TEXT NOT NULL DEFAULT '4:5',
  cta_text TEXT NOT NULL DEFAULT 'Speichere dir diesen Leitfaden für später ab 📌',
  accent_style TEXT DEFAULT 'ember-ignite',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Socialcraft Custom AI Skills
CREATE TABLE IF NOT EXISTS public.socialcraft_ai_skills (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT 'Sparkles',
  system_prompt TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'Provokant & Direkt',
  target_audience TEXT DEFAULT '',
  forbidden_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_style TEXT DEFAULT 'save_and_share',
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.socialcraft_brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socialcraft_ai_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Brand Kits
DROP POLICY IF EXISTS "socialcraft_brand_kits_crud" ON public.socialcraft_brand_kits;
CREATE POLICY "socialcraft_brand_kits_crud"
  ON public.socialcraft_brand_kits
  FOR ALL
  USING (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()));

-- RLS Policies for AI Skills
DROP POLICY IF EXISTS "socialcraft_ai_skills_crud" ON public.socialcraft_ai_skills;
CREATE POLICY "socialcraft_ai_skills_crud"
  ON public.socialcraft_ai_skills
  FOR ALL
  USING (auth.uid() = user_id OR is_preset = true OR public.is_socialcraft_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()));
