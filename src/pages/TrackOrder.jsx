import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trackOrder } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import {
  Search, ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Server, Calendar, DollarSign, User, Mail, Smartphone, ArrowRight
} from 'lucide-react';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderId, setOrderId] = useState(searchParams.get('id') || searchParams.get('orderId') || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const executeLookup = async (lookupEmail, lookupId) => {
    if (!lookupEmail || !lookupEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);
    setOrdersList([]);

    try {
      const res = await trackOrder(lookupEmail.trim(), (lookupId || '').trim());
      const list = res.orders || (res.order ? [res.order] : []);
      setOrdersList(list);
      if (list.length === 0) {
        setErrorMsg('No orders found matching your search.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'No matching order found with the provided email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialEmail = searchParams.get('email');
    const initialId = searchParams.get('id') || searchParams.get('orderId');
    if (initialEmail) {
      executeLookup(initialEmail, initialId || '');
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    executeLookup(email, orderId);
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED' || s === 'PAID' || s === 'ACTIVE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem' }}>
          <CheckCircle2 size={16} /> APPROVED
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'FAILED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem' }}>
          <XCircle size={16} /> REJECTED
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem' }}>
        <Clock size={16} /> PENDING
      </span>
    );
  };

  return (
    <section className="section top-space">
      <div className="container" style={{ maxWidth: '820px' }}>

        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <span className="famgateway-badge mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} className="text-cyan" /> Instant Order Status Lookup
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Track Order</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Check real-time payment review, approval status, and Pterodactyl server provisioning.
          </p>
        </div>

        <div className="glass-card glow-border" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <label>
                Customer Email *
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter customer email address"
                  />
                </div>
              </label>

              <label>
                Order ID <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(Optional)</span>
                <div className="input-with-icon">
                  <Search size={16} className="input-icon" />
                  <input
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="e.g. ORD-1234ABC (Optional)"
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn glow-btn full"
              style={{ padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <span>Searching order details...</span>
              ) : (
                <>
                  <Search size={18} /> Search Order Status
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.85rem 1rem', borderRadius: '8px', marginTop: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {searched && ordersList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Found {ordersList.length} Order{ordersList.length > 1 ? 's' : ''} for {email}
            </h3>

            {ordersList.map(item => (
              <div key={item.id} className="glass-card glow-border" style={{ padding: '2rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Order Identifier
                    </span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{item.id}</h2>
                  </div>
                  {renderStatusBadge(item.paymentStatus)}
                </div>

                {item.paymentStatus === 'PENDING' && (
                  <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#fef08a', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                    <strong style={{ color: '#facc15', display: 'block', fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                      PENDING — Waiting for admin approval
                    </strong>
                    The admin will review your uploaded payment screenshot. Your server will be created only after payment approval.
                  </div>
                )}

                {item.paymentStatus === 'APPROVED' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#a7f3d0', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                    <strong style={{ color: '#34d399', display: 'block', fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                      APPROVED — Server created / provisioning status
                    </strong>
                    Your payment has been verified by admin. Your Minecraft server is provisioned and ready on panel.agcloud.fun.
                  </div>
                )}

                {item.paymentStatus === 'REJECTED' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                    <strong style={{ color: '#f87171', display: 'block', fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                      REJECTED — Order Not Approved
                    </strong>
                    <strong>Admin Rejection Reason:</strong> {item.rejectionReason || 'Payment verification could not be completed.'}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Purchased Plan</span>
                    <strong style={{ color: '#f8fafc', fontSize: '1.05rem' }}>{item.planName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Total Amount</span>
                    <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{formatPrice(item.amount)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Purchased Duration</span>
                    <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>{item.duration || '1 Month'} ({item.durationDays || 30} Days)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Submitted Date</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{new Date(item.createdAt).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Customer Email</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{item.userEmail || item.contactEmail}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Mobile Number</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{item.mobile || 'N/A'}</strong>
                  </div>
                </div>

                {item.paymentStatus === 'APPROVED' && (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link
                      to="/panel"
                      className="primary-btn glow-btn small"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      <Server size={16} /> Go to My Servers <ArrowRight size={14} />
                    </Link>
                    <a
                      href={`https://panel.agcloud.fun/server/${item.panelServerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-btn small"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      Open panel.agcloud.fun
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
