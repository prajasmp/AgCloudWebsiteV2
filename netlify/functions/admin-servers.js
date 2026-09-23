import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllServersFromStore } from './lib/devStore.js';
import { getAllServersFromPanel } from './lib/pterodactylService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
    }

    let pteroServers = [];
    try {
      pteroServers = await getAllServersFromPanel();
    } catch (e) {
      console.warn('Admin Pterodactyl fetch warning:', e.message);
    }

    let dbServers = [];
    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('servers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbServers = data;
        }
      } catch (err) {
        console.warn('Admin fetch servers warning:', err.message);
      }
    }

    const storeServers = getAllServersFromStore();
    const combinedMap = new Map();

    pteroServers.forEach(s => combinedMap.set(s.id || s.panel_server_id, s));
    storeServers.forEach(s => {
      const key = s.id || s.panel_server_id;
      if (!combinedMap.has(key)) combinedMap.set(key, s);
    });
    dbServers.forEach(s => {
      const key = s.id || s.panel_server_id;
      if (!combinedMap.has(key)) combinedMap.set(key, s);
    });

    const finalServers = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servers: finalServers })
    };
  } catch (err) {
    console.error('admin-servers error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
