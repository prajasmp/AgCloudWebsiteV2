import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { checkPaymentStatus } from '../services/api';
import {
  CheckCircle2, Loader2, Server, Globe, Shield, ArrowRight,
  ExternalLink, Copy, Check, AlertCircle, RefreshCw, Zap
} from 'lucide-react';

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await checkPaymentStatus(id, token);
      setOrderData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not fetch live order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll while waiting or provisioning
    const interval = setInterval(() => {
      fetchStatus();
    }, 3500);

    return () => clearInterval(interval);
  }, [id, token]);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProvisioned = orderData?.provisioningStatus === 'active' || Boolean(orderData?.panelServerId);
  const isFailed = orderData?.provisioningStatus === 'failed';
  const isPending = !isProvisioned && !isFailed;

  return (
    <div style={{ minHeight: '80vh', padding: '4rem 1rem' }}>
      <div className="container" style={{ maxWidth: '780px', margin: '0 auto' }}>

        <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)' }}>

          {/* Top Status Icon */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: isProvisioned ? 'rgba(16, 185, 129, 0.15)' : isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 242, 254, 0.15)', border: `2px solid ${isProvisioned ? '#10b981' : isFailed ? '#ef4444' : '#00f2fe'}`, marginBottom: '1.5rem', boxShadow: `0 0 25px ${isProvisioned ? 'rgba(16, 185, 129, 0.4)' : isFailed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 242, 254, 0.4)'}` }}>
            {isProvisioned ? (
              <CheckCircle2 size={42} style={{ color: '#10b981' }} />
            ) : isFailed ? (
              <AlertCircle size={42} style={{ color: '#ef4444' }} />
            ) : (
              <Loader2 size={42} className="spin-loader" style={{ color: '#00f2fe' }} />
            )}
          </div>

          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: isProvisioned ? '#34d399' : '#00f2fe', display: 'block', marginBottom: '0.5rem' }}>
            {isProvisioned ? 'DEPLOYMENT COMPLETE' : isFailed ? 'DEPLOYMENT QUEUED FOR RETRY' : 'AUTOMATED PROVISIONING IN PROGRESS'}
          </span>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginBottom: '0.75rem' }}>
            {isProvisioned ? 'Your Server is Active & Online!' : isFailed ? 'Payment Secure & Provisioning Queued' : 'Assembling Your Server...'}
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            {isProvisioned
              ? 'Your high-performance node has been provisioned on our cluster. You can connect right away using the IP below.'
              : isFailed
              ? 'Your payment was successfully received and is 100% safe. Our automated cluster is waiting for node allocation. The administrator has been notified to retry deployment.'
              : 'Our automated system has verified your Razorpay payment and is currently assigning ports, memory limits, and SSD allocations.'}
          </p>

          {/* Order Details Card */}
          <div style={{ background: '#030712', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Order Reference:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ color: '#00f2fe', fontWeight: 700, fontSize: '0.95rem', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>{id}</code>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  title="Copy Order ID"
                >
                  {copied ? <Check size={16} style={{ color: '#34d399' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {orderData?.planName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Plan:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{orderData.planName}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Payment Status:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>PAID (Razorpay Verified)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Deployment Status:</span>
              <span style={{ color: isProvisioned ? '#34d399' : '#00f2fe', fontWeight: 700, textTransform: 'uppercase' }}>
                {orderData?.provisioningStatus || 'PROVISIONING'}
              </span>
            </div>

            {isProvisioned && orderData?.panelServerId && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Panel Server ID:</span>
                <span style={{ color: '#00f2fe', fontWeight: 700, fontFamily: 'monospace' }}>#{orderData.panelServerId}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to={`/track-order?id=${id}&token=${token}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 1.75rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 800, fontSize: '0.95rem', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)' }}
            >
              <span>View Full Order &amp; Server Details</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="https://discord.gg/novexhost"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontWeight: 600, fontSize: '0.95rem', borderRadius: '12px', textDecoration: 'none' }}
            >
              <span>Join Discord Support</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
