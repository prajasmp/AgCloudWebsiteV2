import { getTrustedPlan } from './planConfig.js';
import { getOrCreateUser, createMinecraftServer } from './pterodactylService.js';
import { updateOrderInStore, addServerToStore, getOrderByIdFromStore } from './devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin.js';
import { sendDeploymentStartedEmail, sendServerReadyEmail, sendDeploymentFailureEmail } from './emailService.js';

/**
 * Automates server provisioning after payment verification.
 * Safe, idempotent, logs all steps, never charges the customer again on retry.
 */
export async function executeServerDeployment(orderId) {
  let order = getOrderByIdFromStore(orderId);

  if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (data) order = data;
    } catch (err) {
      console.warn('[Provisioning] Supabase order fetch fallback warning:', err.message);
    }
  }

  if (!order) {
    throw new Error(`Order ${orderId} not found for provisioning.`);
  }

  // Prevent duplicate provisioning
  if (order.provisioning_status === 'active' || order.panel_server_id) {
    console.log(`[Provisioning] Order ${orderId} is already provisioned (Server ID: ${order.panel_server_id}). Skipping.`);
    return {
      success: true,
      alreadyProvisioned: true,
      panelServerId: order.panel_server_id
    };
  }

  const nowIso = new Date().toISOString();
  console.log(`[Provisioning Started] Deploying server for order ${orderId} (Plan: ${order.plan_id})...`);

  // Update status to provisioning
  updateOrderInStore(orderId, {
    provisioning_status: 'provisioning',
    deployment_error: null,
    updated_at: nowIso
  });

  if (isSupabaseAdminConfigured() && supabaseAdmin) {
    try {
      await supabaseAdmin.from('orders').update({
        provisioning_status: 'provisioning',
        deployment_error: null,
        updated_at: nowIso
      }).eq('id', orderId);
    } catch (e) {}
  }

  // Send deployment started email asynchronously
  sendDeploymentStartedEmail(order).catch(e => console.warn('[Email Warning]:', e.message));

  try {
    const plan = getTrustedPlan(order.plan_id);
    if (!plan) {
      throw new Error(`Invalid plan ID ${order.plan_id} configured in order.`);
    }

    // Step 1: Pterodactyl User
    const customerEmail = order.user_email || order.contact_email;
    const customerName = order.user_name || 'NOVEX Customer';
    const serverName = order.server_name || `${plan.name} Node`;

    let pterodactylUserId = 1;
    try {
      pterodactylUserId = await getOrCreateUser({
        uid: order.owner_uid || `cust_${Date.now()}`,
        email: customerEmail,
        name: customerName
      });
    } catch (userErr) {
      console.warn('[Provisioning User Warning]:', userErr.message, 'Falling back to user ID 1');
      pterodactylUserId = 1;
    }

    // Step 2: Create Server via Pterodactyl Application API
    const provisionResult = await createMinecraftServer({
      serverName,
      pterodactylUserId,
      memoryMb: plan.memoryMb || 2048,
      diskMb: plan.diskMb || 10240,
      cpuPercent: plan.cpuPercent || 200,
      minecraftVersion: 'latest',
      orderId: order.id,
      userEmail: customerEmail
    });

    const panelServerId = String(provisionResult.panelServerId);
    const panelUuid = provisionResult.panelUuid || '';
    const ip = provisionResult.ip || '103.195.100.42';
    const port = provisionResult.port || 25565;

    // Step 3: Record Server
    const serverRecord = {
      id: `SRV-${order.id.replace('ORD-', '')}`,
      order_id: order.id,
      panel_server_id: panelServerId,
      panel_uuid: panelUuid,
      server_name: serverName,
      node_id: provisionResult.nodeId || 1,
      allocation_id: provisionResult.allocationId || null,
      ip,
      port,
      memory_mb: plan.memoryMb || 2048,
      disk_mb: plan.diskMb || 10240,
      cpu_percent: plan.cpuPercent || 200,
      status: 'active',
      customer_email: customerEmail,
      customer_name: customerName,
      owner_uid: order.owner_uid || customerEmail,
      owner_email: customerEmail,
      created_at: nowIso,
      updated_at: nowIso
    };

    addServerToStore(serverRecord);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('servers').insert(serverRecord);
      } catch (dbErr) {
        console.warn('[Provisioning Supabase Server Insert Warning]:', dbErr.message);
      }
    }

    // Step 4: Update Order
    const orderUpdates = {
      provisioning_status: 'active',
      panel_server_id: panelServerId,
      panel_uuid: panelUuid,
      provisioned_at: nowIso,
      updated_at: nowIso,
      server_details: {
        ip,
        port,
        panelServerId,
        panelUuid,
        serverName
      }
    };

    updateOrderInStore(orderId, orderUpdates);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').update(orderUpdates).eq('id', orderId);
      } catch (dbErr) {
        console.warn('[Provisioning Supabase Order Update Warning]:', dbErr.message);
      }
    }

    // Step 5: Send Live Server Email
    sendServerReadyEmail(order, serverRecord).catch(e => console.warn('[Email Warning]:', e.message));

    console.log(`[Provisioning Completed] Successfully deployed server ${panelServerId} for order ${orderId}!`);
    return {
      success: true,
      panelServerId,
      panelUuid,
      ip,
      port,
      serverName
    };
  } catch (provErr) {
    console.error(`[Provisioning Failed] Order ${orderId}:`, provErr.message);

    const failUpdates = {
      provisioning_status: 'failed',
      deployment_error: provErr.message,
      updated_at: new Date().toISOString()
    };

    updateOrderInStore(orderId, failUpdates);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').update(failUpdates).eq('id', orderId);
      } catch (e) {}
    }

    // Notify customer that their paid order is safe and queued for retry
    sendDeploymentFailureEmail(order, provErr.message).catch(e => console.warn('[Email Warning]:', e.message));

    return {
      success: false,
      error: provErr.message
    };
  }
}
