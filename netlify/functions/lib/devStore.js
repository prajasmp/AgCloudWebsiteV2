import fs from 'fs';
import path from 'path';

// Memory store backed by scratch/novexhost_store.json file for persistence across server restarts
const STORE_DIR = path.resolve(process.cwd(), 'scratch');
const STORE_FILE = path.join(STORE_DIR, 'novexhost_store.json');

function ensureStoreDir() {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
  } catch (e) {
    // ignore
  }
}

function loadPersistedData() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Store] Could not load persisted store:', err.message);
  }
  return null;
}

function savePersistedData() {
  try {
    ensureStoreDir();
    const data = {
      orders: globalThis.__novexhost_orders_store__ || [],
      servers: globalThis.__novexhost_servers_store__ || [],
      adminUsers: globalThis.__novexhost_admin_users_store__ || [],
      webhookEvents: globalThis.__novexhost_webhook_events_store__ || [],
      invoices: globalThis.__novexhost_invoices_store__ || [],
      productOverrides: globalThis.__novexhost_product_overrides_store__ || {}
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Store] Could not save store to disk:', err.message);
  }
}

const persisted = loadPersistedData();

if (!globalThis.__novexhost_orders_store__) {
  globalThis.__novexhost_orders_store__ = persisted?.orders || [];
}
if (!globalThis.__novexhost_servers_store__) {
  globalThis.__novexhost_servers_store__ = persisted?.servers || [];
}
if (!globalThis.__novexhost_admin_users_store__) {
  globalThis.__novexhost_admin_users_store__ = persisted?.adminUsers || [
    {
      id: 'adm_primary_owner',
      email: 'notxlaksly@gmail.com',
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'system'
    },
    {
      id: 'adm_owner_2',
      email: 'r26377269@gmail.com',
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'system'
    }
  ];
}
if (!globalThis.__novexhost_webhook_events_store__) {
  globalThis.__novexhost_webhook_events_store__ = persisted?.webhookEvents || [];
}
if (!globalThis.__novexhost_invoices_store__) {
  globalThis.__novexhost_invoices_store__ = persisted?.invoices || [];
}
if (!globalThis.__novexhost_product_overrides_store__) {
  globalThis.__novexhost_product_overrides_store__ = persisted?.productOverrides || {};
}

const ordersStore = globalThis.__novexhost_orders_store__;
const serversStore = globalThis.__novexhost_servers_store__;
const adminUsersStore = globalThis.__novexhost_admin_users_store__;
const webhookEventsStore = globalThis.__novexhost_webhook_events_store__;
const invoicesStore = globalThis.__novexhost_invoices_store__;
const productOverridesStore = globalThis.__novexhost_product_overrides_store__;

// ================= ORDERS =================
export function addOrderToStore(order) {
  const existingIdx = ordersStore.findIndex(o => o.id === order.id);
  if (existingIdx >= 0) {
    ordersStore[existingIdx] = { ...ordersStore[existingIdx], ...order };
  } else {
    ordersStore.unshift(order);
  }
  savePersistedData();
  return order;
}

export function updateOrderInStore(orderId, updates) {
  const order = ordersStore.find(o => o.id === orderId);
  if (order) {
    Object.assign(order, updates, { updated_at: new Date().toISOString() });
    savePersistedData();
    return order;
  }
  return null;
}

export function getOrderByIdFromStore(orderId) {
  if (!orderId) return null;
  return ordersStore.find(o => o.id === orderId || o.tracking_token === orderId || o.razorpay_order_id === orderId) || null;
}

export function getOrderByTokenFromStore(token) {
  if (!token) return null;
  return ordersStore.find(o => o.tracking_token === token || o.id === token) || null;
}

export function getOrdersFromStore(emailOrUid) {
  if (!emailOrUid) return [...ordersStore];
  const query = emailOrUid.toLowerCase().trim();
  return ordersStore.filter(o => 
    o.user_email?.toLowerCase() === query ||
    o.contact_email?.toLowerCase() === query ||
    o.owner_uid === query ||
    o.ownerUid === query
  );
}

export function getAllOrdersFromStore() {
  return [...ordersStore];
}

export function clearAllOrdersFromStore() {
  ordersStore.length = 0;
  savePersistedData();
  return [];
}

