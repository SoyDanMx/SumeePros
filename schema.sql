-- SUMEE PRO PRODUCTION SCHEMA (FIXED TYPES)
-- Version 1.2: Compatibility with UUID/BigInt mixed environments

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFESSIONAL STATS (Base de datos del perfil profesional)
-- Referenciamos a auth.users directamente para asegurar compatibilidad con UUID
CREATE TABLE IF NOT EXISTS public.professional_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level_id INTEGER DEFAULT 1,
    jobs_completed_count INTEGER DEFAULT 0,
    average_rating NUMERIC DEFAULT 5.0,
    cancellation_rate NUMERIC DEFAULT 0,
    response_time_avg_minutes INTEGER DEFAULT 0,
    expediente_pdf_url TEXT,
    expediente_status TEXT DEFAULT 'not_uploaded' CHECK (expediente_status IN ('not_uploaded', 'pending_approval', 'approved', 'rejected')),
    is_online BOOLEAN DEFAULT true,
    last_location_lat NUMERIC,
    last_location_lng NUMERIC,
    push_token TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LEADS / JOBS
-- Eliminamos la referencia a profiles(id) y usamos auth.users(id) para evitar el error de BigInt
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    location TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    category TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled')),
    is_urgent BOOLEAN DEFAULT false,
    client_name TEXT,
    client_phone TEXT,
    professional_id UUID REFERENCES auth.users(id), -- Cambiado a auth.users
    distance_km NUMERIC DEFAULT 1.5,
    ai_tags TEXT[],
    checklist JSONB,
    bonus NUMERIC DEFAULT 0
);

-- 4. BADGE DEFINITIONS
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    level TEXT CHECK (level IN ('bronze', 'silver', 'gold', 'diamond')),
    requirement INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0
);

-- 5. USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badge_definitions(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress NUMERIC DEFAULT 0,
    UNIQUE(user_id, badge_id)
);

-- 6. BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clabe TEXT NOT NULL,
    bank_name TEXT,
    holder_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ADMIN NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RLS & POLICIES (Usando auth.uid() directamente)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Jobs visibles" ON public.jobs;
CREATE POLICY "Jobs visibles" ON public.jobs FOR SELECT USING (status = 'pending' OR professional_id = auth.uid());
CREATE POLICY "Jobs update" ON public.jobs FOR UPDATE USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Stats self" ON public.professional_stats;
CREATE POLICY "Stats self select" ON public.professional_stats FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Bank self" ON public.bank_accounts;
CREATE POLICY "Bank accounts owner" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Portfolio self management" ON public.portfolio_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Portfolio public view" ON public.portfolio_items FOR SELECT USING (true);

-- 14. PORTFOLIO ITEMS
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. AI CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.ai_consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    ai_response JSONB, -- Stores the structured persona response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for AI Consultations
CREATE POLICY "AI self management" ON public.ai_consultations FOR ALL USING (auth.uid() = user_id);

-- 16. SEED DATA
INSERT INTO public.badge_definitions (id, name, description, icon, category, level, requirement, points)
VALUES 
('first_job', 'Primera Chamba', 'Completaste tu primer trabajo', '🎯', 'jobs', 'bronze', 1, 50),
('jobs_10', 'Estratega Decagonal', '10 trabajos completados', '⚒️', 'jobs', 'silver', 10, 150),
('rating_4', 'Sello de Oro', 'Manten un rating de 4.5', '⭐', 'rating', 'gold', 4.5, 300)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.jobs (title, description, price, location, latitude, longitude, category, is_urgent)
VALUES 
('Instalación CCTV - 4 Cámaras', 'Instalación completa de sistema de seguridad Hikvision.', 2800.00, 'Col. Roma Norte', 19.4194, -99.1622, 'Seguridad', true),
('Mantenimiento Minisplit', 'Servicio de limpieza y filtros.', 850.00, 'Polanco', 19.4326, -99.1942, 'Climatización', false)
ON CONFLICT DO NOTHING;

-- 10. REALTIME
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_stats;
