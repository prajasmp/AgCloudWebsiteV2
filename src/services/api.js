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
    const savedUserStr = localStorage.getItem('novexhost_user') || localStorage.getItem('ag_cloud_user');
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

// ================= CUSTOMER PAYMENT & ORDER API =================
export async function createPaymentOrder(orderData) {
  return await apiFetch('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function verifyPayment(paymentData) {
  return await apiFetch('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
}

export async function trackOrder(email = '', orderId = '', token = '') {
  const params = new URLSearchParams();
  if (token && token.trim()) params.append('token', token.trim());
  if (email && email.trim()) params.append('email', email.trim());
  if (orderId && orderId.trim()) params.append('orderId', orderId.trim());

  return await apiFetch(`/api/orders/track?${params.toString()}`);
}

export async function checkPaymentStatus(orderId, token = '') {
  let url = `/api/payments/status?orderId=${encodeURIComponent(orderId)}`;
  if (token) url += `&token=${encodeURIComponent(token)}`;
  return await apiFetch(url);
}

// ================= USER & AUTH API =================
export async function syncUserWithBackend(userObj) {
  return await apiFetch('/api/auth/sync-user', {
    method: 'POST',
    body: JSON.stringify(userObj)
  });
}

// ================= CUSTOMER PANEL API =================
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

// ================= ADMIN CONSOLE API =================
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

export async function fetchAdminProducts() {
  return await apiFetch('/api/admin/products');
}

export async function updateAdminProductPrice(planId, price) {
  return await apiFetch('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({ planId, price })
  });
}

export async function fetchAdminSettings() {
  return await apiFetch('/api/admin/settings');
}

export async function retryAdminDeployment(orderId) {
  return await apiFetch('/api/admin/retry-deployment', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });
}

export async function sendAdminServerAction(serverId, action) {
  return await apiFetch('/api/admin/server-action', {
    method: 'POST',
    body: JSON.stringify({ serverId, action })
  });
}

export async function fetchAdminUsersList() {
  return await apiFetch('/api/admin/users');
}

export async function fetchAdminInfrastructure() {
  return await apiFetch('/api/admin/infrastructure');
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

export async function approveOrRejectOrder(orderId, action, rejectionReason = '') {
  return await apiFetch('/api/admin/approve-order', {
    method: 'POST',
    body: JSON.stringify({ orderId, action, rejectionReason })
  });
}

export async function fetchAdminWebHosting() {
  return await apiFetch('/api/admin/webhosting');
}

export async function manageAdminWebHosting(payload) {
  return await apiFetch('/api/admin/webhosting', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchAdminVds() {
  return await apiFetch('/api/admin/vds');
}

export async function manageAdminVds(payload) {
  return await apiFetch('/api/admin/vds', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
