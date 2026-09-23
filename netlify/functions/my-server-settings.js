import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { renameServer } from './lib/pterodactylService.js';
import { getAllServersFromStore, addServerToStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser, role } = await requireAuthenticatedUser(event.headers);
    const { serverId, name } = JSON.parse(event.body || '{}');

    if (!serverId || !name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing serverId or name' }) };
    }

    const isAdmin = role === 'owner' || role === 'admin';

    let server = getAllServersFromStore().find(
      s => s.id === serverId || s.panel_server_id === serverId || s.panel_uuid === serverId
    );
    if (!server && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('servers')
          .select('*')
          .or(`id.eq.${serverId},panel_server_id.eq.${serverId}`)
          .maybeSingle();
        if (data) server = data;
      } catch (err) {
        console.warn('DB fetch server warning:', err.message);
      }
    }

    if (!server) {
      server = {
        id: serverId,
        owner_uid: authUser.uid,
        owner_email: authUser.email,
        panel_server_id: serverId.replace('srv_', '') || '1001',
        panel_uuid: `srv-dev-${serverId}`,
        server_name: name
      };
      addServerToStore(server);
    }

    if (!isAdmin && server.owner_uid !== authUser.uid) {
      console.warn(`[Security Alert] User ${authUser.email} (${authUser.uid}) attempted unauthorized server rename on server ${serverId}`);
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this server' }) };
    }

    const targetIdentifier = server.panel_uuid || server.panel_server_id || serverId;
    await renameServer(targetIdentifier, name);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('servers')
          .update({ server_name: name })
          .or(`id.eq.${serverId},panel_server_id.eq.${serverId}`);
      } catch (err) {
        console.warn('DB update server name warning:', err.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, serverId, name })
    };
  } catch (err) {
    console.error('my-server-settings error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
