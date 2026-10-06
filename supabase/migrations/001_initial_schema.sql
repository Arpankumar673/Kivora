-- ==============================================================================
-- KIVORA E-COMMERCE DATABASE INITIAL SCHEMA & RLS MIGRATION
-- Migration Version: 001_initial_schema.sql
-- Description: Complete Supabase PostgreSQL Schema, Relationships, Indexes,
--              Triggers, Role Security & Row Level Security (RLS) Policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. DATABASE TABLES
-- ------------------------------------------------------------------------------

-- Table 1: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(trim(slug)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 4: CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id)
);

-- Table 5: ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 6: ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

-- ------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Helper Function: Check if the authenticated user is an ADMIN
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id AND role = 'ADMIN'
  );
END;
$$;

-- Trigger Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger Function: Prevent non-admin users from escalating their role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger Function: Automatically create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ------------------------------------------------------------------------------
-- 5. TRIGGERS ATTACHMENT
-- ------------------------------------------------------------------------------

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for Automatic Profile Creation on User Signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for Profile Role Change Protection
DROP TRIGGER IF EXISTS enforce_profile_role_security ON public.profiles;
CREATE TRIGGER enforce_profile_role_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ------------------------------------------------------------------------------
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy" ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Categories insert policy" ON public.categories;
CREATE POLICY "Categories insert policy" ON public.categories
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Categories update policy" ON public.categories;
CREATE POLICY "Categories update policy" ON public.categories
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Categories delete policy" ON public.categories;
CREATE POLICY "Categories delete policy" ON public.categories
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS "Products select policy" ON public.products;
CREATE POLICY "Products select policy" ON public.products
  FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Products insert policy" ON public.products;
CREATE POLICY "Products insert policy" ON public.products
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Products update policy" ON public.products;
CREATE POLICY "Products update policy" ON public.products
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Products delete policy" ON public.products;
CREATE POLICY "Products delete policy" ON public.products
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- CART ITEMS POLICIES
DROP POLICY IF EXISTS "Cart items select policy" ON public.cart_items;
CREATE POLICY "Cart items select policy" ON public.cart_items
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart items insert policy" ON public.cart_items;
CREATE POLICY "Cart items insert policy" ON public.cart_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart items update policy" ON public.cart_items;
CREATE POLICY "Cart items update policy" ON public.cart_items
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart items delete policy" ON public.cart_items;
CREATE POLICY "Cart items delete policy" ON public.cart_items
  FOR DELETE
  USING (user_id = auth.uid());

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
CREATE POLICY "Orders select policy" ON public.orders
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
CREATE POLICY "Orders insert policy" ON public.orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
CREATE POLICY "Orders update policy" ON public.orders
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Orders delete policy" ON public.orders;
CREATE POLICY "Orders delete policy" ON public.orders
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Order items select policy" ON public.order_items;
CREATE POLICY "Order items select policy" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Order items insert policy" ON public.order_items;
CREATE POLICY "Order items insert policy" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Order items update policy" ON public.order_items;
CREATE POLICY "Order items update policy" ON public.order_items
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Order items delete policy" ON public.order_items;
CREATE POLICY "Order items delete policy" ON public.order_items
  FOR DELETE
  USING (public.is_admin(auth.uid()));
