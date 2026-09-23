import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllOrdersFromStore } from './lib/devStore.js';

export async function handler(event, context) {

  let email = '';
  let orderId = '';

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    email = params.email || '';
    orderId = params.orderId || params.id || '';
  } else if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      email = body.email || '';
      orderId = body.orderId || body.id || '';
    } catch (e) {}
  } else {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!email || !email.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Customer Email is required to track order status.' })
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOrderId = (orderId || '').trim().toLowerCase();

  try {
    const matchedOrders = [];
    const seenIds = new Set();

    const storeOrders = getAllOrdersFromStore();
    storeOrders.forEach(o => {
      const emailMatch = (o.user_email?.toLowerCase() === cleanEmail) ||
                         (o.contact_email?.toLowerCase() === cleanEmail) ||
                         (o.owner_email?.toLowerCase() === cleanEmail);
      if (emailMatch) {
        if (!cleanOrderId || o.id?.toLowerCase() === cleanOrderId) {
          if (!seenIds.has(o.id)) {
            seenIds.add(o.id);
            matchedOrders.push(o);
          }
        }
      }
    });

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('orders').select('*').or(`user_email.ilike.${cleanEmail},contact_email.ilike.${cleanEmail}`);
        if (cleanOrderId) {
          query = query.eq('id', orderId.trim());
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach(o => {
            if (!seenIds.has(o.id)) {
              seenIds.add(o.id);
              matchedOrders.push(o);
            }
          });
        }
      } catch (dbErr) {
        console.warn('Track order DB fetch warning:', dbErr.message);
      }
    }

    if (matchedOrders.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: cleanOrderId
            ? `No order found for Email '${cleanEmail}' with Order ID '${orderId}'.`
            : `No orders found for Email '${cleanEmail}'. Please check your email address.`
        })
      };
    }

    const formattedOrders = matchedOrders.map(o => ({
      id: o.id,
      userName: o.user_name || o.userName,
      userEmail: o.user_email || o.contact_email,
      contactEmail: o.contact_email || o.user_email,
      mobile: o.mobile,
      planId: o.plan_id,
      planName: o.plan_name || o.planName,
      amount: o.amount,
      duration: o.duration || '1 Month',
      durationDays: o.duration_days || 30,
      paymentStatus: o.payment_status || 'PENDING',
      provisioningStatus: o.provisioning_status || 'waiting_approval',
      rejectionReason: o.rejection_reason || null,
      panelServerId: o.panel_server_id || null,
      paymentProof: o.payment_proof || null,
      createdAt: o.created_at,
      activatedAt: o.activated_at || null,
      expiresAt: o.expires_at || null
    })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        order: formattedOrders[0],
        orders: formattedOrders
      })
    };
  } catch (err) {
    console.error('Track order error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error while tracking order.' })
    };
  }
}
