-- ==============================================================================
-- SOCIALCRAFT / ONYX STUDIO — ISOLATED SCHEMA MIGRATION
-- Project: Socialcraft Karussell & Persona Studio
-- Isolated prefix: socialcraft_* (Leaves all other tables untouched)
-- ==============================================================================

-- 1. Socialcraft User Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.socialcraft_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Creator',
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('admin', 'creator', 'pro', 'free')),
  credits INTEGER NOT NULL DEFAULT 1000,
  avatar_url TEXT DEFAULT '',
  company TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Socialcraft Saved Carousels
CREATE TABLE IF NOT EXISTS public.socialcraft_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT DEFAULT '',
  audience TEXT DEFAULT '',
  design_id TEXT DEFAULT 'ember-ignite',
  slide_count INTEGER DEFAULT 6,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Socialcraft Cloud Images (Synced with Mega S4 / Object Storage)
CREATE TABLE IF NOT EXISTS public.socialcraft_cloud_images (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  s4_key TEXT NOT NULL,
  url TEXT NOT NULL,
  prompt TEXT DEFAULT '',
  aspect_ratio TEXT DEFAULT '4:5',
  category TEXT DEFAULT 'carousel',
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Socialcraft Persona Profiles (AI Clones)
CREATE TABLE IF NOT EXISTS public.socialcraft_persona_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT DEFAULT '',
  reference_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  gender_age TEXT DEFAULT '',
  hair_face TEXT DEFAULT '',
  tattoos_features TEXT DEFAULT '',
  wardrobe TEXT DEFAULT '',
  lighting_look TEXT DEFAULT '',
  framing_camera TEXT DEFAULT '',
  negative_prompt TEXT DEFAULT '',
  custom_prefix TEXT DEFAULT '',
  placement TEXT DEFAULT 'hook_closing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.socialcraft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socialcraft_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socialcraft_cloud_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socialcraft_persona_profiles ENABLE ROW LEVEL SECURITY;

-- Security helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_socialcraft_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.socialcraft_profiles
    WHERE id = check_user_id AND role = 'admin'
  );
$$;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "socialcraft_profiles_read_own_or_admin" ON public.socialcraft_profiles;
CREATE POLICY "socialcraft_profiles_read_own_or_admin"
  ON public.socialcraft_profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_socialcraft_admin(auth.uid()));

DROP POLICY IF EXISTS "socialcraft_profiles_update_own_or_admin" ON public.socialcraft_profiles;
CREATE POLICY "socialcraft_profiles_update_own_or_admin"
  ON public.socialcraft_profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_socialcraft_admin(auth.uid()));

-- RLS Policies for Carousels
DROP POLICY IF EXISTS "socialcraft_carousels_crud" ON public.socialcraft_carousels;
CREATE POLICY "socialcraft_carousels_crud"
  ON public.socialcraft_carousels
  FOR ALL
  USING (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()));

-- RLS Policies for Cloud Images
DROP POLICY IF EXISTS "socialcraft_cloud_images_crud" ON public.socialcraft_cloud_images;
CREATE POLICY "socialcraft_cloud_images_crud"
  ON public.socialcraft_cloud_images
  FOR ALL
  USING (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()));

-- RLS Policies for Personas
DROP POLICY IF EXISTS "socialcraft_persona_profiles_crud" ON public.socialcraft_persona_profiles;
CREATE POLICY "socialcraft_persona_profiles_crud"
  ON public.socialcraft_persona_profiles
  FOR ALL
  USING (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_socialcraft_admin(auth.uid()));

-- Trigger function: Auto-create socialcraft_profiles row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_socialcraft_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  assigned_credits INTEGER;
BEGIN
  -- Strict isolation: Only handle users registering for Socialcraft or the specific Admin
  -- Users created by other projects in this same Supabase instance are completely ignored
  IF NOT (
    NEW.email = 'admin@socialcraft.ai' OR
    NEW.raw_user_meta_data->>'app' = 'socialcraft' OR
    NEW.raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.email = 'admin@socialcraft.ai' OR NEW.raw_user_meta_data->>'role' = 'admin' THEN
    assigned_role := 'admin';
    assigned_credits := 99999;
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
    assigned_credits := 1000;
  END IF;

  INSERT INTO public.socialcraft_profiles (
    id,
    email,
    name,
    role,
    credits,
    avatar_url,
    company,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    assigned_role,
    assigned_credits,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'),
    COALESCE(NEW.raw_user_meta_data->>'company', 'Socialcraft Studio'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_socialcraft ON auth.users;
CREATE TRIGGER on_auth_user_created_socialcraft
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_socialcraft_user();
