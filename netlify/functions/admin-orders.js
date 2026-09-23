import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllOrdersFromStore, clearAllOrdersFromStore, deleteOrderFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
    }

    if (event.httpMethod === 'DELETE') {
      let orderId = event.queryStringParameters?.orderId;
      if (!orderId && event.body) {
        try {
          const bodyData = JSON.parse(event.body);
          orderId = bodyData.orderId;
        } catch (e) {}
      }

      if (orderId) {
        deleteOrderFromStore(orderId);
        if (isSupabaseAdminConfigured() && supabaseAdmin) {
          try {
            await supabaseAdmin.from('orders').delete().eq('id', orderId);
          } catch (dbErr) {
            console.warn('DB delete single order warning:', dbErr.message);
          }
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, orderId, message: `Order ${orderId} deleted successfully.` })
        };
      } else {
        clearAllOrdersFromStore();
        if (isSupabaseAdminConfigured() && supabaseAdmin) {
          try {
            await supabaseAdmin.from('orders').delete().neq('id', 'keep_schema_placeholder');
          } catch (dbErr) {
            console.warn('DB clear orders warning:', dbErr.message);
          }
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, message: 'All submitted payment orders cleared successfully.' })
        };
      }
    }

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let dbOrders = [];
    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbOrders = data;
        }
      } catch (err) {
        console.warn('Admin fetch orders warning:', err.message);
      }
    }

    const storeOrders = getAllOrdersFromStore();
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
    console.error('admin-orders error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
