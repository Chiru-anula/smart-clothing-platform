-- =========================================================================
-- CEYLON GEM CLOTHING - SPRINT 1 DATABASE SETUP & SEED DATA
-- RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/bxiiobfaqcocloxexqfi/sql
-- =========================================================================

-- 1. Create 'orders' table if not exists
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    store_name VARCHAR(255) DEFAULT 'Ceylon Gem — Colombo',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    items_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create 'reviews' table if not exists
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
    comment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disable Row Level Security (RLS) & Grant Full Access (Essential for App Writes & Deletes)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.orders TO anon, authenticated;

ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.reviews TO anon, authenticated;

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.users TO anon, authenticated;

-- 4. Enable Supabase Realtime Broadcasting for all 3 tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- 5. Ensure Admin User has valid credentials (admin@smartclothing.lk / Admin@123)
UPDATE public.users 
SET password = 'Admin@123', role = 'admin' 
WHERE email = 'admin@smartclothing.lk';

-- If admin user does not exist, insert it
INSERT INTO public.users (name, email, password, role, phone, address)
SELECT 'Platform Administrator', 'admin@smartclothing.lk', 'Admin@123', 'admin', '0712345678', 'Colombo, Sri Lanka'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@smartclothing.lk');

-- 6. Keep Sprint 1 order metrics at zero until real orders are created.
DELETE FROM public.orders;

-- 7. Insert Initial Reviews Data (if empty)
INSERT INTO public.reviews (customer_name, customer_email, product_name, rating, comment, status)
VALUES 
  ('Amaya Silva', 'amaya@example.com', 'Smart Performance Polo', 5, 'The biometric monitoring fabric is super comfortable and fits nicely.', 'approved'),
  ('Kasun Jayawardena', 'kasun@example.com', 'Smart Temperature Jacket', 4, 'Great heating element for cold weather, app controls are smooth.', 'pending'),
  ('Dilani Wickramasinghe', 'dilani@example.com', 'Linen Formal Smart Shirt', 5, 'Exceptional quality linen and quick delivery across Colombo.', 'approved'),
  ('Saman Fernando', 'saman@smartclothing.lk', 'Slim Chino Trousers', 3, 'Good fit, but shipping took an extra 2 days.', 'pending')
ON CONFLICT DO NOTHING;
