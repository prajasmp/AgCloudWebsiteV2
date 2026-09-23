-- ========================================================
-- AG CLOUD HOSTING - SUPABASE DATABASE MIGRATION SCRIPT
-- ========================================================
-- Run this script inside your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

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
    duration TEXT DEFAULT '1 Month',
    duration_days INT DEFAULT 30,
    payment_proof TEXT,
    rejection_reason TEXT,
    gateway_payment_id TEXT UNIQUE,
    gateway_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    provisioning_status TEXT NOT NULL DEFAULT 'waiting_approval', -- waiting_approval, provisioning, active, rejected
    panel_server_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    provisioned_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure existing orders table has required columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1 Month';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Ensure existing servers table has expiry columns
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Indexes for fast queries
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
    status TEXT NOT NULL DEFAULT 'installing', -- installing, online, offline, suspended, error
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Block direct anonymous browser access to sensitive tables.
-- All operations are performed securely via backend using SUPABASE_SERVICE_ROLE_KEY.
DROP POLICY IF EXISTS "No direct anon access to orders" ON public.orders;
CREATE POLICY "No direct anon access to orders" ON public.orders FOR ALL USING (false);

DROP POLICY IF EXISTS "No direct anon access to servers" ON public.servers;
CREATE POLICY "No direct anon access to servers" ON public.servers FOR ALL USING (false);

DROP POLICY IF EXISTS "No direct anon access to users" ON public.users;
CREATE POLICY "No direct anon access to users" ON public.users FOR ALL USING (false);
