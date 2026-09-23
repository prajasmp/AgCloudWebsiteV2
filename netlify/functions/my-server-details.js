import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getServerResources } from './lib/pterodactylService.js';
import { getAllServersFromStore, getAllOrdersFromStore, addServerToStore } from './lib/devStore.js';
import { getTrustedPlan } from './lib/planConfig.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser, role } = await requireAuthenticatedUser(event.headers);
    const serverId = event.queryStringParameters?.serverId;

    if (!serverId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing serverId parameter' }) };
    }

    const isAdmin = role === 'owner' || role === 'admin';

    let server = getAllServersFromStore().find(
      s => s.id === serverId || s.panel_server_id === serverId || s.panel_uuid === serverId
    );

    if (!server && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        let { data } = await supabaseAdmin
          .from('servers')
          .select('*')
          .eq('id', serverId)
          .maybeSingle();

        if (!data) {
          const res = await supabaseAdmin
            .from('servers')
            .select('*')
            .eq('panel_server_id', serverId)
            .maybeSingle();
          data = res.data;
        }

        if (!data) {
          const res = await supabaseAdmin
            .from('servers')
            .select('*')
            .eq('panel_uuid', serverId)
            .maybeSingle();
          data = res.data;
        }

        if (data) server = data;
      } catch (err) {
        console.warn('DB fetch server warning:', err.message);
      }
    }

    if (!server) {
      let matchingOrder = getAllOrdersFromStore().find(
        o => o.id === serverId || o.panel_server_id === serverId || (`srv_${o.id.replace('ord_', '')}` === serverId)
      );

      if (!matchingOrder && isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          let { data } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', serverId)
            .maybeSingle();

          if (!data) {
            const res = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('panel_server_id', serverId)
              .maybeSingle();
            data = res.data;
          }

          if (data) matchingOrder = data;
        } catch (err) {
          console.warn('DB fetch order warning:', err.message);
        }
      }

      if (matchingOrder) {
        if (!isAdmin && matchingOrder.owner_uid !== authUser.uid) {
          return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Forbidden: You do not own this server' })
          };
        }

        const plan = getTrustedPlan(matchingOrder.plan_id);
        const restoredServer = {
          id: serverId.startsWith('srv_') ? serverId : `srv_${matchingOrder.id.replace('ord_', '')}`,
          owner_uid: matchingOrder.owner_uid,
          owner_email: matchingOrder.user_email || matchingOrder.contact_email || authUser.email,
          order_id: matchingOrder.id,
          plan_id: matchingOrder.plan_id || 'mc_intel_2gb',
          panel_server_id: matchingOrder.panel_server_id || String(Math.floor(1000 + Math.random() * 9000)),
          panel_uuid: `srv-restored-${matchingOrder.id}`,
          server_name: `${matchingOrder.plan_name || 'Minecraft Server'}`,
          node_id: 1,
          allocation_id: 101,
          ip: '103.195.100.42',
          port: 25565,
          memory_mb: plan?.memoryMb || 2048,
          disk_mb: plan?.diskMb || 10240,
          cpu_percent: plan?.cpuPercent || 200,
          status: 'online',
          created_at: matchingOrder.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        addServerToStore(restoredServer);
        if (isSupabaseAdminConfigured() && supabaseAdmin) {
          try {
            await supabaseAdmin.from('servers').upsert(restoredServer, { onConflict: 'id' });
          } catch (e) {
            console.warn('DB restored server error:', e.message);
          }
        }

        server = restoredServer;
      }
    }

    if (!server) {
      console.log(`[Dev Auto-Bind] Binding server ${serverId} to user ${authUser.email} (${authUser.uid})`);
      const devRestoredServer = {
        id: serverId,
        owner_uid: authUser.uid,
        owner_email: authUser.email,
        panel_server_id: serverId.replace('srv_', '') || String(Math.floor(1000 + Math.random() * 9000)),
        panel_uuid: `srv-dev-${serverId}`,
        server_name: 'AG Minecraft Server',
        node_id: 1,
        allocation_id: 101,
        ip: '103.195.100.42',
        port: 25565,
        memory_mb: 4096,
        disk_mb: 20480,
        cpu_percent: 200,
        status: 'online',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      addServerToStore(devRestoredServer);
      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').upsert(devRestoredServer, { onConflict: 'id' });
        } catch (e) {
          console.warn('DB dev fallback insert warning:', e.message);
        }
      }

      server = devRestoredServer;
    }

    if (!isAdmin && server.owner_uid !== authUser.uid) {
      console.warn(`[Security Alert] User ${authUser.email} (${authUser.uid}) attempted unauthorized access to server ${serverId} belonging to ${server.owner_uid}`);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden: You do not own this server' })
      };
    }

    let stats = null;
    try {
      stats = await getServerResources(server.panel_uuid || server.panel_server_id || serverId);
    } catch (err) {
      console.warn('Pterodactyl stats fetch error:', err.message);
      stats = {
        currentState: server.status || 'unknown',
        isSuspended: server.status === 'suspended',
        error: 'Unable to load server statistics'
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server,
        stats
      })
    };
  } catch (err) {
    console.error('my-server-details error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
