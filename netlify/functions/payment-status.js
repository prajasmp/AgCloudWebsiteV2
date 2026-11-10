import { getOrderByIdFromStore } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const orderId = event.queryStringParameters?.orderId || event.queryStringParameters?.id;
    const token = event.queryStringParameters?.token;

    if (!orderId && !token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing orderId or token parameter' })
      };
    }

    let order = getOrderByIdFromStore(orderId || token);

    if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('orders').select('*');
        if (orderId) query = query.eq('id', orderId);
        else if (token) query = query.eq('tracking_token', token);
        const { data } = await query.maybeSingle();
        if (data) order = data;
      } catch (e) {}
    }

    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        orderId: order.id,
        trackingToken: order.tracking_token,
        planId: order.plan_id,
        planName: order.plan_name,
        amount: order.amount,
        paymentStatus: order.payment_status || 'PENDING',
        provisioningStatus: order.provisioning_status || 'waiting_payment',
        panelServerId: order.panel_server_id || null,
        serverName: order.server_name,
        deploymentError: order.deployment_error || null,
        paidAt: order.paid_at,
        provisionedAt: order.provisioned_at
      })
    };
  } catch (err) {
    console.error('[Payment Status Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
