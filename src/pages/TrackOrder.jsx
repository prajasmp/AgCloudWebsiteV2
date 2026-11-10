import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trackOrder } from '../services/api';
import { formatINR } from '../data/plans';
import {
  Search, ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Server, Calendar, DollarSign, User, Mail, Smartphone, ArrowRight,
  ExternalLink, Copy, Check, Globe, RefreshCw, Cpu, HardDrive, Zap, Headphones
} from 'lucide-react';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderId, setOrderId] = useState(searchParams.get('id') || searchParams.get('orderId') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const executeLookup = async (lookupEmail, lookupId, lookupToken) => {
    if (!lookupToken && !lookupEmail && !lookupId) {
      setErrorMsg('Please enter your Order Reference or Email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);
    setOrdersList([]);

    try {
      const res = await trackOrder(lookupEmail?.trim(), lookupId?.trim(), lookupToken?.trim());
      const list = res.orders || (res.order ? [res.order] : []);
      setOrdersList(list);
      if (list.length === 0) {
        setErrorMsg('No orders found matching your search. Please check your reference.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'No matching order found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialToken = searchParams.get('token');
    const initialEmail = searchParams.get('email');
    const initialId = searchParams.get('id') || searchParams.get('orderId');

    if (initialToken || initialEmail || initialId) {
      executeLookup(initialEmail || '', initialId || '', initialToken || '');
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    executeLookup(email, orderId, token);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderPaymentBadge = (status) => {
    const s = String(status || 'PENDING').toUpperCase();
    if (s === 'PAID' || s === 'APPROVED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <CheckCircle2 size={15} /> PAID
        </span>
      );
    }
    if (s === 'FAILED' || s === 'REJECTED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <XCircle size={15} /> {s}
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> REFUNDED
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
        <Clock size={15} /> PENDING PAYMENT
      </span>
    );
  };

  const renderDeploymentBadge = (status) => {
    const s = String(status || 'WAITING_PAYMENT').toLowerCase();
    if (s === 'active' || s === 'provisioned') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.4)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <Zap size={15} /> ACTIVE &bull; ONLINE
        </span>
      );
    }
    if (s === 'provisioning' || s === 'installing' || s === 'queued') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <RefreshCw size={15} className="spin-loader" /> PROVISIONING
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          <AlertCircle size={15} /> RETRY QUEUED
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
        WAITING PAYMENT
      </span>
    );
  };

  return (
    <div style={{ minHeight: '85vh', padding: '3.5rem 1rem' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '999px', padding: '6px 16px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={16} /> Instant Order Tracking &bull; No Login Required
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem' }}>
            Track Your NOVEXHOST Order
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '580px', margin: '0 auto' }}>
            Lookup your real-time payment status, automated server provisioning, node allocation, and server IP details.
          </p>
        </div>

        {/* Search Box */}
        <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '18px', padding: '2rem', marginBottom: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Order Reference (e.g. ORD-NVX-XXXX)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORD-NVX-..."
                  style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Customer Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.95rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 800, fontSize: '1rem', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 25px rgba(0, 242, 254, 0.35)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin-loader" />
                  <span>Searching Orders...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Lookup Order Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '14px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#fca5a5' }}>
            <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results List */}
        {ordersList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {ordersList.map((order) => {
              const isProvisioned = order.provisioningStatus === 'active' || Boolean(order.panelServerId);
              return (
                <div
                  key={order.id}
                  style={{ background: '#060e1e', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '18px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Reference</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                          {order.id}
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.id, order.id)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          title="Copy Order ID"
                        >
                          {copiedId === order.id ? <Check size={16} style={{ color: '#34d399' }} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {renderPaymentBadge(order.paymentStatus)}
                      {renderDeploymentBadge(order.provisioningStatus)}
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Hosting Plan</span>
                      <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{order.planName || order.planId}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount Paid</span>
                      <strong style={{ color: '#00f2fe', fontSize: '1.1rem' }}>{formatINR(order.amount)}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Server Label</span>
                      <span style={{ color: '#ffffff' }}>{order.serverName || 'Standard Node'}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Order Date</span>
                      <span style={{ color: '#94a3b8' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  {/* Server / Service Connection Information (Only once provisioned) */}
                  {isProvisioned && order.serverDetails && (
                    <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#00f2fe', fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Server size={18} /> {order.serverDetails.type === 'web' ? 'cPanel Web Hosting Credentials' : order.serverDetails.type === 'bare-metal' ? 'Bare-Metal Machine Connection' : 'Live Server Connection Details'}
                        </h4>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          ACTIVE &bull; ONLINE
                        </span>
                      </div>

                      {/* BRANCH A: Web Hosting */}
                      {order.serverDetails.type === 'web' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Hosted Domain</span>
                            <span style={{ color: '#00f2fe', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>{order.serverDetails.domain}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>cPanel Username</span>
                            <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'monospace' }}>{order.serverDetails.username}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nameservers</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>ns1.novexhost.com / ns2.novexhost.com</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>cPanel Login</span>
                            <a
                              href={order.serverDetails.cpanelUrl || 'https://cpanel.novexhost.com:2083'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00f2fe', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'underline' }}
                            >
                              <span>Open cPanel</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* BRANCH B: Bare-Metal VDS */}
                      {order.serverDetails.type === 'bare-metal' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Public Dedicated IPv4</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <code style={{ background: '#030712', padding: '4px 8px', borderRadius: '6px', color: '#00f2fe', fontSize: '0.95rem', fontWeight: 700 }}>
                                {order.serverDetails.ip}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(order.serverDetails.ip, `ip_${order.id}`)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                              >
                                {copiedId === `ip_${order.id}` ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>SSH Command</span>
                            <code style={{ background: '#030712', padding: '4px 8px', borderRadius: '6px', color: '#38bdf8', fontSize: '0.85rem' }}>
                              ssh root@{order.serverDetails.ip}
                            </code>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Operating System</span>
                            <span style={{ color: '#ffffff', fontWeight: 600 }}>{order.serverDetails.os || order.os || 'Ubuntu 24.04 LTS'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Datacenter Cluster</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{order.serverDetails.datacenter || order.serverRegion || 'Mumbai DC-1'}</span>
                          </div>
                        </div>
                      )}

                      {/* BRANCH C: Standard Game Server */}
                      {(!order.serverDetails.type || order.serverDetails.type === 'game') && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Connection Address</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <code style={{ background: '#030712', padding: '4px 8px', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                {order.serverDetails.ip}:{order.serverDetails.port}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(`${order.serverDetails.ip}:${order.serverDetails.port}`, `ip_${order.id}`)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                title="Copy IP:Port"
                              >
                                {copiedId === `ip_${order.id}` ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Panel Server ID</span>
                            <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'monospace' }}>#{order.panelServerId || order.serverDetails.panelServerId}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Control Panel</span>
                            <a
                              href={order.serverDetails.panelUrl || 'https://panel.novexhost.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00f2fe', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'underline' }}
                            >
                              <span>Open Pterodactyl</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deployment Failure notice */}
                  {order.provisioningStatus === 'failed' && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.88rem' }}>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>Deployment Delayed:</strong>
                      {order.deploymentError || 'Node allocation is queued. The systems team has been alerted and will deploy your server without any extra charge.'}
                    </div>
                  )}

                  {/* Support Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Headphones size={15} style={{ color: '#00f2fe' }} />
                      <span>Need help? Our engineers are on 24/7 Discord support.</span>
                    </div>

                    <a
                      href="https://discord.gg/novexhost"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00f2fe', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Join Support Discord &rarr;
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
