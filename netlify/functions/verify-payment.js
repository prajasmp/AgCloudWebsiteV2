import { getOrderByIdFromStore, updateOrderInStore } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { verifyPaymentSignature } from './lib/razorpayClient.js';
import { executeServerDeployment } from './lib/provisioningService.js';
import { generateInvoiceForOrder } from './lib/invoiceService.js';
import { sendPaymentConfirmationEmail } from './lib/emailService.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required Razorpay payment verification fields.' })
      };
    }

    // 1. Verify cryptographic signature
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || ''
    });

    if (!isValidSignature) {
      console.error('[Payment Verification Failed] Invalid Razorpay signature for order:', orderId);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment signature verification failed. Untrusted payment attempt.' })
      };
    }

    // 2. Lookup Order
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
        body: JSON.stringify({ error: `Order ${orderId} not found.` })
      };
    }

    // 3. Idempotency Check (Prevent duplicate deployment or double processing)
    if (order.payment_status === 'PAID' && (order.provisioning_status === 'active' || order.panel_server_id)) {
      console.log(`[Payment Verify] Order ${orderId} already paid and server provisioned.`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          orderId: order.id,
          trackingToken: order.tracking_token,
          paymentStatus: 'PAID',
          provisioningStatus: order.provisioning_status,
          panelServerId: order.panel_server_id,
          message: 'Payment verified. Server is already provisioned.'
        })
      };
    }

    const nowIso = new Date().toISOString();

    // 4. Mark order as PAID
    const orderUpdates = {
      payment_status: 'PAID',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      paid_at: nowIso,
      updated_at: nowIso
    };

    updateOrderInStore(orderId, orderUpdates);
    Object.assign(order, orderUpdates);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').update(orderUpdates).eq('id', orderId);
      } catch (dbErr) {
        console.warn('[DB Payment Update Warning]:', dbErr.message);
      }
    }

    // 5. Generate Invoice & Send Payment Confirmation Email
    const invoice = generateInvoiceForOrder(order);
    sendPaymentConfirmationEmail(order).catch(err => {
      console.warn('[Email Warning]:', err.message);
    });

    // 6. Trigger Automatic Server Deployment!
    console.log(`[Automatic Deployment Triggered] Payment verified for order ${orderId}!`);
    const deployResult = await executeServerDeployment(order.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        orderId: order.id,
        trackingToken: order.tracking_token,
        paymentStatus: 'PAID',
        provisioningStatus: deployResult.success ? 'active' : 'failed',
        panelServerId: deployResult.panelServerId || null,
        serverName: deployResult.serverName || order.server_name,
        invoiceNumber: invoice?.invoice_number || null,
        deployment: deployResult
      })
    };
  } catch (err) {
    console.error('[Verify Payment Exception]:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message || 'Payment verification failed' })
    };
  }
}
