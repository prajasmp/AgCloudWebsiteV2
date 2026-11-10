import { getOrderByIdFromStore, updateOrderInStore, isWebhookEventProcessed, recordWebhookEvent } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { verifyWebhookSignature } from './lib/razorpayClient.js';
import { executeServerDeployment } from './lib/provisioningService.js';
import { generateInvoiceForOrder } from './lib/invoiceService.js';
import { sendPaymentConfirmationEmail, sendRefundUpdateEmail } from './lib/emailService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const rawBody = event.body || '';
  const webhookSignature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'] || '';

  // 1. Verify Webhook Signature
  const isValid = verifyWebhookSignature({ rawBody, signature: webhookSignature });
  if (!isValid) {
    console.error('[Razorpay Webhook] Invalid signature rejected.');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid webhook signature.' })
    };
  }

  try {
    const payload = JSON.parse(rawBody || '{}');
    const eventId = payload.event_id || `${payload.event}_${payload.created_at || Date.now()}`;
    const eventType = payload.event;

    console.log(`[Razorpay Webhook Received] Event: ${eventType} | ID: ${eventId}`);

    // 2. Idempotency Check
    if (isWebhookEventProcessed(eventId)) {
      console.log(`[Razorpay Webhook] Event ${eventId} already processed. Acknowledging with 200 OK.`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ok', message: 'Event already processed' })
      };
    }

    recordWebhookEvent({ id: eventId, event: eventType });

    // Handle Payment / Order Captured
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const orderEntity = payload.payload?.order?.entity || {};
      const rzpOrderId = paymentEntity.order_id || orderEntity.id;
      const paymentId = paymentEntity.id;

      if (rzpOrderId) {
        let order = getOrderByIdFromStore(rzpOrderId);
        if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
          try {
            const { data } = await supabaseAdmin.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
            if (data) order = data;
          } catch (e) {}
        }

        if (order) {
          if (order.payment_status !== 'PAID') {
            const nowIso = new Date().toISOString();
            const updates = {
              payment_status: 'PAID',
              razorpay_payment_id: paymentId || order.razorpay_payment_id,
              paid_at: nowIso,
              updated_at: nowIso
            };

            updateOrderInStore(order.id, updates);
            Object.assign(order, updates);

            if (isSupabaseAdminConfigured() && supabaseAdmin) {
              try {
                await supabaseAdmin.from('orders').update(updates).eq('id', order.id);
              } catch (e) {}
            }

            generateInvoiceForOrder(order);
            sendPaymentConfirmationEmail(order).catch(() => {});
          }

          // Trigger automatic deployment if not already active
          if (order.provisioning_status !== 'active' && !order.panel_server_id) {
            console.log(`[Webhook Trigger] Starting auto-deployment for order ${order.id}...`);
            await executeServerDeployment(order.id);
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const rzpOrderId = paymentEntity.order_id;
      if (rzpOrderId) {
        const order = getOrderByIdFromStore(rzpOrderId);
        if (order && order.payment_status !== 'PAID') {
          updateOrderInStore(order.id, {
            payment_status: 'FAILED',
            updated_at: new Date().toISOString()
          });
        }
      }
    } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
      const refundEntity = payload.payload?.refund?.entity || {};
      const paymentId = refundEntity.payment_id;
      if (paymentId) {
        const storeOrders = getOrderByIdFromStore(paymentId);
        if (storeOrders) {
          updateOrderInStore(storeOrders.id, {
            payment_status: 'REFUNDED',
            updated_at: new Date().toISOString()
          });
          sendRefundUpdateEmail(storeOrders, {
            amount: refundEntity.amount ? refundEntity.amount / 100 : storeOrders.amount,
            refundId: refundEntity.id
          }).catch(() => {});
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', received: true })
    };
  } catch (err) {
    console.error('[Razorpay Webhook Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
