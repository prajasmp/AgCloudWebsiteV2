import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { deleteServerFromStore, updateServerStatusInStore } from './lib/devStore.js';
import { sendPowerAction, suspendServer, unsuspendServer, deleteServer } from './lib/pterodactylService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
    }

    const { serverId, action } = JSON.parse(event.body || '{}');
    if (!serverId || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing serverId or action' }) };
    }

    const ADMIN_ACTIONS = ['start', 'stop', 'restart', 'suspend', 'unsuspend', 'delete'];
    if (!ADMIN_ACTIONS.includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: `Invalid admin action: ${action}` }) };
    }

    const targetPanelId = String(serverId).replace('srv_', '');

    if (action === 'start' || action === 'stop' || action === 'restart') {
      await sendPowerAction(targetPanelId, action);
      const newStatus = action === 'start' ? 'online' : action === 'stop' ? 'offline' : 'restarting';
      updateServerStatusInStore(serverId, newStatus);
      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').update({ status: newStatus }).or(`id.eq.${serverId},panel_server_id.eq.${targetPanelId}`);
        } catch (e) {}
      }
    } else if (action === 'suspend') {
      await suspendServer(targetPanelId);
      updateServerStatusInStore(serverId, 'suspended');
      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').update({ status: 'suspended' }).or(`id.eq.${serverId},panel_server_id.eq.${targetPanelId}`);
        } catch (e) {}
      }
    } else if (action === 'unsuspend') {
      await unsuspendServer(targetPanelId);
      updateServerStatusInStore(serverId, 'online');
      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').update({ status: 'online' }).or(`id.eq.${serverId},panel_server_id.eq.${targetPanelId}`);
        } catch (e) {}
      }
    } else if (action === 'delete') {
      try {
        await deleteServer(targetPanelId);
      } catch (err) {
        console.warn('Pterodactyl delete server warning:', err.message);
      }
      deleteServerFromStore(serverId);
      deleteServerFromStore(targetPanelId);

      const { updateOrderInStore } = await import('./lib/devStore.js');
      updateOrderInStore(serverId, { provisioning_status: 'deleted', payment_status: 'DELETED' });

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('servers').delete().or(`id.eq.${serverId},panel_server_id.eq.${targetPanelId}`);
          await supabaseAdmin.from('orders').update({ provisioning_status: 'deleted' }).or(`id.eq.${serverId},panel_server_id.eq.${targetPanelId}`);
        } catch (e) {}
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, serverId, action })
    };
  } catch (err) {
    console.error('Admin server action error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
