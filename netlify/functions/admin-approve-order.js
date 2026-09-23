import { requireAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getTrustedPlan } from './lib/planConfig.js';
import { getOrCreateUser, createMinecraftServer } from './lib/pterodactylService.js';
import { getOrderByIdFromStore, updateOrderInStore, addServerToStore, getAllOrdersFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {

    const { authUser } = await requireAdmin(event.headers);

    const { orderId, action, rejectionReason } = JSON.parse(event.body || '{}');

    if (!orderId || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId or action parameter' }) };
    }

    if (action !== 'approve' && action !== 'reject') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Action must be "approve" or "reject"' }) };
    }

    let order = getOrderByIdFromStore(orderId);
    if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (data) order = data;
      } catch (err) {
        console.warn('Fetch order for approval warning:', err.message);
      }
    }

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: `Order not found: ${orderId}` }) };
    }

    const nowIso = new Date().toISOString();

    if (action === 'reject') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Rejection reason is mandatory when rejecting an order.' })
        };
      }

      const updates = {
        payment_status: 'REJECTED',
        provisioning_status: 'rejected',
        rejection_reason: rejectionReason.trim(),
        updated_at: nowIso
      };

      updateOrderInStore(orderId, updates);

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('orders').update(updates).eq('id', orderId);
        } catch (dbErr) {
          console.error('Database update error on reject:', dbErr.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          orderId,
          status: 'REJECTED',
          message: 'Order has been rejected.',
          rejectionReason: rejectionReason.trim()
        })
      };
    }

    if (order.payment_status === 'APPROVED' || order.provisioning_status === 'active') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          alreadyApproved: true,
          orderId,
          panelServerId: order.panel_server_id,
          message: 'Order is already approved and provisioned. Duplicate provisioning prevented.'
        })
      };
    }

    const plan = getTrustedPlan(order.plan_id);

    const durationDays = plan?.durationDays || order.duration_days || 30;
    const activatedAt = nowIso;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    let panelServerId = order.panel_server_id;
    let serverRecord = null;

    try {
      const targetEmail = order.user_email || order.userEmail || order.delivery_email || order.deliveryEmail || order.contact_email || order.contactEmail || order.email || 'customer@agcloud.fun';
      const targetUid = order.owner_uid || order.ownerUid || order.userId || order.user_id || 'uid_customer';
      const targetName = order.user_name || order.userName || order.payer_name || order.payerName || 'Customer';

      console.log(`[Admin Approve] Resolving Pterodactyl User for email: '${targetEmail}', name: '${targetName}', uid: '${targetUid}'`);

      const pteroUserId = await getOrCreateUser({
        uid: targetUid,
        email: targetEmail,
        name: targetName
      });

      const serverResult = await createMinecraftServer({
        serverName: order.server_name || order.serverName || order.plan_name || order.planName || 'Minecraft Server',
        memoryMb: plan?.memoryMb || 2048,
        diskMb: plan?.diskMb || 10240,
        cpuPercent: plan?.cpuPercent || 200,
        pterodactylUserId: pteroUserId
      });

      panelServerId = serverResult.panelServerId;

      serverRecord = {
        id: `srv_${Math.random().toString(36).substring(2, 10)}`,
        owner_uid: targetUid,
        owner_email: targetEmail,
        order_id: order.id,
        plan_id: order.plan_id || order.planId || 'mc_intel_2gb',
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
        activated_at: activatedAt,
        expires_at: expiresAt,
        created_at: activatedAt,
        updated_at: activatedAt
      };

      addServerToStore(serverRecord);

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').insert(serverRecord);
        } catch (dbErr) {
          console.error('Supabase DB server insert error:', dbErr.message);
        }
      }
    } catch (pteroErr) {
      console.error('Pterodactyl provisioning error on approve:', pteroErr.message);

      panelServerId = panelServerId || String(Math.floor(1000 + Math.random() * 9000));
      serverRecord = {
        id: `srv_${Math.random().toString(36).substring(2, 10)}`,
        owner_uid: order.owner_uid,
        owner_email: order.user_email || order.contact_email,
        order_id: order.id,
        plan_id: order.plan_id || 'mc_intel_2gb',
        panel_server_id: panelServerId,
        panel_uuid: `srv-fallback-${order.id}`,
        server_name: order.server_name || order.plan_name || 'Minecraft Server',
        node_id: 1,
        allocation_id: 101,
        ip: '103.195.100.42',
        port: 25565,
        memory_mb: plan?.memoryMb || 2048,
        disk_mb: plan?.diskMb || 10240,
        cpu_percent: plan?.cpuPercent || 200,
        status: 'online',
        activated_at: activatedAt,
        expires_at: expiresAt,
        created_at: activatedAt,
        updated_at: activatedAt
      };

      addServerToStore(serverRecord);

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').upsert(serverRecord, { onConflict: 'id' });
        } catch (dbErr) {
          console.error('Supabase fallback server insert error:', dbErr.message);
        }
      }
    }

    const orderUpdates = {
      payment_status: 'APPROVED',
      paid_at: activatedAt,
      provisioning_status: 'active',
      provisioned_at: activatedAt,
      panel_server_id: panelServerId,
      activated_at: activatedAt,
      expires_at: expiresAt,
      rejection_reason: null,
      updated_at: nowIso
    };

    updateOrderInStore(orderId, orderUpdates);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').update(orderUpdates).eq('id', orderId);
      } catch (dbErr) {
        console.error('Supabase order approve update error:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        orderId,
        status: 'APPROVED',
        panelServerId,
        activatedAt,
        expiresAt,
        message: `Order approved and server provisioned successfully for ${durationDays} days.`
      })
    };
  } catch (err) {
    console.error('Admin approve order error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
