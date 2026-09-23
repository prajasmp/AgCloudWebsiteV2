import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllOrdersFromStore, getAllServersFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
    }

    let orders = getAllOrdersFromStore();
    let servers = getAllServersFromStore();
    let userCount = new Set(orders.map(o => o.owner_uid || o.user_email)).size;

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const [ordersRes, serversRes, usersRes] = await Promise.all([
          supabaseAdmin.from('orders').select('*'),
          supabaseAdmin.from('servers').select('*'),
          supabaseAdmin.from('users').select('id', { count: 'exact' })
        ]);

        if (ordersRes.data) {
          const map = new Map();
          orders.forEach(o => map.set(o.id, o));
          ordersRes.data.forEach(o => map.set(o.id, o));
          orders = Array.from(map.values());
        }

        if (serversRes.data) {
          const map = new Map();
          servers.forEach(s => map.set(s.id || s.panel_server_id, s));
          serversRes.data.forEach(s => map.set(s.id || s.panel_server_id, s));
          servers = Array.from(map.values());
        }

        if (usersRes.count) {
          userCount = Math.max(userCount, usersRes.count);
        }
      } catch (err) {
        console.warn('DB fetch metrics warning:', err.message);
      }
    }

    const metrics = {
      totalUsers: Math.max(userCount, new Set(servers.map(s => s.owner_uid || s.owner_email)).size),
      totalServers: servers.length,
      onlineServers: servers.filter(s => s.status === 'online' || s.status === 'active' || s.status === 'running').length,
      offlineServers: servers.filter(s => s.status === 'offline' || s.status === 'stopped').length,
      suspendedServers: servers.filter(s => s.status === 'suspended').length,
      totalOrders: orders.length,
      paidPayments: orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'admin_bypass').length,
      pendingPayments: orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'processing').length,
      failedPayments: orders.filter(o => o.payment_status === 'failed' || o.payment_status === 'rejected' || o.payment_status === 'expired').length
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    };
  } catch (err) {
    console.error('admin-metrics error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
