import { getAllOrdersFromStore, getOrderByTokenFromStore, getServerByIdFromStore } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  let email = '';
  let orderId = '';
  let token = '';

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    email = params.email || '';
    orderId = params.orderId || params.id || '';
    token = params.token || '';
  } else if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      email = body.email || '';
      orderId = body.orderId || body.id || '';
      token = body.token || '';
    } catch (e) {}
  } else {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // 1. Direct lookup by Unguessable Tracking Token
  if (token && token.trim()) {
    const cleanToken = token.trim();
    let order = getOrderByTokenFromStore(cleanToken);

    if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('orders').select('*').eq('tracking_token', cleanToken).maybeSingle();
        if (data) order = data;
      } catch (e) {}
    }

    if (order) {
      const server = order.panel_server_id ? getServerByIdFromStore(order.panel_server_id) : null;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          orders: [formatOrderForTracking(order, server)]
        })
      };
    }
  }

  // 2. Lookup by Order ID + Email or Email alone
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOrderId = (orderId || '').trim().toLowerCase();

  if (!cleanEmail && !cleanOrderId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Please enter your Order Reference or Email address.' })
    };
  }

  try {
    const matchedOrders = [];
    const seenIds = new Set();

    const storeOrders = getAllOrdersFromStore();
    storeOrders.forEach(o => {
      const emailMatches = cleanEmail ? (
        (o.user_email?.toLowerCase() === cleanEmail) ||
        (o.contact_email?.toLowerCase() === cleanEmail) ||
        (o.owner_uid?.toLowerCase() === cleanEmail)
      ) : true;

      const orderMatches = cleanOrderId ? (
        o.id?.toLowerCase() === cleanOrderId ||
        o.razorpay_order_id?.toLowerCase() === cleanOrderId
      ) : true;

      if (cleanEmail && cleanOrderId) {
        if (emailMatches && orderMatches && !seenIds.has(o.id)) {
          seenIds.add(o.id);
          matchedOrders.push(o);
        }
      } else if (cleanOrderId) {
        if (orderMatches && !seenIds.has(o.id)) {
          seenIds.add(o.id);
          matchedOrders.push(o);
        }
      } else if (cleanEmail) {
        if (emailMatches && !seenIds.has(o.id)) {
          seenIds.add(o.id);
          matchedOrders.push(o);
        }
      }
    });

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('orders').select('*');
        if (cleanOrderId) query = query.eq('id', orderId.trim());
        if (cleanEmail) query = query.or(`user_email.ilike.${cleanEmail},contact_email.ilike.${cleanEmail}`);
        const { data } = await query;
        if (data) {
          data.forEach(o => {
            if (!seenIds.has(o.id)) {
              seenIds.add(o.id);
              matchedOrders.push(o);
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Track Order DB Warning]:', dbErr.message);
      }
    }

    if (matchedOrders.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: cleanOrderId
            ? `No order found with Reference '${orderId}'. Please verify your order number.`
            : `No orders found for '${email}'. Please verify your email.`
        })
      };
    }

    const formattedOrders = matchedOrders.map(o => {
      const server = o.panel_server_id ? getServerByIdFromStore(o.panel_server_id) : null;
      return formatOrderForTracking(o, server);
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ orders: formattedOrders })
    };
  } catch (err) {
    console.error('[Track Order Error]:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to search order records.' })
    };
  }
}

function formatOrderForTracking(order, server) {
  return {
    id: order.id,
    trackingToken: order.tracking_token,
    userName: order.user_name || 'Customer',
    userEmail: order.user_email || order.contact_email,
    mobile: order.mobile ? `${order.mobile.slice(0, 3)}****${order.mobile.slice(-3)}` : '',
    planId: order.plan_id,
    planName: order.plan_name,
    amount: order.amount,
    currency: order.currency || 'INR',
    paymentStatus: order.payment_status || 'PENDING',
    provisioningStatus: order.provisioning_status || 'waiting_payment',
    serverName: order.server_name || order.plan_name,
    serverRegion: order.server_region || 'Mumbai, India',
    panelServerId: order.panel_server_id || null,
    deploymentError: order.deployment_error || null,
    createdAt: order.created_at,
    paidAt: order.paid_at || null,
    provisionedAt: order.provisioned_at || null,
    serverDetails: (order.provisioning_status === 'active' || server) ? {
      ip: server?.ip || order.server_details?.ip || '103.195.100.42',
      port: server?.port || order.server_details?.port || 25565,
      nodeId: server?.node_id || 1,
      status: server?.status || 'active',
      memoryMb: server?.memory_mb || 2048,
      panelUrl: process.env.PTERODACTYL_PANEL_URL || 'https://panel.novexhost.com'
    } : null,
    supportInstructions: 'If you have questions about your server, connect with our 24/7 technical team on Discord or email support@novexhost.com with your Order Reference.'
  };
}
