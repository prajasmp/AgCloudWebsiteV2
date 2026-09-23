import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getWebsocketToken } from './lib/pterodactylService.js';
import { getAllServersFromStore, getAllOrdersFromStore } from './lib/devStore.js';

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

        if (data) server = data;
      } catch (err) {
        console.warn('DB fetch server warning:', err.message);
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
          panel_server_id: order.panel_server_id || '1001',
          panel_uuid: `srv-restored-${order.id}`
        };
      }
    }

    if (!server) {

      server = {
        id: serverId,
        owner_uid: authUser.uid,
        panel_server_id: serverId.replace('srv_', '') || '1001',
        panel_uuid: `srv-dev-${serverId}`
      };
    }

    if (!isAdmin && server.owner_uid !== authUser.uid) {
      console.warn(`[Security Alert] User ${authUser.email} (${authUser.uid}) attempted unauthorized console token request for server ${serverId}`);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden: You do not own this server' })
      };
    }

    const targetIdentifier = server.panel_uuid || server.panel_server_id || serverId;
    const wsData = await getWebsocketToken(targetIdentifier);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: wsData.token,
        socket: wsData.socket,
        panelUuid: targetIdentifier,
        isSandbox: wsData.isSandbox || false
      })
    };
  } catch (err) {
    console.error('my-server-console-token error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
