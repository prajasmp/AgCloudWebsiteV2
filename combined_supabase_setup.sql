-- ========================================================
-- AG CLOUD HOSTING - COMPLETE SUPABASE DATABASE SETUP
-- Project URL: https://imnvvgiwokecoehatmbg.supabase.co
-- Run this entire SQL script inside your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/imnvvgiwokecoehatmbg/sql/new
-- ========================================================

-- 1. Create 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    owner_uid TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    contact_email TEXT,
    mobile TEXT,
    upi_id TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    gateway_payment_id TEXT UNIQUE,
    gateway_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    provisioning_status TEXT NOT NULL DEFAULT 'waiting_payment',
    panel_server_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    provisioned_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_owner_uid ON public.orders(owner_uid);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_payment_id ON public.orders(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 2. Create 'servers' table
CREATE TABLE IF NOT EXISTS public.servers (
    id TEXT PRIMARY KEY,
    owner_uid TEXT NOT NULL,
    owner_email TEXT,
    order_id TEXT UNIQUE REFERENCES public.orders(id) ON DELETE SET NULL,
    plan_id TEXT NOT NULL,
    panel_server_id TEXT UNIQUE NOT NULL,
    panel_uuid TEXT,
    server_name TEXT NOT NULL,
    node_id INT,
    allocation_id INT,
    ip TEXT,
    port INT,
    memory_mb INT NOT NULL,
    disk_mb INT NOT NULL,
    cpu_percent INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'installing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for servers
CREATE INDEX IF NOT EXISTS idx_servers_owner_uid ON public.servers(owner_uid);
CREATE INDEX IF NOT EXISTS idx_servers_panel_server_id ON public.servers(panel_server_id);

-- 3. Create 'users' table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Stores verified Firebase UID
    display_name TEXT,
    email TEXT,
    photo_url TEXT,
    pterodactyl_user_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'admin_users' table for multi-admin roles
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin', -- 'owner' or 'admin'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'system'
);

-- Insert Immutable Primary Owner Admin
INSERT INTO public.admin_users (email, role, is_active, created_by)
VALUES ('r26377269@gmail.com', 'owner', true, 'system')
ON CONFLICT (email) 
DO UPDATE SET role = 'owner', is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_uid ON public.admin_users(firebase_uid);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Block direct anonymous browser access to sensitive backend tables
DROP POLICY IF EXISTS "No direct anon access to orders" ON public.orders;
CREATE POLICY "No direct anon access to orders" ON public.orders FOR ALL USING (false);

DROP POLICY IF EXISTS "No direct anon access to servers" ON public.servers;
CREATE POLICY "No direct anon access to servers" ON public.servers FOR ALL USING (false);

DROP POLICY IF EXISTS "No direct anon access to users" ON public.users;
CREATE POLICY "No direct anon access to users" ON public.users FOR ALL USING (false);

DROP POLICY IF EXISTS "Admins read admin_users" ON public.admin_users;
CREATE POLICY "Admins read admin_users" ON public.admin_users FOR SELECT USING (true);
