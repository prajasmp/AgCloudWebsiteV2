import { requireAdmin } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getAdminUsersFromStore, addAdminUserToStore, removeAdminUserFromStore } from './lib/devStore.js';

export async function handler(event, context) {
  try {
    const { authUser } = await requireAdmin(event.headers);

    if (event.httpMethod === 'GET') {
      let dbAdmins = [];
      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (!error && data) {
            dbAdmins = data;
          }
        } catch (err) {
          console.warn('DB fetch admin_users warning:', err.message);
        }
      }

      const storeAdmins = getAdminUsersFromStore();
      const combinedMap = new Map();

      storeAdmins.forEach(a => {
        if (a && a.is_active !== false) {
          combinedMap.set(a.email.toLowerCase(), a);
        }
      });
      dbAdmins.forEach(a => {
        if (a && a.is_active !== false) {
          combinedMap.set(a.email.toLowerCase(), a);
        }
      });

      const finalAdmins = Array.from(combinedMap.values());

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsers: finalAdmins })
      };
    }

    if (event.httpMethod === 'POST') {
      const { email } = JSON.parse(event.body || '{}');
      if (!email || !email.includes('@')) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid email address is required' }) };
      }

      const cleanEmail = email.toLowerCase().trim();

      const newDevAdmin = addAdminUserToStore(cleanEmail, authUser.email);

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('admin_users')
            .upsert({
              email: cleanEmail,
              role: 'admin',
              is_active: true,
              created_by: authUser.email
            }, { onConflict: 'email' });
        } catch (err) {
          console.error('Supabase admin insert error:', err.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: `Admin privileges granted to ${cleanEmail}`, admin: newDevAdmin })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const { id, email } = params;
      const target = email || id;

      if (!target) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or email parameter' }) };
      }

      const cleanTarget = target.toLowerCase().trim();

      if (cleanTarget === 'r26377269@gmail.com') {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Action Rejected: Primary Owner (r26377269@gmail.com) is immutable and cannot be removed.' })
        };
      }

      removeAdminUserFromStore(cleanTarget);

      if (isSupabaseAdminConfigured() && supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('admin_users')
            .delete()
            .eq('email', cleanTarget);
          await supabaseAdmin
            .from('admin_users')
            .update({ is_active: false })
            .eq('email', cleanTarget);
        } catch (err) {
          console.warn('Supabase admin revoke error:', err.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: `Admin authorization revoked for ${cleanTarget}` })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('admin-admin-users error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
