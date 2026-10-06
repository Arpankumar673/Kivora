-- ==============================================================================
-- KIVORA E-COMMERCE ADMIN MANAGEMENT HELPER MIGRATION
-- Migration Version: 003_admin_management.sql
-- Description: Helper functions for category deletion safety and admin metrics.
-- ==============================================================================

-- Helper Function: Check if category can be safely deleted (no products reference it)
CREATE OR REPLACE FUNCTION public.can_delete_category(p_category_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 
    FROM public.products 
    WHERE category_id = p_category_id
  );
$$;
