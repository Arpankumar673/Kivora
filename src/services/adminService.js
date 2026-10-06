import { supabase } from '../lib/supabase';

/**
 * Fetch summary metrics for Admin Dashboard.
 * Revenue counts all non-cancelled orders.
 */
export async function fetchDashboardMetrics() {
  try {
    // 1. Products metrics
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, is_active, stock');

    const totalProducts = products ? products.length : 0;
    const activeProducts = products ? products.filter((p) => p.is_active).length : 0;
    const lowStockProducts = products ? products.filter((p) => p.stock <= 5).length : 0;

    // 2. Categories metrics
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('id');

    const totalCategories = categories ? categories.length : 0;

    // 3. Orders metrics
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('id, status, total_amount');

    const totalOrders = orders ? orders.length : 0;
    const pendingOrders = orders ? orders.filter((o) => o.status === 'PENDING').length : 0;
    const confirmedOrders = orders ? orders.filter((o) => o.status === 'CONFIRMED').length : 0;
    const processingOrders = orders ? orders.filter((o) => o.status === 'PROCESSING').length : 0;
    const shippedOrders = orders ? orders.filter((o) => o.status === 'SHIPPED').length : 0;
    const deliveredOrders = orders ? orders.filter((o) => o.status === 'DELIVERED').length : 0;
    const cancelledOrders = orders ? orders.filter((o) => o.status === 'CANCELLED').length : 0;

    // Revenue = sum of non-cancelled order totals
    const totalRevenue = orders
      ? orders
          .filter((o) => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      : 0;

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    };
  } catch (err) {
    console.warn('fetchDashboardMetrics error:', err);
    return {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      totalCategories: 0,
      totalOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
    };
  }
}

// ------------------------------------------------------------------------------
// PRODUCT ADMIN OPERATIONS
// ------------------------------------------------------------------------------

export async function adminFetchProducts({ categoryId = '', searchQuery = '' } = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('adminFetchProducts error:', err);
    throw err;
  }
}

export async function adminCreateProduct(productData) {
  try {
    const payload = {
      name: productData.name.trim(),
      description: productData.description?.trim() || null,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock, 10),
      category_id: productData.category_id || null,
      image_url: productData.image_url?.trim() || null,
      is_active: productData.is_active ?? true,
    };

    if (payload.price < 0 || payload.stock < 0) {
      throw new Error('Price and Stock must be non-negative values.');
    }

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select('*, categories(name)')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('adminCreateProduct error:', err);
    throw err;
  }
}

export async function adminUpdateProduct(id, productData) {
  try {
    const payload = {
      name: productData.name.trim(),
      description: productData.description?.trim() || null,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock, 10),
      category_id: productData.category_id || null,
      image_url: productData.image_url?.trim() || null,
      is_active: productData.is_active,
    };

    if (payload.price < 0 || payload.stock < 0) {
      throw new Error('Price and Stock must be non-negative values.');
    }

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('adminUpdateProduct error:', err);
    throw err;
  }
}

export async function adminToggleProductActive(id, is_active) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('adminToggleProductActive error:', err);
    throw err;
  }
}

// ------------------------------------------------------------------------------
// CATEGORY ADMIN OPERATIONS
// ------------------------------------------------------------------------------

export async function adminFetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id)')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('adminFetchCategories error:', err);
    throw err;
  }
}

export async function adminCreateCategory({ name, slug }) {
  try {
    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');

    if (!cleanName || !cleanSlug) {
      throw new Error('Category name and slug are required.');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: cleanName, slug: cleanSlug }])
      .select()
      .single();

    if (error) {
      if (error.message?.includes('unique') || error.code === '23505') {
        throw new Error('A category with this name or slug already exists.');
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('adminCreateCategory error:', err);
    throw err;
  }
}

export async function adminUpdateCategory(id, { name, slug }) {
  try {
    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('categories')
      .update({ name: cleanName, slug: cleanSlug })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('adminUpdateCategory error:', err);
    throw err;
  }
}

export async function adminDeleteCategory(id) {
  try {
    // Check if any product belongs to this category to prevent orphaned products
    const { data: countData, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id);

    if (checkError) {
      console.warn('Category reference check warning:', checkError.message);
    }

    if (countData && countData.length > 0) {
      throw new Error(`Cannot delete category because ${countData.length} product(s) reference it. Please reassign or deactivate the products first.`);
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('adminDeleteCategory error:', err);
    throw err;
  }
}

// ------------------------------------------------------------------------------
// ORDER ADMIN OPERATIONS
// ------------------------------------------------------------------------------

export async function adminFetchOrders({ status = '', search = '' } = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    let result = data || [];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.shipping_address?.full_name && o.shipping_address.full_name.toLowerCase().includes(q))
      );
    }

    return result;
  } catch (err) {
    console.error('adminFetchOrders error:', err);
    throw err;
  }
}

export async function adminUpdateOrderStatus(orderId, status) {
  try {
    const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('adminUpdateOrderStatus error:', err);
    throw err;
  }
}
