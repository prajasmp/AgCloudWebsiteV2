import { getTrustedPlan } from './planConfig.js';
import { getOrCreateUser, createMinecraftServer } from './pterodactylService.js';
import { createWebHostingAccount } from './whmService.js';
import { allocatePhysicalMachine, startBareMetalProvisioning } from './bareMetalService.js';
import { updateOrderInStore, addServerToStore, getOrderByIdFromStore, addWebHostingAccount, addVdsRecord, getAllPhysicalMachines } from './devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin.js';
import { sendDeploymentStartedEmail, sendServerReadyEmail, sendDeploymentFailureEmail } from './emailService.js';

/**
 * Automates server provisioning after payment verification.
 * Safe, idempotent, logs all steps, supports Game Servers, cPanel Web Hosting, and Bare-Metal VDS.
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
  if (order.provisioning_status === 'active' || order.panel_server_id || order.machine_id) {
    console.log(`[Provisioning] Order ${orderId} is already provisioned. Skipping.`);
    return {
      success: true,
      alreadyProvisioned: true,
      panelServerId: order.panel_server_id || order.machine_id
    };
  }

  const nowIso = new Date().toISOString();
  console.log(`[Provisioning Started] Deploying service for order ${orderId} (Plan: ${order.plan_id})...`);

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

    const customerEmail = order.user_email || order.contact_email;
    const customerName = order.user_name || 'NOVEX Customer';

    // ----------------------------------------------------
    // BRANCH A: cPanel WEB HOSTING PROVISIONING
    // ----------------------------------------------------
    if (plan.type === 'web' || order.plan_id.startsWith('web-')) {
      const domain = order.domain_name || order.server_name || `${customerName.replace(/[^a-z0-9]/gi, '').toLowerCase()}.novexhost.site`;
      console.log(`[Provisioning Web Hosting] Creating cPanel account for domain: ${domain}...`);

      const webAccount = await createWebHostingAccount({
        domain,
        customerEmail,
        planId: plan.id,
        planName: plan.name
      });

      const hostingRecord = {
        id: `WEB-${order.id.replace('ORD-', '')}`,
        order_id: order.id,
        domain: webAccount.domain,
        username: webAccount.username,
        cpanel_url: webAccount.cpanelUrl,
        package: webAccount.package,
        nameservers: webAccount.nameservers,
        customer_email: customerEmail,
        customer_name: customerName,
        status: 'active',
        created_at: nowIso,
        updated_at: nowIso
      };

      addWebHostingAccount(hostingRecord);

      const orderUpdates = {
        provisioning_status: 'active',
        domain_name: webAccount.domain,
        provisioned_at: nowIso,
        updated_at: nowIso,
        server_details: {
          domain: webAccount.domain,
          username: webAccount.username,
          cpanelUrl: webAccount.cpanelUrl,
          nameservers: webAccount.nameservers,
          temporaryPassword: webAccount.credentials.password
        }
      };

      updateOrderInStore(orderId, orderUpdates);
      sendServerReadyEmail(order, orderUpdates.server_details).catch(e => console.warn('[Email Warning]:', e.message));

      console.log(`[Provisioning Completed] Successfully activated Web Hosting account for ${webAccount.domain} (Order ${orderId})!`);
      return {
        success: true,
        type: 'web',
        ...orderUpdates.server_details
      };
    }

    // ----------------------------------------------------
    // BRANCH B: BARE-METAL VDS MACHINE PROVISIONING
    // ----------------------------------------------------
    if (plan.type === 'bare-metal' || order.plan_id.startsWith('vds-')) {
      console.log(`[Provisioning Bare-Metal] Allocating physical machine for ${plan.name} (${order.server_region || 'Mumbai'})...`);

      const storeMachines = getAllPhysicalMachines();
      const machine = await allocatePhysicalMachine({
        planId: plan.id,
        location: order.server_region,
        orderId: order.id,
        storeMachines
      });

      const bareMetalResult = await startBareMetalProvisioning({
        machine,
        os: order.os || 'Ubuntu 24.04 LTS',
        hostname: order.server_name || `${machine.name.toLowerCase()}.novexhost.net`,
        sshKey: order.ssh_key,
        customerEmail,
        orderId: order.id
      });

      const vdsRecord = {
        id: `VDS-${order.id.replace('ORD-', '')}`,
        order_id: order.id,
        machine_id: machine.id,
        machine_name: machine.name,
        rack: machine.rack,
        datacenter: machine.datacenter,
        ip: bareMetalResult.ip,
        ssh_port: bareMetalResult.sshPort,
        root_user: bareMetalResult.rootUser,
        os: bareMetalResult.os,
        processor: machine.processor || plan.processor,
        ram: plan.ram || '128 GB DDR4',
        storage: plan.storage || '1 TB NVMe SSD',
        status: 'active',
        customer_email: customerEmail,
        created_at: nowIso,
        updated_at: nowIso
      };

      addVdsRecord(vdsRecord);

      const orderUpdates = {
        provisioning_status: 'active',
        machine_id: machine.id,
        provisioned_at: nowIso,
        updated_at: nowIso,
        server_details: {
          machineId: machine.id,
          machineName: machine.name,
          rack: machine.rack,
          datacenter: machine.datacenter,
          ip: bareMetalResult.ip,
          sshPort: bareMetalResult.sshPort,
          rootUser: bareMetalResult.rootUser,
          rootPassword: bareMetalResult.rootPassword,
          os: bareMetalResult.os,
          hostname: bareMetalResult.hostname,
          processor: machine.processor || plan.processor,
          ram: plan.ram || '128 GB DDR4'
        }
      };

      updateOrderInStore(orderId, orderUpdates);
      sendServerReadyEmail(order, orderUpdates.server_details).catch(e => console.warn('[Email Warning]:', e.message));

      console.log(`[Provisioning Completed] Successfully activated Bare-Metal VDS Machine ${machine.name} on IP ${bareMetalResult.ip}!`);
      return {
        success: true,
        type: 'bare-metal',
        ...orderUpdates.server_details
      };
    }

    // ----------------------------------------------------
    // BRANCH C: STANDARD GAME & VPS SERVER (Pterodactyl API)
    // ----------------------------------------------------
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

    sendDeploymentFailureEmail(order, provErr.message).catch(e => console.warn('[Email Warning]:', e.message));

    return {
      success: false,
      error: provErr.message
    };
  }
}

