import { verifyFirebaseToken } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getOrdersFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    let dbOrders = [];
    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('owner_uid', authUser.uid)
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbOrders = data;
        }
      } catch (err) {
        console.warn('Supabase fetch orders warning:', err.message);
      }
    }

    const storeOrders = getOrdersFromStore(authUser.uid);
    const combinedMap = new Map();

    storeOrders.forEach(o => combinedMap.set(o.id, o));
    dbOrders.forEach(o => combinedMap.set(o.id, o));

    const finalOrders = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: finalOrders })
    };
  } catch (err) {
    console.error('my-orders error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
