import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllOrdersFromStore, getAllServersFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden: Admin access required' })
      };
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
        console.warn('[Admin Metrics DB Warning]:', err.message);
      }
    }

    const paidOrders = orders.filter(o => 
      String(o.payment_status).toUpperCase() === 'PAID' || 
      String(o.payment_status).toUpperCase() === 'APPROVED'
    );
    const pendingOrders = orders.filter(o => 
      String(o.payment_status).toUpperCase() === 'PENDING'
    );
    const failedOrders = orders.filter(o => 
      String(o.payment_status).toUpperCase() === 'FAILED' || 
      String(o.payment_status).toUpperCase() === 'REJECTED'
    );
    const failedDeployments = orders.filter(o => 
      String(o.provisioning_status).toLowerCase() === 'failed'
    );

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const metrics = {
      totalRevenue,
      totalOrders: orders.length,
      successfulPayments: paidOrders.length,
      pendingPayments: pendingOrders.length,
      failedPayments: failedOrders.length,
      activeServers: servers.filter(s => s.status === 'online' || s.status === 'active' || s.status === 'running').length,
      totalServers: servers.length,
      failedDeployments: failedDeployments.length,
      totalUsers: Math.max(userCount, new Set(servers.map(s => s.customer_email || s.owner_uid)).size),
      recentTransactions: orders.slice(0, 10).map(o => ({
        id: o.id,
        userName: o.user_name,
        userEmail: o.user_email,
        planName: o.plan_name,
        amount: o.amount,
        paymentStatus: o.payment_status,
        provisioningStatus: o.provisioning_status,
        razorpayPaymentId: o.razorpay_payment_id || null,
        createdAt: o.created_at
      }))
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
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
