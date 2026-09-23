import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { sendPowerAction } from './lib/pterodactylService.js';
import { getAllServersFromStore, getAllOrdersFromStore, addServerToStore, updateServerStatusInStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser, role } = await requireAuthenticatedUser(event.headers);
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {}

    const serverId = body.serverId;
    const action = body.action;

    if (!serverId || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing serverId or action' }) };
    }

    const ALLOWED_ACTIONS = ['start', 'stop', 'restart', 'kill', 'delete'];
    if (!ALLOWED_ACTIONS.includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: `Invalid action: ${action}` }) };
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
        console.warn('DB fetch server error:', err.message);
      }
    }

    if (!server) {
      let order = getAllOrdersFromStore().find(
        o => o.id === serverId || o.panel_server_id === serverId
      );
      if (!order && isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          const res = await supabaseAdmin.from('orders').select('*').eq('id', serverId).maybeSingle();
          if (res.data) order = res.data;
        } catch (e) {}
      }

      if (order) {
        server = {
          id: serverId,
          owner_uid: order.owner_uid,
          owner_email: order.user_email || authUser.email,
          panel_server_id: order.panel_server_id || '1001',
          panel_uuid: `srv-restored-${order.id}`
        };
      }
    }

    if (!server) {
      server = {
        id: serverId,
        owner_uid: authUser.uid,
        owner_email: authUser.email,
        panel_server_id: serverId.replace('srv_', '') || '1001',
        panel_uuid: `srv-dev-${serverId}`,
        server_name: 'AG Minecraft Server',
        status: 'online'
      };
      addServerToStore(server);
    }

    if (!isAdmin && server.owner_uid !== authUser.uid && server.owner_email !== authUser.email) {
      console.warn(`[Security Alert] User ${authUser.email} (${authUser.uid}) attempted unauthorized action '${action}' on server ${serverId}`);
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this server' }) };
    }

    const panelId = server.panel_server_id || serverId.replace('srv_', '');
    const targetIdentifier = server.panel_uuid || panelId;

    if (action === 'delete') {
      try {
        const { deleteServer } = await import('./lib/pterodactylService.js');

        await deleteServer(panelId);
      } catch (err) {
        console.warn('Delete server warning:', err.message);
      }
      const { deleteServerFromStore, updateOrderInStore } = await import('./lib/devStore.js');
      deleteServerFromStore(serverId);
      deleteServerFromStore(server.id);
      deleteServerFromStore(server.panel_server_id);
      deleteServerFromStore(server.panel_uuid);
      deleteServerFromStore(targetIdentifier);

      const targetOrderId = server.order_id || server.id;
      if (targetOrderId) {
        updateOrderInStore(targetOrderId, { provisioning_status: 'deleted', payment_status: 'DELETED' });
      }

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').delete().or(`id.eq.${server.id},panel_server_id.eq.${panelId},panel_uuid.eq.${targetIdentifier}`);
          if (targetOrderId) {
            await supabaseAdmin.from('orders').update({ provisioning_status: 'deleted', payment_status: 'DELETED' }).or(`id.eq.${targetOrderId},panel_server_id.eq.${panelId}`);
          }
        } catch (err) {
          console.warn('Delete server DB error:', err.message);
        }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, serverId, action: 'delete' })
      };
    }

    await sendPowerAction(targetIdentifier, action);

    const newStatus = action === 'start' ? 'online' : action === 'stop' || action === 'kill' ? 'offline' : 'restarting';
    updateServerStatusInStore(serverId, newStatus);

    if (isSupabaseAdminConfigured() && supabaseAdmin && server.id) {
      try {
        await supabaseAdmin
          .from('servers')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', server.id);
      } catch (err) {
        console.warn('Update status warning:', err.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, serverId, action, status: newStatus })
    };
  } catch (err) {
    console.error('Server action error:', err.message);
    const statusCode = err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : err.message.includes('404') || err.message.includes('Not Found') ? 404 : 400;
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to execute power action' })
    };
  }
}
