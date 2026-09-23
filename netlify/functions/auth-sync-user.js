import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { authUser, role } = await requireAuthenticatedUser(event.headers);

    let body = {};
    try {
      if (event.body) body = JSON.parse(event.body);
    } catch (e) {}

    const userId = authUser.uid;
    const email = authUser.email || body.email || '';
    const displayName = body.displayName || authUser.name || email.split('@')[0] || 'User';
    const photoURL = body.photoURL || authUser.picture || '';

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('users').upsert({
          id: userId,
          display_name: displayName,
          email: email,
          photo_url: photoURL,
          last_login: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Supabase admin user upsert warning:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        role: role,
        user: {
          uid: userId,
          email,
          displayName,
          photoURL
        }
      })
    };
  } catch (err) {
    console.error('auth-sync-user error:', err.message);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to sync user profile' })
    };
  }
}
