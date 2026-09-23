-- ========================================================
-- AG CLOUD HOSTR - ADMIN ROLES & SYSTEM MIGRATION
-- Execute this SQL in Supabase SQL Editor
-- ========================================================

-- 1. Create admin_users table for multi-admin role management
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin', -- 'owner' or 'admin'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'system'
);

-- 2. Insert Immutable Primary Owner Admin
INSERT INTO public.admin_users (email, role, is_active, created_by)
VALUES ('r26377269@gmail.com', 'owner', true, 'system')
ON CONFLICT (email) 
DO UPDATE SET role = 'owner', is_active = true;

-- 3. Create index for fast authorization lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_uid ON public.admin_users(firebase_uid);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Admins can read admin records
CREATE POLICY "Admins read admin_users" ON public.admin_users
    FOR SELECT USING (true);

-- 6. Ensure servers table has owner_uid index
CREATE INDEX IF NOT EXISTS idx_servers_owner_uid ON public.servers(owner_uid);
CREATE INDEX IF NOT EXISTS idx_orders_owner_uid ON public.orders(owner_uid);
