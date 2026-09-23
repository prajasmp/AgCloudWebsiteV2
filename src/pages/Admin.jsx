import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  fetchAdminOrders,
  fetchAdminServers,
  fetchAdminMetrics,
  sendAdminServerAction,
  fetchAdminUsersList,
  fetchAdminInfrastructure,
  fetchAdminAdminUsers,
  addAdminUser,
  removeAdminUser,
  approveOrRejectOrder,
  clearAllAdminOrders,
  deleteAdminOrder
} from '../services/api';
import {
  ShieldCheck, CheckCircle, XCircle, Play, Square, RotateCw,
  PauseCircle, PlayCircle, Trash2, AlertTriangle, RefreshCw, Server,
  ShoppingBag, Users, Activity, Settings, Eye, Zap, UserPlus, ShieldAlert,
  Cpu, HardDrive, Layers, CreditCard, Check, X, FileText, ExternalLink
} from 'lucide-react';

export default function Admin({ mode }) {
  const { isAdmin, isPrimaryOwner, loading: authLoading, user } = useAuth();
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();

  const isEmailsMode = mode === 'emails' || window.location.pathname.includes('admin-emails') || searchParams.get('tab') === 'admins';

  const [orders, setOrders] = useState([]);
  const [servers, setServers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [infrastructure, setInfrastructure] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [revokingAdmin, setRevokingAdmin] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [orderFilter, setOrderFilter] = useState('all');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [deleteModalServer, setDeleteModalServer] = useState(null);

  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState(null);
  const [showClearPaymentsModal, setShowClearPaymentsModal] = useState(false);
  const [clearingPayments, setClearingPayments] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClearAllPayments = async () => {
    setClearingPayments(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await clearAllAdminOrders();
      setSuccessMsg(res.message || 'All submitted payment orders cleared successfully.');
      setShowClearPaymentsModal(false);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to clear payment orders.');
    } finally {
      setClearingPayments(false);
    }
  };

  const loadAdminData = async () => {
    if (!isAdmin || !user) return;
    setLoadingData(true);
    setErrorMsg('');
    try {
      const [ordersRes, serversRes, metricsRes, usersRes, infraRes, adminsRes] = await Promise.all([
        fetchAdminOrders().catch(() => ({ orders: [] })),
        fetchAdminServers().catch(() => ({ servers: [] })),
        fetchAdminMetrics().catch(() => ({ metrics: null })),
        fetchAdminUsersList().catch(() => ({ users: [] })),
        fetchAdminInfrastructure().catch(() => ({ infrastructure: null })),
        fetchAdminAdminUsers().catch(() => ({ adminUsers: [] }))
      ]);

      setOrders(ordersRes.orders || []);
      setServers(serversRes.servers || []);
      setMetrics(metricsRes.metrics || null);
      setUsersList(usersRes.users || []);
      setInfrastructure(infraRes.infrastructure || null);
      setAdminUsers(adminsRes.adminUsers || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setErrorMsg('Failed to load admin data. Verify backend authorization.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin && user) {
      loadAdminData();
    }
  }, [isAdmin, user]);

  const handleAdminAction = async (serverId, action) => {
    setActionInProgress(serverId + '_' + action);
    setErrorMsg('');
    try {
      await sendAdminServerAction(serverId, action);
      await loadAdminData();
      if (action === 'delete') {
        setDeleteModalServer(null);
      }
    } catch (err) {
      setErrorMsg(err.message || `Failed to perform ${action} action`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveOrder = async (orderId) => {
    setActionInProgress(orderId + '_approve');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await approveOrRejectOrder(orderId, 'approve');
      setSuccessMsg(res.message || 'Order approved and server provisioned successfully.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve order.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderId}?`)) return;
    setActionInProgress(orderId + '_delete');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await deleteAdminOrder(orderId);
      setSuccessMsg(res.message || `Order ${orderId} deleted successfully.`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete order.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmRejectOrder = async (e) => {
    e.preventDefault();
    if (!rejectModalOrder) return;
    if (!rejectionReasonInput || !rejectionReasonInput.trim()) {
      setErrorMsg('Rejection reason is mandatory when rejecting an order.');
      return;
    }

    const targetOrderId = rejectModalOrder.id;
    setActionInProgress(targetOrderId + '_reject');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await approveOrRejectOrder(targetOrderId, 'reject', rejectionReasonInput.trim());
      setSuccessMsg(res.message || 'Order rejected.');
      setRejectModalOrder(null);
      setRejectionReasonInput('');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject order.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      setErrorMsg('Enter a valid email address');
      return;
    }
    setAddingAdmin(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await addAdminUser(newAdminEmail);
      setSuccessMsg(res.message || `Admin privileges granted to ${newAdminEmail}`);
      setNewAdminEmail('');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add admin user');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (emailOrId) => {
    setRevokingAdmin(emailOrId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await removeAdminUser(emailOrId);
      setSuccessMsg(res.message || 'Admin authorization revoked.');
      setAdminUsers(prev => prev.filter(a => a.email.toLowerCase() !== emailOrId.toLowerCase() && a.id !== emailOrId));
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke admin authorization');
    } finally {
      setRevokingAdmin(null);
    }
  };

  if (authLoading) {
    return <div className="page-loader">Loading Admin Console...</div>;
  }

  if (!isAdmin || !user) {
    return <Navigate to="/" replace />;
  }

  const filteredOrders = orders.filter(o => {
    const status = (o.payment_status || o.status || 'PENDING').toUpperCase();
    if (orderFilter === 'all') return true;
    if (orderFilter === 'PENDING') return status === 'PENDING' || status === 'PROCESSING' || status === 'WAITING';
    if (orderFilter === 'APPROVED') return status === 'APPROVED' || status === 'PAID' || status === 'ADMIN_BYPASS';
    if (orderFilter === 'REJECTED') return status === 'REJECTED' || status === 'FAILED' || status === 'EXPIRED';
    return true;
  });

  return (
    <section className="section top-space">
      <div className="container">

        <div className="section-heading left" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge-subtitle">
              {isEmailsMode ? 'Admin Access Control' : 'Orders & Payments Review'}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {isEmailsMode ? 'Admin Emails Management' : 'AG Cloud Admin Console'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Logged in as: <strong>{user.email}</strong> {isPrimaryOwner && <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.4rem' }}>Primary Owner</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={loadAdminData} className="secondary-btn small">
              <RefreshCw size={15} /> Refresh List
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {successMsg}
          </div>
        )}

        {!isEmailsMode && metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div className="glass-card glow-border" style={{ padding: '1.15rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Submitted Orders</span>
              <strong style={{ fontSize: '1.6rem', color: '#38bdf8', fontWeight: 900 }}>{orders.length}</strong>
            </div>
            <div className="glass-card glow-border" style={{ padding: '1.15rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Pending Review</span>
              <strong style={{ fontSize: '1.6rem', color: '#facc15', fontWeight: 900 }}>
                {orders.filter(o => (o.payment_status || 'PENDING').toUpperCase() === 'PENDING').length}
              </strong>
            </div>
            <div className="glass-card glow-border" style={{ padding: '1.15rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Approved Orders</span>
              <strong style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>
                {orders.filter(o => ['APPROVED', 'PAID', 'ADMIN_BYPASS'].includes((o.payment_status || '').toUpperCase())).length}
              </strong>
            </div>
            <div className="glass-card glow-border" style={{ padding: '1.15rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Total Servers</span>
              <strong style={{ fontSize: '1.6rem', color: '#f8fafc', fontWeight: 900 }}>{metrics.totalServers}</strong>
            </div>
          </div>
        )}

        {!isEmailsMode && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`preset-pill ${orderFilter === f ? 'active-exact' : ''}`}
                    onClick={() => setOrderFilter(f)}
                    style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}
                  >
                    {f === 'all' ? 'All Payments' : f}
                  </button>
                ))}
              </div>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearPaymentsModal(true)}
                  className="secondary-btn small"
                  style={{ background: 'rgba(225, 29, 72, 0.2)', color: '#fda4af', borderColor: 'rgba(225, 29, 72, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} /> Delete All Payments
                </button>
              )}
            </div>

            <div className="admin-list admin-orders-grid">
              {loadingData ? (
                <div className="glass-card text-center" style={{ padding: '2rem', color: '#94a3b8', gridColumn: '1 / -1' }}>Loading submitted payments...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="empty-box glass-card text-center" style={{ padding: '2rem', gridColumn: '1 / -1' }}>No submitted orders found matching filter.</div>
              ) : (
                filteredOrders.map(order => {
                  const status = (order.payment_status || order.status || 'PENDING').toUpperCase();
                  const isPending = status === 'PENDING' || status === 'PROCESSING' || status === 'WAITING';
                  const isApproved = status === 'APPROVED' || status === 'PAID' || status === 'ADMIN_BYPASS';
                  const isRejected = status === 'REJECTED';

                  return (
                    <article key={order.id} className="admin-order glass-card glow-border" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                            <span className="badge-subtitle" style={{ fontSize: '0.72rem' }}>ID: {order.id}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.2, wordBreak: 'break-word' }}>
                            {order.plan_name || order.planName}
                            {(order.server_name || order.serverName) ? (
                              <span style={{ color: '#38bdf8', fontWeight: 700, marginLeft: '0.35rem' }}>
                                ({order.server_name || order.serverName})
                              </span>
                            ) : null}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          {isPending && (
                            <span className="status-pill warning" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem' }}>
                              ● PENDING
                            </span>
                          )}
                          {isApproved && (
                            <span className="status-pill active" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem' }}>
                              ● APPROVED
                            </span>
                          )}
                          {isRejected && (
                            <span className="status-pill error" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem' }}>
                              ● REJECTED
                            </span>
                          )}

                          <button
                            type="button"
                            className="order-delete-btn"
                            disabled={actionInProgress === order.id + '_delete'}
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Delete this order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Customer Name:</span><strong style={{ color: '#f8fafc' }}>{order.user_name || order.userName || 'N/A'}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Amount:</span><strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{formatPrice(order.amount)}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Customer Email:</span><strong style={{ wordBreak: 'break-all', color: '#38bdf8' }}>{order.user_email || order.contact_email || 'N/A'}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Mobile Number:</span><strong>{order.mobile || 'N/A'}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Duration:</span><strong style={{ color: '#f8fafc' }}>{order.duration || '1 Month'}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Custom Server Name:</span><strong style={{ color: '#38bdf8' }}>{order.server_name || order.serverName || 'Default Server'}</strong></div>
                      </div>

                      {isRejected && order.rejection_reason && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <strong>Reason:</strong> {order.rejection_reason}
                        </div>
                      )}

                      {order.payment_proof && (
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.6rem 0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={order.payment_proof}
                              alt="Proof"
                              style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #38bdf8' }}
                              onClick={() => setPreviewScreenshotUrl(order.payment_proof)}
                            />
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Proof Uploaded</span>
                          </div>
                          <button
                            type="button"
                            className="secondary-btn small"
                            onClick={() => setPreviewScreenshotUrl(order.payment_proof)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            <Eye size={12} /> View Screenshot
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              disabled={actionInProgress === order.id + '_approve'}
                              onClick={() => handleApproveOrder(order.id)}
                              className="primary-btn glow-btn small"
                              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderColor: '#10b981', padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flex: 1, justifyContent: 'center' }}
                            >
                              <Check size={14} /> {actionInProgress === order.id + '_approve' ? 'Approving...' : 'APPROVE'}
                            </button>
                            <button
                              type="button"
                              disabled={actionInProgress === order.id + '_reject'}
                              onClick={() => {
                                setRejectModalOrder(order);
                                setRejectionReasonInput('');
                              }}
                              className="secondary-btn small"
                              style={{ background: 'rgba(225, 29, 72, 0.25)', color: '#fda4af', borderColor: 'rgba(225, 29, 72, 0.5)', padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flex: 1, justifyContent: 'center' }}
                            >
                              <X size={14} /> REJECT
                            </button>
                          </>
                        ) : isApproved ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Approved & Server Created
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={14} /> Payment Rejected
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'servers' && (
          <div className="admin-list" style={{ display: 'grid', gap: '1.25rem' }}>
            {loadingData ? (
              <div className="glass-card text-center" style={{ padding: '2rem', color: '#94a3b8' }}>Loading customer servers...</div>
            ) : servers.length === 0 ? (
              <div className="empty-box glass-card text-center" style={{ padding: '2rem' }}>No Minecraft servers found.</div>
            ) : (
              servers.map(server => (
                <article key={server.id} className="admin-order glass-card glow-border" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="badge-subtitle" style={{ fontSize: '0.75rem' }}>Panel Server ID: {server.panel_server_id}</span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{server.server_name}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        Customer Email: <strong>{server.owner_email || server.user_email}</strong> · Firebase UID: <code>{server.owner_uid?.slice(0, 12)}...</code>
                      </p>
                    </div>
                    <span className={`status-pill ${server.status || 'active'}`} style={{ textTransform: 'capitalize' }}>
                      ● {server.status || 'online'}
                    </span>
                  </div>

                  <div className="server-details-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748b' }}>IP:Port:</span> <code>{server.ip}:{server.port}</code></div>
                    <div><span style={{ color: '#64748b' }}>RAM Limit:</span> <strong>{Math.round((server.memory_mb || 2048) / 1024)} GB</strong></div>
                    <div><span style={{ color: '#64748b' }}>Disk Limit:</span> <strong>{Math.round((server.disk_mb || 10240) / 1024)} GB</strong></div>
                    <div><span style={{ color: '#64748b' }}>CPU Limit:</span> <strong>{server.cpu_percent || 200}%</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <a
                      href={`https://panel.agcloud.fun/server/${server.identifier || server.panel_uuid || server.panel_server_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary-btn small glow-btn"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', textDecoration: 'none' }}
                    >
                      <Eye size={14} /> Open on panel.agcloud.fun
                    </a>
                    <button
                      disabled={actionInProgress === server.id + '_start'}
                      onClick={() => handleAdminAction(server.id, 'start')}
                      className="secondary-btn small"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <Play size={14} /> Start
                    </button>
                    <button
                      disabled={actionInProgress === server.id + '_restart'}
                      onClick={() => handleAdminAction(server.id, 'restart')}
                      className="secondary-btn small"
                      style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    >
                      <RotateCw size={14} /> Restart
                    </button>
                    <button
                      disabled={actionInProgress === server.id + '_stop'}
                      onClick={() => handleAdminAction(server.id, 'stop')}
                      className="secondary-btn small"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      <Square size={14} /> Stop
                    </button>
                    <button
                      onClick={() => setDeleteModalServer(server)}
                      className="secondary-btn small"
                      style={{ background: 'rgba(225, 29, 72, 0.25)', color: '#fda4af', borderColor: 'rgba(225, 29, 72, 0.5)', marginLeft: 'auto' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {isEmailsMode && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>

            <div className="glass-card glow-border" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <UserPlus size={20} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Add New Admin Email</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Enter an email address below to grant full Admin privileges. Any added admin email will get immediate access to this Admin Console.
              </p>

              <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '0.75rem', maxWidth: '560px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Enter email address (e.g. admin@example.com)"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '240px' }}
                  required
                />
                <button
                  type="submit"
                  className="primary-btn glow-btn small"
                  disabled={addingAdmin}
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  <UserPlus size={16} /> {addingAdmin ? 'Adding Admin...' : 'Add Admin Email'}
                </button>
              </form>
            </div>

            <div className="glass-card glow-border" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={20} style={{ color: '#34d399' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Authorized Admin Emails</h3>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Total: <strong>{adminUsers.length}</strong></span>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {adminUsers.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>No admin emails configured.</div>
                ) : (
                  adminUsers.map(adm => {
                    const isOwnerRecord = adm.role === 'owner' || adm.email.toLowerCase() === 'r26377269@gmail.com';
                    return (
                      <div key={adm.id || adm.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.9rem 1.15rem', borderRadius: '8px', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <strong style={{ color: '#f8fafc', fontSize: '0.98rem' }}>{adm.email}</strong>
                          {isOwnerRecord ? (
                            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Primary Owner
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Admin
                            </span>
                          )}
                        </div>

                        {!isOwnerRecord && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(adm.email)}
                            disabled={revokingAdmin === adm.email}
                            className="secondary-btn small"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 size={14} /> {revokingAdmin === adm.email ? 'Deleting...' : 'Delete Admin Email'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {rejectModalOrder && (
        <div className="payment-modal-overlay">
          <div className="glass-card" style={{ maxWidth: '460px', width: '92%', padding: '1.75rem 1.5rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.75rem', textAlign: 'center' }}>
              <XCircle size={44} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem', textAlign: 'center' }}>
              Reject Order #{rejectModalOrder.id}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              You must enter a reason for rejecting this payment order. The reason will be visible to the customer when tracking their order.
            </p>

            <form onSubmit={handleConfirmRejectOrder}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Invalid payment screenshot, transaction ID not found, incorrect amount transferred."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ffffff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="primary-btn glow-btn small"
                  style={{ background: 'rgba(225, 29, 72, 0.85)', borderColor: '#e11d48' }}
                  disabled={actionInProgress === rejectModalOrder.id + '_reject'}
                >
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={() => setRejectModalOrder(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewScreenshotUrl && (
        <div className="payment-modal-overlay" onClick={() => setPreviewScreenshotUrl(null)}>
          <div className="glass-card text-center" style={{ maxWidth: '640px', width: '92%', padding: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="ghost-btn"
              style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#ffffff' }}
              onClick={() => setPreviewScreenshotUrl(null)}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
              Payment Proof Screenshot
            </h3>
            <div style={{ maxHeight: '75vh', overflowY: 'auto', background: '#000', borderRadius: '8px', padding: '0.5rem' }}>
              <img
                src={previewScreenshotUrl}
                alt="Full resolution payment proof"
                style={{ width: '100%', height: 'auto', borderRadius: '4px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

      {showClearPaymentsModal && (
        <div className="payment-modal-overlay">
          <div className="glass-card text-center" style={{ maxWidth: '440px', width: '92%', padding: '1.75rem 1.5rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.75rem' }}>
              <AlertTriangle size={44} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Clear All Payment History</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Are you sure you want to delete ALL submitted payment orders from the database and memory store?
              <br /><strong style={{ color: '#f87171' }}>This action cannot be undone.</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="primary-btn glow-btn small"
                style={{ background: 'rgba(225, 29, 72, 0.85)', borderColor: '#e11d48' }}
                disabled={clearingPayments}
                onClick={handleClearAllPayments}
              >
                {clearingPayments ? 'Deleting...' : 'Yes, Delete All'}
              </button>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setShowClearPaymentsModal(false)}
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
