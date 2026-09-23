import { requireAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAllOrdersFromStore, getAllServersFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser, role } = await requireAdmin(event.headers);

    let usersMap = new Map();

    const orders = getAllOrdersFromStore();
    const servers = getAllServersFromStore();

    orders.forEach(o => {
      const key = o.owner_uid || o.user_email;
      if (key) {
        if (!usersMap.has(key)) {
          usersMap.set(key, {
            uid: o.owner_uid || 'N/A',
            email: o.user_email || o.contact_email || 'N/A',
            name: o.user_name || o.email?.split('@')[0] || 'Customer',
            serverCount: 0,
            orderCount: 0,
            createdAt: o.created_at || new Date().toISOString()
          });
        }
        const userObj = usersMap.get(key);
        userObj.orderCount += 1;
      }
    });

    servers.forEach(s => {
      const key = s.owner_uid || s.owner_email;
      if (key) {
        if (!usersMap.has(key)) {
          usersMap.set(key, {
            uid: s.owner_uid || 'N/A',
            email: s.owner_email || 'N/A',
            name: s.owner_email?.split('@')[0] || 'Customer',
            serverCount: 0,
            orderCount: 0,
            createdAt: s.created_at || new Date().toISOString()
          });
        }
        const userObj = usersMap.get(key);
        userObj.serverCount += 1;
      }
    });

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data: dbUsers } = await supabaseAdmin.from('users').select('*');
        if (dbUsers) {
          dbUsers.forEach(u => {
            const key = u.id || u.email;
            const existing = usersMap.get(key) || {
              uid: u.id,
              email: u.email,
              name: u.display_name || u.email?.split('@')[0],
              serverCount: 0,
              orderCount: 0,
              createdAt: u.created_at || u.last_login
            };
            existing.name = u.display_name || existing.name;
            existing.email = u.email || existing.email;
            usersMap.set(key, existing);
          });
        }
      } catch (err) {
        console.warn('DB fetch users warning:', err.message);
      }
    }

    const usersList = Array.from(usersMap.values());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersList })
    };
  } catch (err) {
    console.error('admin-users error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