export function deleteOrderFromStore(orderId) {
  const idx = ordersStore.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    ordersStore.splice(idx, 1);
    savePersistedData();
  }
}

// ================= SERVERS =================
export function addServerToStore(server) {
  const existingIdx = serversStore.findIndex(
    s => s.id === server.id || (server.panel_server_id && s.panel_server_id === server.panel_server_id) || (server.order_id && s.order_id === server.order_id)
  );
  if (existingIdx >= 0) {
    serversStore[existingIdx] = { ...serversStore[existingIdx], ...server };
  } else {
    serversStore.unshift(server);
  }
  savePersistedData();
  return server;
}

export function getServerByIdFromStore(serverId) {
  return serversStore.find(s => s.id === serverId || String(s.panel_server_id) === String(serverId) || s.order_id === serverId) || null;
}

export function getServersFromStore(emailOrUid) {
  if (!emailOrUid) return [...serversStore];
  const query = emailOrUid.toLowerCase().trim();
  return serversStore.filter(s => 
    s.customer_email?.toLowerCase() === query ||
    s.owner_email?.toLowerCase() === query ||
    s.owner_uid === query
  );
}

export function getAllServersFromStore() {
  return [...serversStore];
}

export function updateServerStatusInStore(serverId, status, additionalDetails = {}) {
  const server = serversStore.find(
    s => s.id === serverId || String(s.panel_server_id) === String(serverId) || s.panel_uuid === serverId
  );
  if (server) {
    server.status = status;
    Object.assign(server, additionalDetails);
    server.updated_at = new Date().toISOString();
    savePersistedData();
  }
}

export function deleteServerFromStore(serverId) {
  if (!serverId) return;
  const idx = serversStore.findIndex(
    s => s.id === serverId || String(s.panel_server_id) === String(serverId) || s.order_id === serverId
  );
  if (idx >= 0) {
    serversStore.splice(idx, 1);
    savePersistedData();
  }
}

// ================= ADMIN USERS =================
export function getAdminUsersFromStore() {
  return adminUsersStore.filter(a => a.is_active !== false);
}

export function addAdminUserToStore(email, createdBy = 'system') {
  const cleanEmail = email.toLowerCase().trim();
  const existing = adminUsersStore.find(a => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.is_active = true;
    savePersistedData();
    return existing;
  }
  const newAdmin = {
    id: `adm_${Date.now()}`,
    email: cleanEmail,
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    created_by: createdBy
  };
  adminUsersStore.push(newAdmin);
  savePersistedData();
  return newAdmin;
}

export function removeAdminUserFromStore(email) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = adminUsersStore.find(a => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    if (existing.role === 'owner') {
      throw new Error('Cannot remove primary owner admin privileges');
    }
    existing.is_active = false;
    savePersistedData();
    return true;
  }
  return false;
}

// ================= WEBHOOK IDEMPOTENCY =================
export function isWebhookEventProcessed(eventId) {
  if (!eventId) return false;
  return webhookEventsStore.some(e => e.id === eventId);
}

export function recordWebhookEvent(event) {
  if (!event || !event.id) return;
  if (!webhookEventsStore.some(e => e.id === event.id)) {
    webhookEventsStore.unshift({
      id: event.id,
      event: event.event,
      created_at: new Date().toISOString()
    });
    // keep last 500 events
    if (webhookEventsStore.length > 500) {
      webhookEventsStore.length = 500;
    }
    savePersistedData();
  }
}

// ================= INVOICES =================
export function addInvoiceToStore(invoice) {
  invoicesStore.unshift(invoice);
  savePersistedData();
  return invoice;
}

export function getInvoiceByOrderId(orderId) {
  return invoicesStore.find(inv => inv.order_id === orderId) || null;
}

export function getAllInvoicesFromStore() {
  return [...invoicesStore];
}

// ================= PRODUCT OVERRIDES =================
export function setProductPriceOverride(planId, price) {
  productOverridesStore[planId] = {
    price: Number(price),
    updated_at: new Date().toISOString()
  };
  savePersistedData();
  return productOverridesStore[planId];
}

export function getProductPriceOverrides() {
  return { ...productOverridesStore };
}
