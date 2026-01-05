-- SUMEE PRO DATABASE PATCH & COMPATIBILITY LAYER
-- Version 2.2: Comprehensive Column and Seed Handling
-- Fixes "column requirement_type does not exist" by ensuring structural integrity before seeding.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES (Mapping UUID user_id)
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS public.profiles (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- 3. PROFESSIONAL STATS
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS public.professional_stats (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS specialty TEXT;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS current_level_id INTEGER DEFAULT 1;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS jobs_completed_count INTEGER DEFAULT 0;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 5.0;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS expediente_pdf_url TEXT;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS expediente_status TEXT DEFAULT 'not_uploaded';
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS last_location_lat NUMERIC;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS last_location_lng NUMERIC;
    ALTER TABLE public.professional_stats ADD COLUMN IF NOT EXISTS expediente_data JSONB DEFAULT '{}'::jsonb;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_expediente_status') THEN
        ALTER TABLE public.professional_stats ADD CONSTRAINT check_expediente_status 
        CHECK (expediente_status IN ('not_uploaded', 'pending_approval', 'approved', 'rejected'));
    END IF;
END $$;

-- 4. LEADS
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS public.leads (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS price NUMERIC;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS latitude NUMERIC;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS professional_id UUID;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_name TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_phone TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS category TEXT;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_lead_status') THEN
        ALTER TABLE public.leads ADD CONSTRAINT check_lead_status 
        CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled'));
    END IF;
END $$;

-- 5. ADMIN NOTIFICATIONS
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS public.admin_notifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS message TEXT;
    ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_notif_status') THEN
        ALTER TABLE public.admin_notifications ADD CONSTRAINT check_notif_status 
        CHECK (status IN ('pending', 'viewed', 'resolved'));
    END IF;
END $$;

-- 6. BADGE DEFINITIONS (Full Alignment Fix)
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS public.badge_definitions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    );

    -- Ensure all gamification columns exist before INSERT
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS icon TEXT;
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS level TEXT;
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS requirement_type TEXT; -- The missing one
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS requirement_value NUMERIC DEFAULT 1;
    ALTER TABLE public.badge_definitions ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

    BEGIN
        ALTER TABLE public.badge_definitions ADD CONSTRAINT check_badge_level 
        CHECK (level IN ('bronze', 'silver', 'gold', 'diamond'));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 7. RLS & POLICIES

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles visibles" ON public.profiles;
CREATE POLICY "Profiles visibles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles update self" ON public.profiles;
CREATE POLICY "Profiles update self" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Stats
ALTER TABLE public.professional_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stats self access" ON public.professional_stats;
CREATE POLICY "Stats self access" ON public.professional_stats FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Stats initial insert" ON public.professional_stats;
CREATE POLICY "Stats initial insert" ON public.professional_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads visibles" ON public.leads;
CREATE POLICY "Leads visibles" ON public.leads FOR SELECT USING (status = 'pending' OR professional_id = auth.uid());
DROP POLICY IF EXISTS "Leads update" ON public.leads;
CREATE POLICY "Leads update" ON public.leads FOR UPDATE USING (professional_id = auth.uid());
DROP POLICY IF EXISTS "Leads insert" ON public.leads;
CREATE POLICY "Leads insert" ON public.leads FOR INSERT WITH CHECK (true);

-- Admin Notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User see own notifications" ON public.admin_notifications;
CREATE POLICY "User see own notifications" ON public.admin_notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Admins see all notifications" ON public.admin_notifications;
CREATE POLICY "Admins see all notifications" ON public.admin_notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- 8. TRIGGER FOR PROFILE AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    u_type TEXT;
BEGIN
    u_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'professional');

    INSERT INTO public.profiles (user_id, full_name, email, phone, user_type)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        NEW.phone,
        u_type
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone;

    IF (u_type = 'professional') THEN
        INSERT INTO public.professional_stats (user_id, full_name, average_rating, expediente_status)
        VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 5.0, 'not_uploaded')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. SEED DATA (Now safe with column verification)
INSERT INTO public.badge_definitions (id, name, description, icon, category, level, requirement_type, requirement_value, points_awarded)
VALUES 
('first_job', 'Primera Chamba', 'Completaste tu primer trabajo', '🎯', 'jobs', 'bronze', 'jobs', 1, 50),
('jobs_10', 'Estratega Decagonal', '10 trabajos completados', '⚒️', 'jobs', 'silver', 'jobs', 10, 150),
('rating_4', 'Sello de Oro', 'Manten un rating de 4.5', '⭐', 'rating', 'gold', 'rating', 4.5, 300)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    points_awarded = EXCLUDED.points_awarded;

-- 10. REALTIME
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leads; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_stats; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 11. PORTFOLIO ITEMS
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals can manage own portfolio" ON public.portfolio_items;
CREATE POLICY "Professionals can manage own portfolio" ON public.portfolio_items
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view portfolios" ON public.portfolio_items;
CREATE POLICY "Public can view portfolios" ON public.portfolio_items
    FOR SELECT USING (true);
