import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { fetchMyOrders, fetchMyServers, sendServerAction } from '../services/api';
import { ShoppingBag, Server, Settings, Play, Square, RotateCw, Cpu, HardDrive, Zap, Globe, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState([]);
  const [servers, setServers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadUserData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [ordersRes, serversRes] = await Promise.all([
        fetchMyOrders().catch(() => ({ orders: [] })),
        fetchMyServers().catch(() => ({ servers: [] }))
      ]);
      setOrders(ordersRes.orders || []);
      setServers(serversRes.servers || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleServerAction = async (serverId, action) => {
    setActionInProgress(serverId + '_' + action);
    setActionError('');
    try {
      await sendServerAction(serverId, action);
      await loadUserData();
    } catch (err) {
      setActionError(err.message || `Failed to ${action} server`);
    } finally {
      setActionInProgress(null);
    }
  };

  if (authLoading) {
    return <div className="page-loader">Loading Dashboard...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'AG')}&background=0284c7&color=ffffff&bold=true`;

  return (
    <section className="section top-space">
      <div className="container">

        <div className="profile-card glass-card glow-border">
          <img
            className="profile-avatar"
            src={user.photoURL || defaultAvatar(user.displayName)}
            alt={user.displayName}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = defaultAvatar(user.displayName);
            }}
          />
          <div className="profile-info">
            <span className="badge-subtitle">Verified Google Account</span>
            <h1>{user.displayName}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="dashboard-head mt-5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Minecraft Servers</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Active servers linked to your verified Firebase account.</p>
          </div>
          <Link className="primary-btn small glow-btn" to="/plans">
            + Deploy New Server
          </Link>
        </div>

        {actionError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
            {actionError}
          </div>
        )}

        <div className="servers-grid mb-5" style={{ display: 'grid', gap: '1.25rem' }}>
          {loadingData ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading servers...
            </div>
          ) : servers.length === 0 ? (
            <div className="empty-box glass-card">
              <Server size={32} className="text-muted" />
              <p>No active Minecraft servers provisioned yet.</p>
              <Link to="/plans" className="primary-btn small glow-btn">
                Browse Minecraft Plans
              </Link>
            </div>
          ) : (
            servers.map(server => (
              <article key={server.id} className="server-card glass-card glow-border" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="badge-subtitle" style={{ fontSize: '0.75rem' }}>Pterodactyl Node #{server.node_id || 1}</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{server.server_name}</h3>
                  </div>
                  <span className={`status-pill ${server.status || 'active'}`} style={{ textTransform: 'capitalize' }}>
                    ● {server.status || 'online'}
                  </span>
                </div>

                <div className="server-details-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Server Connection IP:</span>
                    <code style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {server.ip || '103.195.100.42'}:{server.port || 25565}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>RAM Memory:</span>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{Math.round(server.memory_mb / 1024)} GB RAM</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Disk Storage:</span>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{Math.round(server.disk_mb / 1024)} GB NVMe</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Plan Expiry:</span>
                    <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>
                      {server.expires_at ? `${new Date(server.expires_at).toLocaleDateString()} (${Math.max(0, Math.ceil((new Date(server.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)))} days left)` : '30 Days Remaining'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={server.identifier || server.panel_uuid || server.panel_server_id ? `https://panel.agcloud.fun/server/${server.identifier || server.panel_uuid || server.panel_server_id}` : 'https://panel.agcloud.fun'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-btn small glow-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                  >
                    <Settings size={14} /> Manage Server
                  </a>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="dashboard-head" style={{ marginTop: '2.5rem' }}>
          <h2>Purchase History</h2>
        </div>

        <div className="order-list">
          {loadingData ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading history...
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-box glass-card">
              <ShoppingBag size={32} className="text-muted" />
              <p>No orders submitted yet.</p>
              <Link to="/plans" className="primary-btn small glow-btn">
                Explore Hosting Plans
              </Link>
            </div>
          ) : (
            orders.map(order => (
              <article key={order.id} className="order-row glass-card">
                <div className="order-main">
                  <strong className="plan-title">{order.plan_name || order.planName}</strong>
                  <span className="order-sub">Order #{order.id.slice(0, 8)}</span>
                  <div className="order-meta">
                    <span>Payer: <strong>{order.user_name || order.userName}</strong></span>
                    <span>UPI: <code>{order.upi_id || 'UPI Collect'}</code></span>
                  </div>
                </div>
                <div className="order-side">
                  <span className="price-tag">{formatPrice(order.amount)}</span>
                  <span className={`status-pill ${order.payment_status || order.status}`}>{order.payment_status || order.status}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
