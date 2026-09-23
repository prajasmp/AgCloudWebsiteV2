import { auth } from '../lib/firebase';

async function getAuthToken() {
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken(false);
      if (idToken) return idToken;
    } catch (err) {
      console.warn('Failed to get Firebase ID token from currentUser:', err);
    }
  }

  try {
    const savedUserStr = localStorage.getItem('ag_cloud_user');
    if (savedUserStr) {
      const savedUser = JSON.parse(savedUserStr);
      if (savedUser && savedUser.uid) {
        const payload = {
          uid: savedUser.uid,
          email: savedUser.email || '',
          name: savedUser.displayName || ''
        };
        return `client_token:${btoa(JSON.stringify(payload))}`;
      }
    }
  } catch (e) {
    console.warn('Failed to parse localStorage user for auth token:', e);
  }

  return null;
}

export async function apiFetch(endpoint, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { text };
  }

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data;
}

export async function createPaymentOrder(orderData) {
  return await apiFetch('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function trackOrder(email, orderId = '') {
  let url = `/api/orders/track?email=${encodeURIComponent(email)}`;
  if (orderId && orderId.trim()) {
    url += `&orderId=${encodeURIComponent(orderId.trim())}`;
  }
  return await apiFetch(url);
}

export async function approveOrRejectOrder(orderId, action, rejectionReason = '') {
  return await apiFetch('/api/admin/approve-order', {
    method: 'POST',
    body: JSON.stringify({ orderId, action, rejectionReason })
  });
}

export async function checkPaymentStatus(orderId) {
  return await apiFetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`);
}

export async function fetchMyOrders() {
  return await apiFetch('/api/my-orders');
}

export async function fetchMyServers() {
  return await apiFetch('/api/my-servers');
}

export async function sendServerAction(serverId, action) {
  return await apiFetch('/api/my-servers/action', {
    method: 'POST',
    body: JSON.stringify({ serverId, action })
  });
}

export async function fetchServerDetails(serverId) {
  return await apiFetch(`/api/my-servers/details?serverId=${encodeURIComponent(serverId)}`);
}

export async function fetchServerConsoleToken(serverId) {
  return await apiFetch(`/api/my-servers/console-token?serverId=${encodeURIComponent(serverId)}`);
}

export async function sendConsoleCommand(serverId, command) {

  return await apiFetch('/api/my-servers/command', {
    method: 'POST',
    body: JSON.stringify({ serverId, command })
  });
}

export async function fetchServerFiles(serverId, directory = '/') {
  return await apiFetch(`/api/my-servers/files?serverId=${encodeURIComponent(serverId)}&directory=${encodeURIComponent(directory)}&action=list`);
}

export async function readServerFile(serverId, filePath) {
  return await apiFetch(`/api/my-servers/files?serverId=${encodeURIComponent(serverId)}&filePath=${encodeURIComponent(filePath)}&action=read`);
}

export async function writeServerFile(serverId, filePath, content) {
  return await apiFetch('/api/my-servers/files', {
    method: 'POST',
    body: JSON.stringify({ serverId, action: 'write', filePath, content })
  });
}

export async function createServerFolder(serverId, directory, folderName) {
  return await apiFetch('/api/my-servers/files', {
    method: 'POST',
    body: JSON.stringify({ serverId, action: 'createFolder', directory, folderName })
  });
}

export async function renameServerFile(serverId, directory, oldName, newName) {
  return await apiFetch('/api/my-servers/files', {
    method: 'POST',
    body: JSON.stringify({ serverId, action: 'rename', directory, oldName, newName })
  });
}

export async function deleteServerFile(serverId, directory, fileName) {
  return await apiFetch('/api/my-servers/files', {
    method: 'POST',
    body: JSON.stringify({ serverId, action: 'delete', directory, fileName })
  });
}

export async function renameServerName(serverId, name) {
  return await apiFetch('/api/my-servers/settings', {
    method: 'POST',
    body: JSON.stringify({ serverId, name })
  });
}

export async function fetchAdminOrders() {
  return await apiFetch('/api/admin/orders');
}

export async function clearAllAdminOrders() {
  return await apiFetch('/api/admin/orders', {
    method: 'DELETE'
  });
}

export async function deleteAdminOrder(orderId) {
  return await apiFetch(`/api/admin/orders?orderId=${encodeURIComponent(orderId)}`, {
    method: 'DELETE'
  });
}

export async function fetchAdminServers() {
  return await apiFetch('/api/admin/servers');
}

export async function fetchAdminMetrics() {
  return await apiFetch('/api/admin/metrics');
}

export async function sendAdminServerAction(serverId, action) {
  return await apiFetch('/api/admin/server-action', {
    method: 'POST',
    body: JSON.stringify({ serverId, action })
  });
}

export async function fetchAdminAdminUsers() {
  return await apiFetch('/api/admin/admin-users');
}

export async function addAdminUser(email) {
  return await apiFetch('/api/admin/admin-users', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function removeAdminUser(emailOrId) {
  return await apiFetch(`/api/admin/admin-users?email=${encodeURIComponent(emailOrId)}`, {
    method: 'DELETE'
  });
}

export async function fetchAdminUsersList() {
  return await apiFetch('/api/admin/users');
}

export async function fetchAdminInfrastructure() {
  return await apiFetch('/api/admin/infrastructure');
}

export async function syncUserWithBackend(userObj) {
  return await apiFetch('/api/auth/sync-user', {
    method: 'POST',
    body: JSON.stringify(userObj)
  });
}
