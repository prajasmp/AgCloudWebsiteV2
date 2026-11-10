-- ========================================================
-- NOVEXHOST PLATFORM - SUPABASE SCHEMA MIGRATION
-- Project: NOVEXHOST (Premium Cloud & VPS Hosting)
-- ========================================================

-- 1. Ensure 'orders' table has all Razorpay, Web Hosting and VDS tracking fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS server_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS domain_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ssh_key TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS machine_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS server_region TEXT DEFAULT 'Mumbai, India';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS server_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deployment_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    mobile TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'Razorpay',
    razorpay_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'paid',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- 3. Webhook Events Table (Idempotency verification)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,
    event TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Price Overrides (Admin dynamic pricing)
CREATE TABLE IF NOT EXISTS public.product_prices (
    plan_id TEXT PRIMARY KEY,
    original_price NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
DROP POLICY IF EXISTS "Anon no access to invoices" ON public.invoices;
CREATE POLICY "Anon no access to invoices" ON public.invoices FOR ALL USING (false);

DROP POLICY IF EXISTS "Anon no access to webhooks" ON public.webhook_events;
CREATE POLICY "Anon no access to webhooks" ON public.webhook_events FOR ALL USING (false);

DROP POLICY IF EXISTS "Public read product_prices" ON public.product_prices;
CREATE POLICY "Public read product_prices" ON public.product_prices FOR SELECT USING (true);

-- ========================================================
-- 5. Web Hosting Accounts Table (cPanel / WHM)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.web_hosting_accounts (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    domain TEXT NOT NULL,
    username TEXT NOT NULL,
    package TEXT NOT NULL,
    cpanel_url TEXT NOT NULL,
    nameservers JSONB,
    customer_email TEXT,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_hosting_domain ON public.web_hosting_accounts(domain);
CREATE INDEX IF NOT EXISTS idx_web_hosting_order_id ON public.web_hosting_accounts(order_id);

-- ========================================================
-- 6. Physical Bare-Metal Machines Inventory (VDS Fleet)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.physical_machines (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    rack TEXT NOT NULL,
    datacenter TEXT NOT NULL,
    location TEXT NOT NULL,
    processor TEXT NOT NULL,
    ram TEXT NOT NULL,
    storage TEXT NOT NULL,
    ipmi_ip TEXT,
    mac_address TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    allocated_order_id TEXT,
    ip_pool JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physical_machines_plan ON public.physical_machines(plan_id);
CREATE INDEX IF NOT EXISTS idx_physical_machines_status ON public.physical_machines(status);

-- ========================================================
-- 7. VDS Bare-Metal Orders & Provisioning Records
-- ========================================================
CREATE TABLE IF NOT EXISTS public.vds_orders (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    machine_id TEXT REFERENCES public.physical_machines(id) ON DELETE SET NULL,
    machine_name TEXT NOT NULL,
    rack TEXT,
    datacenter TEXT,
    ip TEXT NOT NULL,
    ssh_port INT DEFAULT 22,
    root_user TEXT DEFAULT 'root',
    os TEXT NOT NULL,
    processor TEXT NOT NULL,
    ram TEXT NOT NULL,
    storage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    customer_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vds_orders_order_id ON public.vds_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_vds_orders_machine_id ON public.vds_orders(machine_id);

ALTER TABLE public.web_hosting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vds_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon no access to web_hosting_accounts" ON public.web_hosting_accounts FOR ALL USING (false);
CREATE POLICY "Anon no access to physical_machines" ON public.physical_machines FOR ALL USING (false);
CREATE POLICY "Anon no access to vds_orders" ON public.vds_orders FOR ALL USING (false);


