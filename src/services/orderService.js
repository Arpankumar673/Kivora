import { supabase } from '../lib/supabase';

/**
 * Creates a new order from the user's current shopping cart.
 * Re-validates current product availability, prices, and stock from Supabase.
 */
export async function createOrder(shippingAddress) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to place an order.');

    // Attempt 1: Call atomic PostgreSQL RPC function if available on remote database
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_from_cart', {
      p_shipping_address: shippingAddress,
    });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    // Fallback: If RPC does not exist on remote database yet, execute transactional client queries
    console.warn('RPC create_order_from_cart notice (falling back to client transaction):', rpcError?.message);

    // 1. Fetch current cart items from Supabase
    const { data: cartItems, error: cartErr } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id);

    if (cartErr) throw cartErr;

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Your shopping cart is empty.');
    }

    // 2. Authoritative Price & Inventory Validation
    let calculatedTotal = 0;
    const itemsToInsert = [];

    for (const item of cartItems) {
      const product = item.products;
      if (!product || !product.is_active) {
        throw new Error(`Product "${product?.name || 'Item'}" is no longer available.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Ordered: ${item.quantity}.`);
      }

      const itemPrice = parseFloat(product.price);
      const subtotal = itemPrice * item.quantity;
      calculatedTotal += subtotal;

      itemsToInsert.push({
        product_id: product.id,
        product_name: product.name, // Snapshot
        price: itemPrice,           // Snapshot
        quantity: item.quantity,
        subtotal: subtotal,
      });
    }

    // 3. Create Order Header
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          total_amount: calculatedTotal,
          status: 'PENDING',
          shipping_address: shippingAddress,
        },
      ])
      .select('*')
      .single();

    if (orderErr) throw orderErr;

    const orderId = orderData.id;

    // 4. Create Order Items Snapshots
    const formattedOrderItems = itemsToInsert.map((item) => ({
      ...item,
      order_id: orderId,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(formattedOrderItems);

    if (itemsErr) {
      console.error('Error creating order items:', itemsErr);
      throw new Error('Failed to record order item details.');
    }

    // 5. Update Inventory (stock reduction)
    for (const item of cartItems) {
      const newStock = Math.max(0, (item.products?.stock ?? 0) - item.quantity);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
    }

    // 6. Clear User Cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    return orderData;
  } catch (err) {
    console.error('createOrder service error:', err);
    throw err;
  }
}

/**
 * Fetch all orders placed by the current authenticated user.
 */
export async function fetchOrders() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchOrders error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Error in fetchOrders:', err);
    return [];
  }
}

/**
 * Fetch single order details by order ID.
 */
export async function fetchOrderById(orderId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      throw new Error('Order not found or access denied.');
    }

    return data;
  } catch (err) {
    console.error('fetchOrderById error:', err);
    throw err;
  }
}
