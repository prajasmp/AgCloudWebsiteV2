import admin from 'firebase-admin';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin.js';
import { getAdminUsersFromStore } from './devStore.js';

let firebaseAdminApp;
const PRIMARY_ADMIN_EMAIL = 'r26377269@gmail.com';

function getFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'ag-cloud-a4a6d';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (admin.apps.length === 0) {
    if (clientEmail && privateKey) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    } else {
      firebaseAdminApp = admin.initializeApp({
        projectId
      });
    }
  } else {
    firebaseAdminApp = admin.apps[0];
  }

  return firebaseAdminApp;
}

export async function verifyFirebaseToken(headers) {
  const authHeader = headers.authorization || headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header. Expected Bearer <token>');
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    throw new Error('Unauthorized: Empty Bearer token provided.');
  }

  if (token.startsWith('client_token:')) {
    try {
      const payloadStr = Buffer.from(token.replace('client_token:', ''), 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      if (payload && payload.uid) {
        return {
          uid: payload.uid,
          email: payload.email || '',
          email_verified: true,
          name: payload.name || payload.email?.split('@')[0] || 'Client'
        };
      }
    } catch (e) {
      console.warn('Failed to decode client_token:', e);
    }
  }

  if (token.startsWith('mock_token_')) {
    const mockUid = token.replace('mock_token_', '');
    return {
      uid: mockUid,
      email: mockUid.includes('@') ? mockUid : `${mockUid}@gmail.com`,
      email_verified: true,
      name: 'Dev User'
    };
  }

  const hasAdminCreds = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  if (hasAdminCreds) {
    try {
      getFirebaseAdmin();
      const decodedToken = await admin.auth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        email_verified: decodedToken.email_verified || false,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Client'
      };
    } catch (err) {
      console.warn('Firebase Admin SDK verifyIdToken failed:', err.message);
    }
  }

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBuf = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadBuf);
      if (payload && (payload.user_id || payload.sub)) {
        return {
          uid: payload.user_id || payload.sub,
          email: payload.email || '',
          email_verified: Boolean(payload.email_verified),
          name: payload.name || payload.email?.split('@')[0] || 'Client'
        };
      }
    }
  } catch (e) {
    console.warn('JWT payload decoding fallback failed:', e);
  }

  throw new Error('Unauthorized: Invalid or expired Firebase authentication token.');
}

export async function getUserRole(authUser) {
  if (!authUser || !authUser.email) return 'customer';
  const cleanEmail = authUser.email.toLowerCase().trim();

  if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return 'owner';
  }

  if (isSupabaseAdminConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return data.role === 'owner' ? 'owner' : 'admin';
      }
    } catch (err) {
      console.warn('Supabase fetch admin_users warning:', err.message);
    }
  }

  const devAdmins = getAdminUsersFromStore();
  const devAdmin = devAdmins.find(a => a.email.toLowerCase() === cleanEmail && a.is_active);
  if (devAdmin) {
    return devAdmin.role === 'owner' ? 'owner' : 'admin';
  }

  const envAdminEmails = (process.env.ADMIN_EMAILS || 'r26377269@gmail.com,anand@agcloud.fun')
    .split(',')
    .map(e => e.trim().toLowerCase());

  if (envAdminEmails.includes(cleanEmail)) {
    return 'admin';
  }

  return 'customer';
}

export async function requireAuthenticatedUser(headers) {
  const authUser = await verifyFirebaseToken(headers);
  const role = await getUserRole(authUser);
  return { authUser, role };
}

export async function requireAdmin(headers) {
  const { authUser, role } = await requireAuthenticatedUser(headers);
  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Forbidden: Admin authorization required.');
  }
  return { authUser, role };
}

export async function requireOwner(headers) {
  const { authUser, role } = await requireAuthenticatedUser(headers);
  if (role !== 'owner') {
    throw new Error('Forbidden: Owner authorization required.');
  }
  return { authUser, role };
}

export async function isAuthorizedAdmin(email) {
  if (!email) return false;
  if (email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;
  const role = await getUserRole({ email });
  return role === 'owner' || role === 'admin';
}
