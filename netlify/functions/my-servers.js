import { verifyFirebaseToken } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getServersFromStore, getOrdersFromStore, addServerToStore } from './lib/devStore.js';
import { getTrustedPlan } from './lib/planConfig.js';
import { getUserServersFromPanel, getServerResources } from './lib/pterodactylService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    let pteroServers = [];
    try {
      pteroServers = await getUserServersFromPanel(authUser.email);
    } catch (e) {
      console.warn('Failed to fetch Pterodactyl user servers:', e.message);
    }

    let dbServers = [];
    let dbOrders = [];

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const [serversRes, ordersRes] = await Promise.all([
          supabaseAdmin.from('servers').select('*').eq('owner_uid', authUser.uid).order('created_at', { ascending: false }),
          supabaseAdmin.from('orders').select('*').eq('owner_uid', authUser.uid)
        ]);

        if (!serversRes.error && serversRes.data) {
          dbServers = serversRes.data;
        }
        if (!ordersRes.error && ordersRes.data) {
          dbOrders = ordersRes.data;
        }
      } catch (err) {
        console.warn('Supabase fetch servers warning:', err.message);
      }
    }

    const storeServers = getServersFromStore(authUser.uid);
    const storeOrders = getOrdersFromStore(authUser.uid);

    const combinedMap = new Map();

    pteroServers.forEach(s => {
      combinedMap.set(s.panel_server_id || s.id, {
        id: s.id,
        owner_uid: authUser.uid,
        owner_email: authUser.email,
        panel_server_id: s.panel_server_id,
        panel_uuid: s.panel_uuid,
        identifier: s.identifier,
        server_name: s.server_name,
        node_id: s.node_id || 1,
        ip: s.ip || '103.195.100.42',
        port: s.port || 25565,
        memory_mb: s.memory_mb || 2048,
        disk_mb: s.disk_mb || 10240,
        cpu_percent: s.cpu_percent || 100,
        status: s.status || 'online',
        created_at: s.created_at || new Date().toISOString()
      });
    });

    storeServers.forEach(s => {
      const key = s.panel_server_id || s.id;
      if (!combinedMap.has(key)) combinedMap.set(key, s);
    });

    dbServers.forEach(s => {
      const key = s.panel_server_id || s.id;
      if (!combinedMap.has(key)) combinedMap.set(key, s);
    });

    const allOrders = [...storeOrders, ...dbOrders];
    for (const order of allOrders) {
      if (order.provisioning_status === 'deleted' || order.payment_status === 'DELETED') continue;

      const isOrderPaid = order.payment_status === 'paid' || order.payment_status === 'admin_bypass' || order.payment_status === 'APPROVED';
      if (!isOrderPaid) continue;

      const matchingServer = Array.from(combinedMap.values()).find(
        s => s.id === order.id || s.id === order.panel_server_id || s.panel_server_id === order.panel_server_id || s.order_id === order.id
      );

      if (!matchingServer) {
        const plan = getTrustedPlan(order.plan_id);
        const restoredServer = {
          id: order.id.startsWith('srv_') ? order.id : `srv_${order.id.replace('ord_', '')}`,
          owner_uid: authUser.uid,
          owner_email: order.user_email || order.contact_email || authUser.email,
          order_id: order.id,
          plan_id: order.plan_id || 'mc_intel_2gb',
          panel_server_id: order.panel_server_id || String(Math.floor(1000 + Math.random() * 9000)),
          panel_uuid: `srv-restored-${order.id}`,
          server_name: `${order.plan_name || 'Minecraft Server'}`,
          node_id: 1,
          allocation_id: 101,
          ip: '103.195.100.42',
          port: 25565,
          memory_mb: plan?.memoryMb || 2048,
          disk_mb: plan?.diskMb || 10240,
          cpu_percent: plan?.cpuPercent || 200,
          status: 'online',
          created_at: order.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        addServerToStore(restoredServer);
        if (isSupabaseAdminConfigured() && supabaseAdmin) {
          try {
            await supabaseAdmin.from('servers').upsert(restoredServer, { onConflict: 'id' });
          } catch (e) {
            console.warn('DB restored server warning:', e.message);
          }
        }

        combinedMap.set(restoredServer.id, restoredServer);
      }
    }

    const rawServersList = Array.from(combinedMap.values());

    const enrichedServers = await Promise.all(
      rawServersList.map(async (srv) => {
        const targetId = srv.identifier || srv.panel_uuid || srv.panel_server_id || srv.id;
        try {
          const stats = await getServerResources(targetId);
          let liveStatus = srv.status || 'online';
          if (stats.isUnreachable) {
            liveStatus = 'panel_unavailable';
          } else if (stats.currentState) {
            if (stats.currentState === 'running') liveStatus = 'online';
            else if (stats.currentState === 'offline' || stats.currentState === 'stopped') liveStatus = 'offline';
            else if (stats.currentState === 'starting') liveStatus = 'starting';
            else if (stats.currentState === 'stopping') liveStatus = 'stopping';
            else liveStatus = stats.currentState;
          }

          return {
            ...srv,
            status: liveStatus,
            memory_used_mb: Math.round((stats.resources?.memoryBytes || 0) / (1024 * 1024)),
            disk_used_mb: Math.round((stats.resources?.diskBytes || 0) / (1024 * 1024)),
            cpu_used_percent: Math.round(stats.resources?.cpuAbsolute || 0),
            panel_unreachable: Boolean(stats.isUnreachable)
          };
        } catch (e) {
          return {
            ...srv,
            status: srv.status || 'online',
            memory_used_mb: 0,
            disk_used_mb: 0,
            cpu_used_percent: 0,
            panel_unreachable: false
          };
        }
      })
    );

    enrichedServers.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    const hasPanelUnreachable = enrichedServers.some(s => s.panel_unreachable);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servers: enrichedServers,
        panelUnreachable: hasPanelUnreachable
      })
    };
  } catch (err) {
    console.error('my-servers error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
