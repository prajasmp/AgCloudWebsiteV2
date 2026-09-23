import { verifyFirebaseToken } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);
    const orderId = event.queryStringParameters?.orderId;

    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId parameter' }) };
    }

    if (!isSupabaseAdminConfigured()) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'pending',
          provisioningStatus: 'waiting_payment'
        })
      };
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (order.owner_uid !== authUser.uid) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Access denied to order' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        planId: order.plan_id,
        planName: order.plan_name,
        amount: order.amount,
        paymentStatus: order.payment_status,
        provisioningStatus: order.provisioning_status,
        panelServerId: order.panel_server_id,
        createdAt: order.created_at,
        paidAt: order.paid_at
      })
    };
  } catch (err) {
    console.error('Payment status error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
