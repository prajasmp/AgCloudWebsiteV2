import { verifyWebhookSignature } from './lib/famGatewayService.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getTrustedPlan } from './lib/planConfig.js';
import { getOrCreateUser, createMinecraftServer } from './lib/pterodactylService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const isValidSignature = verifyWebhookSignature(event.headers, event.body || '');
  if (!isValidSignature) {
    console.error('[Webhook] Invalid FamGateway signature header.');
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid webhook signature' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const orderId = payload.order_id || payload.orderId || payload.reference_id;
    const paymentStatus = (payload.status || payload.payment_status || '').toLowerCase();
    const gatewayTxnId = payload.payment_id || payload.txn_id || payload.transaction_id;
    const paidAmount = Number(payload.amount);

    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing order_id in webhook payload' }) };
    }

    if (!isSupabaseAdminConfigured()) {
      console.warn('[Webhook] Supabase not configured. Mocking webhook processing.');
      return { statusCode: 200, body: JSON.stringify({ success: true, isMock: true }) };
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      console.error(`[Webhook] Order ${orderId} not found in database.`);
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (['failed', 'rejected', 'expired'].includes(paymentStatus)) {
      await supabaseAdmin.from('orders').update({
        payment_status: paymentStatus,
        provisioning_status: 'failed',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      return { statusCode: 200, body: JSON.stringify({ success: true, status: paymentStatus }) };
    }

    const isPaid = paymentStatus === 'success' || paymentStatus === 'paid' || paymentStatus === 'completed';
    if (!isPaid) {
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Status ignored' }) };
    }

    if (!isNaN(paidAmount) && paidAmount < Number(order.amount)) {
      console.error(`[Webhook Security Alert] Underpayment detected! Order amount: ${order.amount}, Paid: ${paidAmount}`);
      await supabaseAdmin.from('orders').update({
        payment_status: 'underpaid',
        provisioning_status: 'failed',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      return { statusCode: 400, body: JSON.stringify({ error: 'Underpayment rejected' }) };
    }

    const nowIso = new Date().toISOString();
    await supabaseAdmin.from('orders').update({
      payment_status: 'paid',
      gateway_payment_id: gatewayTxnId || order.gateway_payment_id,
      paid_at: order.paid_at || nowIso,
      updated_at: nowIso
    }).eq('id', orderId);

    if (order.panel_server_id || order.provisioning_status === 'active') {
      console.log(`[Webhook Idempotency] Server already provisioned for order ${orderId}. Skipping creation.`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Server already exists', panelServerId: order.panel_server_id })
      };
    }

    const plan = getTrustedPlan(order.plan_id);
    if (!plan || plan.type !== 'minecraft') {
      console.log(`[Webhook] Order ${orderId} is non-Minecraft plan (${order.plan_id}). Queuing manual setup.`);
      await supabaseAdmin.from('orders').update({
        provisioning_status: 'queued',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Non-Minecraft order queued' }) };
    }

    await supabaseAdmin.from('orders').update({ provisioning_status: 'provisioning' }).eq('id', orderId);

    const pteroUserId = await getOrCreateUser({
      uid: order.owner_uid,
      email: order.user_email,
      name: order.user_name
    });

    const serverResult = await createMinecraftServer({
      serverName: `${order.plan_name} (${order.id.slice(0, 6)})`,
      memoryMb: plan.memoryMb,
      diskMb: plan.diskMb,
      cpuPercent: plan.cpuPercent,
      pterodactylUserId: pteroUserId
    });

    const serverRecordId = 'srv_' + Math.random().toString(36).substring(2, 10);
    const { error: serverInsertErr } = await supabaseAdmin.from('servers').insert({
      id: serverRecordId,
      owner_uid: order.owner_uid,
      owner_email: order.user_email,
      order_id: order.id,
      plan_id: order.plan_id,
      panel_server_id: serverResult.panelServerId,
      panel_uuid: serverResult.panelUuid,
      server_name: serverResult.serverName,
      node_id: serverResult.nodeId,
      allocation_id: serverResult.allocationId,
      ip: serverResult.ip,
      port: serverResult.port,
      memory_mb: serverResult.memoryMb,
      disk_mb: serverResult.diskMb,
      cpu_percent: serverResult.cpuPercent,
      status: 'online',
      created_at: nowIso,
      updated_at: nowIso
    });

    if (serverInsertErr) {
      console.error('[Webhook] Failed to insert server record:', serverInsertErr);
    }

    await supabaseAdmin.from('orders').update({
      panel_server_id: serverResult.panelServerId,
      provisioning_status: 'active',
      provisioned_at: nowIso,
      updated_at: nowIso
    }).eq('id', order.id);

    console.log(`[Webhook] Minecraft server ${serverResult.panelServerId} provisioned successfully for order ${order.id}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Order paid & server provisioned successfully',
        panelServerId: serverResult.panelServerId
      })
    };
  } catch (err) {
    console.error('[Webhook Exception]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Webhook processing failed' })
    };
  }
}
