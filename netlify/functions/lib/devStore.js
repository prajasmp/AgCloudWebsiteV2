if (!globalThis.__ag_cloud_orders_store__) {
  globalThis.__ag_cloud_orders_store__ = [];
}
if (!globalThis.__ag_cloud_servers_store__) {
  globalThis.__ag_cloud_servers_store__ = [];
}
if (!globalThis.__ag_cloud_admin_users_store__) {
  globalThis.__ag_cloud_admin_users_store__ = [
    {
      id: 'adm_primary_owner',
      email: 'r26377269@gmail.com',
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'system'
    }
  ];
}

const ordersStore = globalThis.__ag_cloud_orders_store__;
const serversStore = globalThis.__ag_cloud_servers_store__;
const adminUsersStore = globalThis.__ag_cloud_admin_users_store__;

export function addOrderToStore(order) {
  const existingIdx = ordersStore.findIndex(o => o.id === order.id);
  if (existingIdx >= 0) {
    ordersStore[existingIdx] = { ...ordersStore[existingIdx], ...order };
  } else {
    ordersStore.unshift(order);
  }
  return order;
}

export function updateOrderInStore(orderId, updates) {
  const order = ordersStore.find(o => o.id === orderId);
  if (order) {
    Object.assign(order, updates, { updated_at: new Date().toISOString() });
    return order;
  }
  return null;
}

export function getOrderByIdFromStore(orderId) {
  return ordersStore.find(o => o.id === orderId) || null;
}

export function getOrdersFromStore(ownerUid) {
  if (!ownerUid) return [...ordersStore];
  return ordersStore.filter(o => o.owner_uid === ownerUid || o.ownerUid === ownerUid);
}

export function getAllOrdersFromStore() {
  return [...ordersStore];
}

export function clearAllOrdersFromStore() {
  ordersStore.length = 0;
  return [];
}

export function deleteOrderFromStore(orderId) {
  const idx = ordersStore.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    ordersStore.splice(idx, 1);
  }
}

export function addServerToStore(server) {
  const existingIdx = serversStore.findIndex(
    s => s.id === server.id || s.panel_server_id === server.panel_server_id || s.panel_uuid === server.panel_uuid
  );
  if (existingIdx >= 0) {
    serversStore[existingIdx] = { ...serversStore[existingIdx], ...server };
  } else {
    serversStore.unshift(server);
  }
  return server;
}

export function getServersFromStore(ownerUid) {
  if (!ownerUid) return [...serversStore];
  return serversStore.filter(s => s.owner_uid === ownerUid || s.ownerUid === ownerUid);
}

export function getAllServersFromStore() {
  return [...serversStore];
}

export function updateServerStatusInStore(serverId, status) {
  const server = serversStore.find(
    s => s.id === serverId || s.panel_server_id === serverId || s.panel_uuid === serverId
  );
  if (server) {
    server.status = status;
    server.updated_at = new Date().toISOString();
  }
}

export function deleteServerFromStore(serverId) {
  if (!serverId) return;
  const idx = serversStore.findIndex(
    s => s.id === serverId || s.panel_server_id === serverId || s.panel_uuid === serverId || s.order_id === serverId
  );
  if (idx >= 0) {
    serversStore.splice(idx, 1);
    deleteServerFromStore(serverId);
  }
}

export function getAdminUsersFromStore() {
  return adminUsersStore.filter(a => a.is_active !== false);
}

export function addAdminUserToStore(email, createdBy = 'r26377269@gmail.com') {
  const cleanEmail = email.toLowerCase().trim();
  const existing = adminUsersStore.find(a => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.is_active = true;
    return existing;
  }

  const newAdmin = {
    id: 'adm_' + Math.random().toString(36).substring(2, 10),
    email: cleanEmail,
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    created_by: createdBy
  };
  adminUsersStore.push(newAdmin);
  return newAdmin;
}

export function removeAdminUserFromStore(idOrEmail) {
  const target = idOrEmail.toLowerCase().trim();

  if (target === 'r26377269@gmail.com' || target === 'adm_primary_owner') {
    throw new Error('Action Rejected: Primary Owner (r26377269@gmail.com) cannot be removed or demoted.');
  }

  let removed = null;
  for (let i = adminUsersStore.length - 1; i >= 0; i--) {
    const a = adminUsersStore[i];
    if (a.id === idOrEmail || a.email.toLowerCase() === target) {
      if (a.role === 'owner' || a.email.toLowerCase() === 'r26377269@gmail.com') {
        throw new Error('Action Rejected: Primary Owner cannot be removed.');
      }
      removed = adminUsersStore.splice(i, 1)[0];
    }
  }
  return removed;
}
