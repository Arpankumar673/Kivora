-- ==============================================================================
-- KIVORA E-COMMERCE ATOMIC ORDER CREATION RPC MIGRATION
-- Migration Version: 002_order_creation.sql
-- Description: Atomic PostgreSQL RPC function for validating inventory,
--              creating order headers, snapshotting order items, deducting stock,
--              and clearing the customer shopping cart in a single transaction.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_shipping_address JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_total_amount NUMERIC(12,2) := 0;
  v_cart_record RECORD;
  v_product_record RECORD;
  v_item_subtotal NUMERIC(12,2);
  v_created_order JSONB;
BEGIN
  -- 1. Get authenticated user ID from Supabase auth session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order.';
  END IF;

  -- 2. Verify shipping address input
  IF p_shipping_address IS NULL OR jsonb_typeof(p_shipping_address) != 'object' THEN
    RAISE EXCEPTION 'Valid shipping address is required.';
  END IF;

  -- 3. Check if cart is empty
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Your shopping cart is empty.';
  END IF;

  -- 4. Calculate authoritative total amount & validate inventory for each item
  FOR v_cart_record IN 
    SELECT c.id AS cart_id, c.product_id, c.quantity, p.name, p.price, p.stock, p.is_active
    FROM public.cart_items c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.user_id = v_user_id
  LOOP
    -- Verify product is active
    IF NOT v_cart_record.is_active THEN
      RAISE EXCEPTION 'Product "%" is no longer available.', v_cart_record.name;
    END IF;

    -- Verify stock availability
    IF v_cart_record.stock < v_cart_record.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Requested: %, Available: %.', 
        v_cart_record.name, v_cart_record.quantity, v_cart_record.stock;
    END IF;

    v_item_subtotal := v_cart_record.price * v_cart_record.quantity;
    v_total_amount := v_total_amount + v_item_subtotal;
  END LOOP;

  -- 5. Create Order Header (Status defaults to PENDING)
  INSERT INTO public.orders (
    user_id,
    total_amount,
    status,
    shipping_address
  ) VALUES (
    v_user_id,
    v_total_amount,
    'PENDING',
    p_shipping_address
  ) RETURNING id INTO v_order_id;

  -- 6. Insert Order Items & Deduct Product Stock
  FOR v_cart_record IN 
    SELECT c.id AS cart_id, c.product_id, c.quantity, p.name, p.price
    FROM public.cart_items c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.user_id = v_user_id
  LOOP
    v_item_subtotal := v_cart_record.price * v_cart_record.quantity;

    -- Insert snapshot line item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      price,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_cart_record.product_id,
      v_cart_record.name,
      v_cart_record.price,
      v_cart_record.quantity,
      v_item_subtotal
    );

    -- Atomic inventory deduction
    UPDATE public.products
    SET stock = stock - v_cart_record.quantity
    WHERE id = v_cart_record.product_id;
  END LOOP;

  -- 7. Clear Customer Shopping Cart
  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  -- 8. Return created order payload
  SELECT jsonb_build_object(
    'id', o.id,
    'user_id', o.user_id,
    'total_amount', o.total_amount,
    'status', o.status,
    'shipping_address', o.shipping_address,
    'created_at', o.created_at
  ) INTO v_created_order
  FROM public.orders o
  WHERE o.id = v_order_id;

  RETURN v_created_order;
END;
$$;
