import React, { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../data/plans';
import {
  fetchAdminOrders,
  fetchAdminServers,
  fetchAdminMetrics,
  fetchAdminProducts,
  updateAdminProductPrice,
  fetchAdminSettings,
  retryAdminDeployment,
  sendAdminServerAction,
  fetchAdminUsersList,
  fetchAdminAdminUsers,
  addAdminUser,
  removeAdminUser,
  deleteAdminOrder,
  fetchAdminWebHosting,
  manageAdminWebHosting,
  fetchAdminVds,
  manageAdminVds
} from '../services/api';
import NovexLogo from '../components/NovexLogo';
import {
  ShieldCheck, CheckCircle, XCircle, Play, Square, RotateCw,
  Trash2, AlertTriangle, RefreshCw, Server,
  ShoppingBag, Users, Activity, Settings, Eye, Zap, UserPlus, ShieldAlert,
  Cpu, HardDrive, Layers, CreditCard, Check, X, FileText, ExternalLink,
  Search, DollarSign, ArrowUpRight, Lock, Mail, Globe, Sparkles, Sliders
} from 'lucide-react';

export default function Admin({ mode }) {
  const { isAdmin, isPrimaryOwner, loading: authLoading, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || (mode === 'emails' ? 'admins' : 'dashboard');
  const [activeTab, setActiveTab] = useState(currentTab);

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [servers, setServers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [webAccounts, setWebAccounts] = useState([]);
  const [whmConfig, setWhmConfig] = useState(null);
  const [vdsMachines, setVdsMachines] = useState([]);
  const [vdsRecords, setVdsRecords] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Edit price state
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlanPrice, setNewPlanPrice] = useState('');

  // Admin emails state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadAdminData = async () => {
    if (!isAdmin || !user) return;
    setLoadingData(true);
    setErrorMsg('');

    try {
      const [ordersRes, serversRes, metricsRes, productsRes, settingsRes, adminsRes, webRes, vdsRes] = await Promise.all([
        fetchAdminOrders().catch(() => ({ orders: [] })),
        fetchAdminServers().catch(() => ({ servers: [] })),
        fetchAdminMetrics().catch(() => ({ metrics: null })),
        fetchAdminProducts().catch(() => ({ products: [] })),
        fetchAdminSettings().catch(() => ({ settings: null })),
        fetchAdminAdminUsers().catch(() => ({ adminUsers: [] })),
        fetchAdminWebHosting().catch(() => ({ accounts: [], whmConfig: null })),
        fetchAdminVds().catch(() => ({ machines: [], vdsRecords: [] }))
      ]);

      setOrders(ordersRes.orders || []);
      setServers(serversRes.servers || []);
      setMetrics(metricsRes.metrics || null);
      setProducts(productsRes.products || []);
      setSettings(settingsRes.settings || null);
      setAdminUsers(adminsRes.adminUsers || []);
      setWebAccounts(webRes.accounts || []);
      setWhmConfig(webRes.whmConfig || null);
      setVdsMachines(vdsRes.machines || []);
      setVdsRecords(vdsRes.vdsRecords || []);
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

  // Retry server deployment action
  const handleRetryDeployment = async (orderId) => {
    setActionInProgress(`retry_${orderId}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await retryAdminDeployment(orderId);
      setSuccessMsg(res.message || `Server deployed for order ${orderId}`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Retry deployment failed');
    } finally {
      setActionInProgress(null);
    }
  };

  // Server management actions
  const handleServerAction = async (serverId, action) => {
    setActionInProgress(`server_${serverId}_${action}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendAdminServerAction(serverId, action);
      setSuccessMsg(`Server action '${action}' dispatched.`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || `Failed to perform ${action}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Product price update
  const handleSaveProductPrice = async (e) => {
    e.preventDefault();
    if (!editingPlan || !newPlanPrice) return;

    setActionInProgress(`save_price_${editingPlan.id}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateAdminProductPrice(editingPlan.id, Number(newPlanPrice));
      setSuccessMsg(`Price for ${editingPlan.name} updated to ₹${newPlanPrice}`);
      setEditingPlan(null);
      setNewPlanPrice('');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update price');
    } finally {
      setActionInProgress(null);
    }
  };

  // Web Hosting actions
  const handleToggleWebHostingAccount = async (username, accountId, currentStatus) => {
    const action = currentStatus === 'active' ? 'suspend' : 'unsuspend';
    setActionInProgress(`web_${accountId}_${action}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await manageAdminWebHosting({ action, username, accountId });
      setSuccessMsg(`Web Hosting account ${username} ${action}ed.`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${action} account`);
    } finally {
      setActionInProgress(null);
    }
  };

  // VDS Machine actions
  const handleUpdateMachineStatus = async (machineId, status) => {
    setActionInProgress(`vds_${machineId}_${status}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await manageAdminVds({ action: 'update_machine', machineId, status });
      setSuccessMsg(`Physical machine ${machineId} status updated to ${status}.`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update machine');
    } finally {
      setActionInProgress(null);
    }
  };

  // Admin user management
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
      const res = await addAdminUser(newAdminEmail.trim());
      setSuccessMsg(res.message || `Admin privileges granted to ${newAdminEmail}`);
      setNewAdminEmail('');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add admin user');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email) => {
    if (!window.confirm(`Remove admin privileges for ${email}?`)) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await removeAdminUser(email);
      setSuccessMsg(`Admin privileges revoked for ${email}`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove admin user');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={32} className="spin-loader" style={{ color: '#00f2fe' }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#081426', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: '480px' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Admin Access Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            You must be an authorized NOVEXHOST administrator to access this management dashboard.
          </p>
          <Link to="/" style={{ padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 700, borderRadius: '10px', textDecoration: 'none' }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const s = `${o.id} ${o.user_name} ${o.user_email} ${o.plan_name} ${o.razorpay_payment_id || ''}`.toLowerCase();
    const matchesSearch = s.includes(orderSearchQuery.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || 
      (orderStatusFilter === 'paid' && (o.payment_status === 'PAID' || o.payment_status === 'APPROVED')) ||
      (orderStatusFilter === 'pending' && (o.payment_status === 'PENDING')) ||
      (orderStatusFilter === 'failed' && (o.provisioning_status === 'failed' || o.payment_status === 'FAILED'));
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ minHeight: '90vh', padding: '2.5rem 1rem', background: '#030712' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NovexLogo size={36} showText={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                  NOVEXHOST Admin Console
                </h1>
                <span style={{ background: 'rgba(0, 242, 254, 0.15)', border: '1px solid rgba(0, 242, 254, 0.4)', color: '#00f2fe', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  v2.0
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Signed in as <strong style={{ color: '#00f2fe' }}>{user.email}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={loadAdminData}
            disabled={loadingData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#00f2fe', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
          >
            <RefreshCw size={14} className={loadingData ? 'spin-loader' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', paddingBottom: '12px', marginBottom: '2rem', overflowX: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: Activity },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'webhosting', label: `Web Hosting (${webAccounts.length})`, icon: Globe },
            { id: 'vds', label: `VDS Machines (${vdsMachines.length})`, icon: Cpu },
            { id: 'products', label: 'Product Pricing', icon: Zap },
            { id: 'servers', label: `Active Servers (${servers.length})`, icon: Server },
            { id: 'payments', label: 'Razorpay Payments', icon: CreditCard },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'admins', label: 'Admin Team', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #00f2fe' : '1px solid transparent',
                  background: isActive ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#00f2fe' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {formatINR(metrics?.totalRevenue || 0)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '4px', display: 'block' }}>Verified INR payments</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Orders</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {metrics?.totalOrders || orders.length}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Placed without login</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Successful Payments</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#34d399', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {metrics?.successfulPayments || 0}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '4px', display: 'block' }}>Captured via Razorpay</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Payments</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#facc15', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {metrics?.pendingPayments || 0}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#facc15', marginTop: '4px', display: 'block' }}>Awaiting checkout</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Servers</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {metrics?.activeServers || servers.length}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '4px', display: 'block' }}>Running on Pterodactyl</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Failed Deployments</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ef4444', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {metrics?.failedDeployments || 0}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '4px', display: 'block' }}>Retryable with 1-click</span>
              </div>

              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Web Hosting Accounts</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {webAccounts.length}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '4px', display: 'block' }}>cPanel Web Hosting</span>
              </div>

              <div style={{ background: '#081426', border: '2px solid rgba(0, 242, 254, 0.3)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>VDS Bare-Metal Fleet</span>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                  {vdsMachines.length}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '4px', display: 'block' }}>AMD &amp; Intel Bare-Metal</span>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: '#00f2fe' }} /> Recent Transactions
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 12px' }}>Order ID</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Plan</th>
                      <th style={{ padding: '10px 12px' }}>Amount</th>
                      <th style={{ padding: '10px 12px' }}>Payment</th>
                      <th style={{ padding: '10px 12px' }}>Deployment</th>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics?.recentTransactions || orders.slice(0, 8)).map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#00f2fe', fontWeight: 600 }}>{tx.id}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#fff', fontWeight: 600, display: 'block' }}>{tx.userName || 'Customer'}</span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{tx.userEmail}</span>
                        </td>
                        <td style={{ padding: '12px' }}>{tx.planName}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>{formatINR(tx.amount)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: tx.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: tx.paymentStatus === 'PAID' ? '#34d399' : '#facc15' }}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: tx.provisioningStatus === 'active' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: tx.provisioningStatus === 'active' ? '#00f2fe' : '#94a3b8' }}>
                            {tx.provisioningStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.82rem' }}>
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ORDERS ================= */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by ID, name, email..."
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 36px', background: '#081426', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  style={{ padding: '0.65rem 1rem', background: '#081426', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="all">All Orders</option>
                  <option value="paid">Paid Only</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed / Delayed</option>
                </select>
              </div>

              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
            </div>

            {/* Orders Table */}
            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#050c18', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Order Ref</th>
                      <th style={{ padding: '12px 14px' }}>Customer Contact</th>
                      <th style={{ padding: '12px 14px' }}>Plan</th>
                      <th style={{ padding: '12px 14px' }}>Amount</th>
                      <th style={{ padding: '12px 14px' }}>Razorpay Payment</th>
                      <th style={{ padding: '12px 14px' }}>Deployment Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No orders found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px', fontFamily: 'monospace', color: '#00f2fe', fontWeight: 600 }}>
                            {order.id}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontFamily: 'sans-serif' }}>
                              {order.server_name || 'Standard'}
                            </span>
                          </td>

                          <td style={{ padding: '14px' }}>
                            <strong style={{ color: '#ffffff', display: 'block' }}>{order.user_name || 'Customer'}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>{order.user_email || order.contact_email}</span>
                            {order.mobile && (
                              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>+91 {order.mobile}</span>
                            )}
                          </td>

                          <td style={{ padding: '14px' }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{order.plan_name || order.plan_id}</span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                              {order.server_region || 'Mumbai'}
                            </span>
                          </td>

                          <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                            {formatINR(order.amount)}
                          </td>

                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: order.payment_status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: order.payment_status === 'PAID' ? '#34d399' : '#facc15' }}>
                              {order.payment_status}
                            </span>
                            {order.razorpay_payment_id && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                {order.razorpay_payment_id}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: order.provisioning_status === 'active' ? 'rgba(0, 242, 254, 0.2)' : order.provisioning_status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: order.provisioning_status === 'active' ? '#00f2fe' : order.provisioning_status === 'failed' ? '#fca5a5' : '#94a3b8' }}>
                              {order.provisioning_status?.toUpperCase() || 'QUEUED'}
                            </span>
                            {order.panel_server_id && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#00f2fe', fontFamily: 'monospace', marginTop: '2px' }}>
                                Panel ID: #{order.panel_server_id}
                              </span>
                            )}
                            {order.deployment_error && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.deployment_error}>
                                Error: {order.deployment_error}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              {/* Retry deployment button if failed or pending with verified payment */}
                              {(order.provisioning_status === 'failed' || (order.payment_status === 'PAID' && order.provisioning_status !== 'active')) && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryDeployment(order.id)}
                                  disabled={actionInProgress === `retry_${order.id}`}
                                  style={{ background: 'rgba(0, 242, 254, 0.15)', border: '1px solid #00f2fe', color: '#00f2fe', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Retry automated Pterodactyl deployment without charging customer"
                                >
                                  <RefreshCw size={12} className={actionInProgress === `retry_${order.id}` ? 'spin-loader' : ''} />
                                  <span>Retry Deploy</span>
                                </button>
                              )}

                              <Link
                                to={`/track-order?id=${order.id}&token=${order.tracking_token || ''}`}
                                target="_blank"
                                style={{ color: '#94a3b8', padding: '5px' }}
                                title="Open Customer Tracking Page"
                              >
                                <ExternalLink size={16} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: WEB HOSTING MANAGEMENT ================= */}
        {activeTab === 'webhosting' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} style={{ color: '#00f2fe' }} /> cPanel / WHM Web Hosting Management
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Manage provisioned cPanel accounts, suspend/unsuspend sites, and verify WHM cluster connection.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>WHM Integration:</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: whmConfig?.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  border: whmConfig?.configured ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
                  color: whmConfig?.configured ? '#34d399' : '#facc15'
                }}>
                  {whmConfig?.configured ? `Connected (${whmConfig.host}:${whmConfig.port})` : 'Queued / Standby (Credentials Pending)'}
                </span>
              </div>
            </div>

            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Domain Name</th>
                      <th style={{ padding: '12px 14px' }}>cPanel User</th>
                      <th style={{ padding: '12px 14px' }}>Package Tier</th>
                      <th style={{ padding: '12px 14px' }}>Customer Email</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No Web Hosting accounts created yet. New customer orders will be staged here automatically.
                        </td>
                      </tr>
                    ) : (
                      webAccounts.map(acc => (
                        <tr key={acc.id || acc.domain} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '14px', color: '#00f2fe', fontWeight: 600, fontFamily: 'monospace' }}>
                            {acc.domain}
                          </td>
                          <td style={{ padding: '14px', color: '#fff', fontFamily: 'monospace' }}>
                            {acc.username}
                          </td>
                          <td style={{ padding: '14px', color: '#cbd5e1' }}>
                            <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#00f2fe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {acc.package || 'NOVEX_SOLO'}
                            </span>
                          </td>
                          <td style={{ padding: '14px', color: '#94a3b8' }}>
                            {acc.customer_email || 'Guest'}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: acc.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: acc.status === 'active' ? '#34d399' : '#f87171'
                            }}>
                              {acc.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleWebHostingAccount(acc.username, acc.id, acc.status)}
                                disabled={actionInProgress?.startsWith(`web_${acc.id}`)}
                                style={{
                                  background: acc.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  border: acc.status === 'active' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                                  color: acc.status === 'active' ? '#f87171' : '#34d399',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {acc.status === 'active' ? 'Suspend' : 'Unsuspend'}
                              </button>
                              <a
                                href={acc.cpanel_url || `https://${acc.domain}:2083`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: 'rgba(0, 242, 254, 0.1)',
                                  border: '1px solid rgba(0, 242, 254, 0.3)',
                                  color: '#00f2fe',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>cPanel</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: VDS BARE-METAL MANAGEMENT ================= */}
        {activeTab === 'vds' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} style={{ color: '#00f2fe' }} /> Dedicated Physical Bare-Metal Fleet (VDS)
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Physical bare-metal machine inventory across flagship AMD Ryzen 9 9950X, Ryzen 7, and Intel Xeon hardware.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#00f2fe', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  Total Nodes: {vdsMachines.length}
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  Available: {vdsMachines.filter(m => m.status === 'available').length}
                </span>
              </div>
            </div>

            {/* Physical Machines Table */}
            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Machine Identifier</th>
                      <th style={{ padding: '12px 14px' }}>Processor &amp; Cores</th>
                      <th style={{ padding: '12px 14px' }}>RAM / Storage</th>
                      <th style={{ padding: '12px 14px' }}>Location / Rack</th>
                      <th style={{ padding: '12px 14px' }}>Public IPv4</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vdsMachines.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px', color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>
                          {m.name || m.id}
                        </td>
                        <td style={{ padding: '14px', color: '#00f2fe' }}>
                          {m.processor}
                        </td>
                        <td style={{ padding: '14px', color: '#cbd5e1' }}>
                          {m.ram} &bull; {m.storage}
                        </td>
                        <td style={{ padding: '14px', color: '#94a3b8' }}>
                          {m.location} ({m.rack})
                        </td>
                        <td style={{ padding: '14px', color: '#38bdf8', fontFamily: 'monospace' }}>
                          {(m.ipPool && m.ipPool[0]) ? m.ipPool[0] : 'Pool Staged'}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: m.status === 'available' ? 'rgba(16, 185, 129, 0.15)' : m.status === 'allocated' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: m.status === 'available' ? '#34d399' : m.status === 'allocated' ? '#00f2fe' : '#facc15'
                          }}>
                            {m.status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <select
                            value={m.status}
                            onChange={(e) => handleUpdateMachineStatus(m.id, e.target.value)}
                            disabled={actionInProgress?.startsWith(`vds_${m.id}`)}
                            style={{
                              padding: '5px 8px',
                              background: '#030712',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                          >
                            <option value="available">Available</option>
                            <option value="allocated">Allocated</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PRODUCT PRICING ================= */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Centralized Product &amp; Pricing Management
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  All plans reflect the exact 10% price increase (New Price = Existing Price &times; 1.10). Original prices preserved for auditing.
                </p>
              </div>

              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Filter plans..."
                  style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 36px', background: '#081426', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#050c18', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Product Plan</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Memory / Compute</th>
                      <th style={{ padding: '12px 14px' }}>Storage</th>
                      <th style={{ padding: '12px 14px' }}>Original Reference</th>
                      <th style={{ padding: '12px 14px' }}>Current Price (+10%)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Edit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .map(plan => (
                        <tr key={plan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ color: '#fff', display: 'block' }}>{plan.name}</strong>
                            <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{plan.id}</code>
                          </td>
                          <td style={{ padding: '12px 14px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#00f2fe' }}>
                            {plan.category}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                            {plan.memoryMb ? `${plan.memoryMb / 1024} GB RAM` : 'N/A'} &bull; {plan.cpuPercent ? `${plan.cpuPercent}% CPU` : ''}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                            {plan.diskMb ? `${plan.diskMb / 1024} GB NVMe` : 'Standard'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', textDecoration: 'line-through' }}>
                            {formatINR(plan.originalPrice)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00f2fe', fontFamily: 'Outfit, sans-serif' }}>
                              {formatINR(plan.price)}
                            </span>
                            {plan.isCustomPrice && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#34d399' }}>Custom Overridden</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlan(plan);
                                setNewPlanPrice(String(plan.price));
                              }}
                              style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#00f2fe', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Edit Price
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Price Modal */}
            {editingPlan && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 0 40px rgba(0, 242, 254, 0.2)' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Edit Plan Price
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    {editingPlan.name} (Base Original: ₹{editingPlan.originalPrice})
                  </p>

                  <form onSubmit={handleSaveProductPrice}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        New Price (INR ₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingPlan(null)}
                        style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionInProgress?.startsWith('save_price')}
                        style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', border: 'none', color: '#030712', fontWeight: 700, padding: '0.6rem 1.4rem', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Save Price
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SERVERS ================= */}
        {activeTab === 'servers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Provisioned Node Infrastructure
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Total Active: {servers.length} Servers
              </span>
            </div>

            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#050c18', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Server Name</th>
                      <th style={{ padding: '12px 14px' }}>Panel ID</th>
                      <th style={{ padding: '12px 14px' }}>Node / IP</th>
                      <th style={{ padding: '12px 14px' }}>Resources</th>
                      <th style={{ padding: '12px 14px' }}>Customer Email</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Power Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No servers currently provisioned. Servers appear here automatically when customer checkout completes.
                        </td>
                      </tr>
                    ) : (
                      servers.map(srv => (
                        <tr key={srv.id || srv.panel_server_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px' }}>
                            <strong style={{ color: '#fff', display: 'block' }}>{srv.server_name}</strong>
                            <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{srv.id}</code>
                          </td>
                          <td style={{ padding: '14px', fontFamily: 'monospace', color: '#00f2fe' }}>
                            #{srv.panel_server_id}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <code style={{ background: '#030712', padding: '3px 6px', borderRadius: '4px', color: '#fff' }}>
                              {srv.ip}:{srv.port}
                            </code>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Node {srv.node_id || 1}</span>
                          </td>
                          <td style={{ padding: '14px', color: '#cbd5e1' }}>
                            {srv.memory_mb ? `${srv.memory_mb / 1024} GB RAM` : '2 GB'} &bull; {srv.cpu_percent || 200}% CPU
                          </td>
                          <td style={{ padding: '14px', color: '#94a3b8' }}>
                            {srv.customer_email || srv.owner_email || 'Direct'}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: srv.status === 'active' || srv.status === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: srv.status === 'active' || srv.status === 'online' ? '#34d399' : '#f87171' }}>
                              {srv.status?.toUpperCase() || 'ONLINE'}
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleServerAction(srv.panel_server_id, 'start')}
                                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Start"
                              >
                                <Play size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleServerAction(srv.panel_server_id, 'restart')}
                                style={{ background: 'rgba(0, 242, 254, 0.15)', border: '1px solid #00f2fe', color: '#00f2fe', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Restart"
                              >
                                <RotateCw size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleServerAction(srv.panel_server_id, 'stop')}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Stop"
                              >
                                <Square size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PAYMENTS ================= */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Razorpay Payment Records &amp; Webhooks
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Currency: INR &bull; Signature Verified
              </span>
            </div>

            <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#050c18', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Razorpay Payment ID</th>
                      <th style={{ padding: '12px 14px' }}>Order Reference</th>
                      <th style={{ padding: '12px 14px' }}>Customer</th>
                      <th style={{ padding: '12px 14px' }}>Amount</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Verified Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.payment_status === 'PAID' || o.razorpay_payment_id).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No Razorpay transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter(o => o.payment_status === 'PAID' || o.razorpay_payment_id)
                        .map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '14px', fontFamily: 'monospace', color: '#00f2fe' }}>
                              {o.razorpay_payment_id || 'Captured'}
                            </td>
                            <td style={{ padding: '14px', fontFamily: 'monospace', color: '#fff' }}>
                              {o.id}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ color: '#fff', fontWeight: 600, display: 'block' }}>{o.user_name}</span>
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{o.user_email}</span>
                            </td>
                            <td style={{ padding: '14px', fontWeight: 700, color: '#34d399' }}>
                              {formatINR(o.amount)}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                                PAID &amp; CAPTURED
                              </span>
                            </td>
                            <td style={{ padding: '14px', color: '#94a3b8', fontSize: '0.82rem' }}>
                              {o.paid_at ? new Date(o.paid_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem' }}>
              Platform System Settings &amp; Integration Health
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Razorpay Integration Health */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h4 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} style={{ color: '#00f2fe' }} /> Razorpay Gateway
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: settings?.razorpay?.isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: settings?.razorpay?.isConfigured ? '#34d399' : '#facc15' }}>
                    {settings?.razorpay?.isConfigured ? 'LIVE CONFIGURED' : 'TEST / SANDBOX'}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                  <div><strong>Key ID:</strong> <code style={{ color: '#00f2fe' }}>{settings?.razorpay?.keyId || 'rzp_test_placeholder'}</code></div>
                  <div><strong>Key Secret:</strong> <span style={{ color: settings?.razorpay?.hasSecret ? '#34d399' : '#ef4444' }}>{settings?.razorpay?.hasSecret ? 'Protected & Verified' : 'Missing'}</span></div>
                  <div><strong>Webhook Secret:</strong> <span style={{ color: settings?.razorpay?.hasWebhookSecret ? '#34d399' : '#facc15' }}>{settings?.razorpay?.hasWebhookSecret ? 'Active' : 'Optional in Dev'}</span></div>
                  <div><strong>Webhook URL:</strong> <code style={{ color: '#94a3b8' }}>/api/payments/webhook</code></div>
                </div>
              </div>

              {/* Pterodactyl Integration Health */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h4 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} style={{ color: '#00f2fe' }} /> Pterodactyl Panel API
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: settings?.pterodactyl?.hasApplicationKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: settings?.pterodactyl?.hasApplicationKey ? '#34d399' : '#facc15' }}>
                    {settings?.pterodactyl?.hasApplicationKey ? 'CONNECTED' : 'SANDBOX SIMULATION'}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                  <div><strong>Panel URL:</strong> <code style={{ color: '#00f2fe' }}>{settings?.pterodactyl?.panelUrl || 'https://panel.novexhost.com'}</code></div>
                  <div><strong>Application API Key:</strong> <span style={{ color: settings?.pterodactyl?.hasApplicationKey ? '#34d399' : '#ef4444' }}>{settings?.pterodactyl?.hasApplicationKey ? 'Loaded (Never Exposed)' : 'Missing'}</span></div>
                  <div><strong>Target Node ID:</strong> {settings?.pterodactyl?.nodeId || 1}</div>
                  <div><strong>Location / Egg ID:</strong> Loc {settings?.pterodactyl?.locationId || 1} &bull; Egg {settings?.pterodactyl?.eggId || 3}</div>
                </div>
              </div>

              {/* SMTP Email Health */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h4 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={18} style={{ color: '#00f2fe' }} /> SMTP Email Delivery
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: settings?.smtp?.isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: settings?.smtp?.isConfigured ? '#34d399' : '#facc15' }}>
                    {settings?.smtp?.isConfigured ? 'SMTP ACTIVE' : 'CONSOLE SIMULATION'}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                  <div><strong>Host:</strong> {settings?.smtp?.host}</div>
                  <div><strong>Port:</strong> {settings?.smtp?.port}</div>
                  <div><strong>From Address:</strong> {settings?.smtp?.from}</div>
                  <div><strong>Aqua Templates:</strong> 6 Branded Templates Enabled</div>
                </div>
              </div>

              {/* Branding Overview */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <h4 style={{ color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} style={{ color: '#00f2fe' }} /> Brand Identity
                </h4>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                  <div><strong>Brand Name:</strong> <strong style={{ color: '#00f2fe' }}>NOVEXHOST</strong></div>
                  <div><strong>Theme:</strong> Premium Aqua &amp; Cyan Cyber UI</div>
                  <div><strong>Default Currency:</strong> Indian Rupee (INR ₹)</div>
                  <div><strong>Customer Login Requirement:</strong> <span style={{ color: '#34d399' }}>Disabled (Guest Purchases)</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: ADMIN TEAM ================= */}
        {activeTab === 'admins' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Add Admin Form */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={18} style={{ color: '#00f2fe' }} /> Grant Admin Access
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Admins can manage orders, restart servers, update prices, and process deployment retries.
                </p>

                <form onSubmit={handleAddAdmin}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Admin Google / Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="team-member@gmail.com"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingAdmin}
                    style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                  >
                    {addingAdmin ? 'Adding Admin...' : 'Authorize Admin'}
                  </button>
                </form>
              </div>

              {/* Admin Users List */}
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
                  Authorized Administrators
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminUsers.map(admin => (
                    <div
                      key={admin.id || admin.email}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(3, 7, 18, 0.5)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.92rem', display: 'block' }}>{admin.email}</strong>
                        <span style={{ fontSize: '0.75rem', color: admin.role === 'owner' ? '#00f2fe' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                          Role: {admin.role || 'Admin'}
                        </span>
                      </div>

                      {admin.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(admin.email)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Revoke Admin Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
