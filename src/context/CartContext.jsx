import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as cartService from '../services/cartService';

export const CartContext = createContext({
  cartItems: [],
  cartCount: 0,
  cartTotal: 0,
  loading: false,
  error: '',
  addItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  clearUserCart: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refresh cart data from Supabase
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const items = await cartService.fetchCart();
      setCartItems(items);
    } catch (err) {
      console.warn('Cart refresh error:', err);
      setError('Failed to refresh cart items.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sync cart when authenticated user state changes
  useEffect(() => {
    refreshCart();
  }, [user, refreshCart]);

  // Add item to cart
  const addItem = async (productId, quantity = 1, currentStock = 999) => {
    if (!user) {
      throw new Error('UNAUTHENTICATED');
    }
    setError('');
    try {
      await cartService.addToCart(productId, quantity, currentStock);
      await refreshCart();
    } catch (err) {
      setError(err.message || 'Failed to add item to cart.');
      throw err;
    }
  };

  // Update item quantity
  const updateItem = async (cartItemId, quantity) => {
    if (!user) return;
    setError('');
    try {
      await cartService.updateCartItem(cartItemId, quantity);
      await refreshCart();
    } catch (err) {
      setError(err.message || 'Failed to update cart quantity.');
      throw err;
    }
  };

  // Remove item
  const removeItem = async (cartItemId) => {
    if (!user) return;
    setError('');
    try {
      await cartService.removeFromCart(cartItemId);
      await refreshCart();
    } catch (err) {
      setError(err.message || 'Failed to remove item from cart.');
      throw err;
    }
  };

  // Clear all items in cart
  const clearUserCart = async () => {
    if (!user) return;
    setError('');
    try {
      await cartService.clearCart();
      setCartItems([]);
    } catch (err) {
      setError(err.message || 'Failed to clear shopping cart.');
      throw err;
    }
  };

  // Compute total item count (sum of quantities)
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Compute cart total amount (sum of subtotal prices)
  const cartTotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.products?.price ?? 0;
    return sum + (itemPrice * (item.quantity || 0));
  }, 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearUserCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
