import { requireAdmin } from './lib/firebaseAdmin.js';
import { getOrderByIdFromStore, updateOrderInStore } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { executeServerDeployment } from './lib/provisioningService.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser } = await requireAdmin(event.headers);

    const body = JSON.parse(event.body || '{}');
    const { orderId } = body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing orderId parameter' })
      };
    }

    let order = getOrderByIdFromStore(orderId);
    if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (data) order = data;
      } catch (e) {}
    }

    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Order ${orderId} not found` })
      };
    }

    console.log(`[Admin Manual Retry] Admin ${authUser.email} triggered server deployment retry for order ${orderId}`);

    const result = await executeServerDeployment(orderId);

    if (result.success) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: `Server successfully deployed (Panel ID: ${result.panelServerId}). Customer has been notified.`,
          panelServerId: result.panelServerId,
          ip: result.ip,
          port: result.port
        })
      };
    } else {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: `Retry provisioning failed: ${result.error}`
        })
      };
    }
  } catch (err) {
    console.error('[Admin Retry Deployment Error]:', err);
    return {
      statusCode: err.message.includes('Unauthorized') || err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}

