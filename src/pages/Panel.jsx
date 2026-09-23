import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyServers, sendServerAction } from '../services/api';
import { Server, Settings, Cpu, HardDrive, Zap, RefreshCw, AlertTriangle, Play, Square, RotateCw, ExternalLink, Trash2 } from 'lucide-react';

export default function Panel() {
  const { user, loading: authLoading } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [panelUnreachable, setPanelUnreachable] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [deleteModalServer, setDeleteModalServer] = useState(null);

  const loadServers = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchMyServers();
      setServers(res.servers || []);
      setPanelUnreachable(Boolean(res.panelUnreachable));
    } catch (err) {
      console.error('Failed to fetch panel servers:', err);
      if (!isSilent) {
        setErrorMsg(err.message || 'Failed to load servers from panel.agcloud.fun');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadServers(false);
      const interval = setInterval(() => {
        loadServers(true);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleDeleteServer = async (serverId) => {
    setActionInProgress(serverId + '_delete');
    try {
      await sendServerAction(serverId, 'delete');
      setDeleteModalServer(null);
      await loadServers(true);
    } catch (err) {
      console.error('Failed to delete server:', err);
      setErrorMsg(err.message || 'Failed to delete server.');
    } finally {
      setActionInProgress(null);
    }
  };

  if (authLoading) {
    return <div className="page-loader">Loading AG Cloud Panel...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const renderStatusPill = (status) => {
    const s = (status || 'online').toLowerCase();
    if (s === 'online' || s === 'running' || s === 'active') {
      return <span className="status-pill online" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>● ONLINE</span>;
    }
    if (s === 'offline' || s === 'stopped') {
      return <span className="status-pill offline" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>● OFFLINE</span>;
    }
    if (s === 'starting') {
      return <span className="status-pill starting" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>● STARTING</span>;
    }
    if (s === 'stopping') {
      return <span className="status-pill stopping" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)' }}>● STOPPING</span>;
    }
    if (s === 'panel_unavailable') {
      return <span className="status-pill warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>● PANEL UNAVAILABLE</span>;
    }
    return <span className="status-pill unknown" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' }}>● UNKNOWN</span>;
  };

  return (
    <section className="section top-space">
      <div className="container">

        <div className="section-heading left" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge-subtitle">Customer Control Panel · panel.agcloud.fun</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Account / My Servers</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Real-time servers synced securely from panel.agcloud.fun for <strong>{user.email}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={() => loadServers(false)} className="secondary-btn small" title="Refresh Servers List">
              <RefreshCw size={15} /> Refresh
            </button>
            <Link className="primary-btn small glow-btn" to="/plans">
              + Deploy New Server
            </Link>
          </div>
        </div>

        {panelUnreachable && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.85rem 1.15rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <strong>Panel unavailable — unable to check status</strong>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.85rem 1.15rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {errorMsg}
          </div>
        )}

        <div className="servers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            <div className="glass-card text-center" style={{ padding: '3rem', color: '#94a3b8', gridColumn: '1 / -1' }}>
              <div className="spinner-ring" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', borderTopColor: '#38bdf8' }} />
              Syncing your servers from panel.agcloud.fun...
            </div>
          ) : servers.length === 0 ? (
            <div className="empty-box glass-card text-center" style={{ padding: '3.5rem 2rem', gridColumn: '1 / -1' }}>
              <Server size={44} className="text-muted" style={{ margin: '0 auto 1rem', color: '#64748b' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>No servers found on your account.</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                You do not have any Minecraft servers associated with <strong>{user.email}</strong> on panel.agcloud.fun.
              </p>
              <Link to="/plans" className="primary-btn small glow-btn">
                Browse Minecraft Hosting Plans
              </Link>
            </div>
          ) : (
            servers.map(server => (
              <article key={server.id || server.panel_server_id} className="server-card glass-card glow-border" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <span className="badge-subtitle" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                      NODE #{server.node_id || 1} · ID: {server.panel_server_id}
                    </span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                      {server.server_name}
                    </h2>
                  </div>
                  {renderStatusPill(server.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>RAM</span>
                    <strong style={{ color: '#38bdf8', fontSize: '0.92rem' }}>
                      {server.memory_used_mb !== undefined && server.memory_used_mb > 0
                        ? `${(server.memory_used_mb / 1024).toFixed(1)} / `
                        : ''}
                      {Math.round(server.memory_mb / 1024)} GB
                    </strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>DISK</span>
                    <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>
                      {server.disk_used_mb !== undefined && server.disk_used_mb > 0
                        ? `${(server.disk_used_mb / 1024).toFixed(1)} / `
                        : ''}
                      {Math.round(server.disk_mb / 1024)} GB
                    </strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>CPU</span>
                    <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>
                      {server.cpu_used_percent !== undefined && server.cpu_used_percent > 0
                        ? `${server.cpu_used_percent}% / `
                        : ''}
                      {server.cpu_percent}%
                    </strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Server Address (IP:Port):</span>
                    <code style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.95rem' }}>
                      {server.ip || '103.195.100.42'}:{server.port || 25565}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Plan Expiry:</span>
                    <strong style={{ color: '#10b981', fontWeight: 800, fontSize: '0.88rem' }}>
                      {server.expires_at ? `${new Date(server.expires_at).toLocaleDateString()} (${Math.max(0, Math.ceil((new Date(server.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)))} days)` : '30 Days'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href={
                      server.identifier && !server.identifier.includes('fallback')
                        ? `https://panel.agcloud.fun/server/${server.identifier}`
                        : server.panel_uuid && !server.panel_uuid.includes('fallback')
                        ? `https://panel.agcloud.fun/server/${server.panel_uuid}`
                        : 'https://panel.agcloud.fun'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-btn glow-btn small"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Settings size={15} /> Manage Server <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteModalServer(server)}
                    className="secondary-btn small"
                    style={{ background: 'rgba(225, 29, 72, 0.25)', color: '#fda4af', borderColor: 'rgba(225, 29, 72, 0.5)' }}
                    title="Delete Server"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {deleteModalServer && (
        <div className="payment-modal-overlay">
          <div className="glass-card text-center" style={{ maxWidth: '440px', width: '90%', padding: '1.75rem 1.5rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.75rem' }}>
              <AlertTriangle size={44} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Confirm Server Deletion</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Are you sure you want to delete server <strong>{deleteModalServer.server_name}</strong> (ID: <code>{deleteModalServer.panel_server_id}</code>)?
              <br /><strong style={{ color: '#f87171' }}>This will permanently remove the server from panel.agcloud.fun.</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="primary-btn glow-btn small"
                style={{ background: 'rgba(225, 29, 72, 0.8)', borderColor: '#e11d48' }}
                disabled={Boolean(actionInProgress)}
                onClick={() => handleDeleteServer(deleteModalServer.id || deleteModalServer.panel_server_id)}
              >
                {actionInProgress ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setDeleteModalServer(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
