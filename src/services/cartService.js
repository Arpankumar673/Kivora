import { supabase } from '../lib/supabase';

/**
 * Fetch all cart items for the current authenticated Supabase user,
 * joined with product details.
 */
export async function fetchCart() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*, categories(name, slug))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchCart error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Error in fetchCart service:', err);
    return [];
  }
}

/**
 * Add a product to the authenticated user's cart.
 * If item already exists, updates quantity respecting stock limits.
 */
export async function addToCart(productId, quantity = 1, currentStock = 999) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to add items to cart.');

    // 1. Check if product already exists in user's cart
    const { data: existingItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (fetchError) {
      console.warn('Fetch existing cart item error:', fetchError.message);
    }

    const existingItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > currentStock) {
        throw new Error(`Cannot add more than available stock (${currentStock}).`);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select('*, products(*)')
        .single();

      if (error) throw error;
      return data;
    } else {
      if (quantity > currentStock) {
        throw new Error(`Quantity exceeds available stock (${currentStock}).`);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: user.id,
            product_id: productId,
            quantity,
          },
        ])
        .select('*, products(*)')
        .single();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.error('addToCart error:', err);
    throw err;
  }
}

/**
 * Update quantity for a specific cart item row.
 */
export async function updateCartItem(cartItemId, quantity) {
  try {
    if (quantity < 1) {
      return await removeFromCart(cartItemId);
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select('*, products(*)')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateCartItem error:', err);
    throw err;
  }
}

/**
 * Remove a specific cart item by ID.
 */
export async function removeFromCart(cartItemId) {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('removeFromCart error:', err);
    throw err;
  }
}

/**
 * Clear all cart items belonging to the current user.
 */
export async function clearCart() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('clearCart error:', err);
    throw err;
  }
}
