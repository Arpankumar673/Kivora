import { supabase } from '../lib/supabase';

// Mock dataset used as fallback when remote Supabase PostgreSQL table is unpopulated or pending execution
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
  { id: 'cat-2', name: 'Fashion & Apparel', slug: 'fashion-apparel' },
  { id: 'cat-3', name: 'Home & Living', slug: 'home-living' },
  { id: 'cat-4', name: 'Books & Stationeries', slug: 'books-stationeries' },
  { id: 'cat-5', name: 'Accessories', slug: 'accessories' },
];

const MOCK_PRODUCTS = [
  {
    id: 'prod-101',
    category_id: 'cat-1',
    name: 'Wireless Noise-Canceling Headphones',
    description: 'Immersive sound quality with active noise cancellation, 30-hour battery life, and ultra-comfortable earcups.',
    price: 199.99,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-01').toISOString(),
    categories: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
  },
  {
    id: 'prod-102',
    category_id: 'cat-1',
    name: 'Ultra-HD Smart Fitness Watch',
    description: 'Track your heart rate, sleep metrics, workout routines, and GPS route tracking with waterproof protection.',
    price: 149.50,
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-05').toISOString(),
    categories: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
  },
  {
    id: 'prod-103',
    category_id: 'cat-2',
    name: 'Classic Organic Cotton Denim Jacket',
    description: 'Premium organic denim jacket crafted with modern tailoring, durable stitching, and versatile everyday style.',
    price: 89.00,
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-10').toISOString(),
    categories: { id: 'cat-2', name: 'Fashion & Apparel', slug: 'fashion-apparel' },
  },
  {
    id: 'prod-104',
    category_id: 'cat-3',
    name: 'Minimalist Ceramic Espresso Cup Set',
    description: 'Handcrafted ceramic espresso cups with matte glaze finish. Set of 4 with matching bamboo saucers.',
    price: 34.99,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-12').toISOString(),
    categories: { id: 'cat-3', name: 'Home & Living', slug: 'home-living' },
  },
  {
    id: 'prod-105',
    category_id: 'cat-5',
    name: 'Ergonomic Leather Travel Backpack',
    description: 'Water-resistant genuine leather backpack with dedicated 15-inch laptop compartment and hidden anti-theft pocket.',
    price: 129.99,
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-15').toISOString(),
    categories: { id: 'cat-5', name: 'Accessories', slug: 'accessories' },
  },
  {
    id: 'prod-106',
    category_id: 'cat-4',
    name: 'Hardcover Productivity & Habit Journal',
    description: 'Structured 90-day goal setting, habit tracker, and daily reflection journal printed on eco-friendly paper.',
    price: 24.50,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date('2026-09-18').toISOString(),
    categories: { id: 'cat-4', name: 'Books & Stationeries', slug: 'books-stationeries' },
  },
];

/**
 * Fetch all categories from Supabase (with fallback)
 */
export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      console.info('Supabase categories notice: Using fallback dataset (remote migration pending).');
      return MOCK_CATEGORIES;
    }

    return data;
  } catch (err) {
    console.warn('Error fetching categories:', err);
    return MOCK_CATEGORIES;
  }
}

/**
 * Fetch active products with filters (category, search, min/max price, sorting)
 */
export async function fetchProducts({
  categoryId = '',
  searchQuery = '',
  minPrice = '',
  maxPrice = '',
  sortBy = 'newest',
} = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`);
    }

    if (minPrice !== '' && !isNaN(minPrice)) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice !== '' && !isNaN(maxPrice)) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (sortBy === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Filter mock dataset when remote DB is empty or unpopulated
      let result = MOCK_PRODUCTS.filter((p) => p.is_active);

      if (categoryId) {
        result = result.filter((p) => p.category_id === categoryId);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
        );
      }

      if (minPrice !== '' && !isNaN(minPrice)) {
        result = result.filter((p) => p.price >= parseFloat(minPrice));
      }

      if (maxPrice !== '' && !isNaN(maxPrice)) {
        result = result.filter((p) => p.price <= parseFloat(maxPrice));
      }

      if (sortBy === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
      } else {
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      return result;
    }

    return data;
  } catch (err) {
    console.warn('Error fetching products:', err);
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch single active product details by ID
 */
export async function fetchProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .single();

    if (error || !data) {
      const foundMock = MOCK_PRODUCTS.find((p) => p.id === id);
      if (foundMock) return foundMock;
      throw new Error('Product not found');
    }

    return data;
  } catch (err) {
    const foundMock = MOCK_PRODUCTS.find((p) => p.id === id);
    if (foundMock) return foundMock;
    throw err;
  }
}
