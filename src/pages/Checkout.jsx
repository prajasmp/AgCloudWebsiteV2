import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { getPlanById, SERVER_LOCATIONS, formatINR } from '../data/plans';
import { useCurrency } from '../context/CurrencyContext';
import { createPaymentOrder, verifyPayment } from '../services/api';
import NovexLogo from '../components/NovexLogo';
import {
  ShieldCheck, Lock, Zap, User, Mail, Smartphone,
  Check, ArrowRight, ArrowLeft, QrCode, CheckCircle2,
  Server, Globe, Cpu, HardDrive, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';

export default function Checkout() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plan = getPlanById(planId || '');
  const { formatPrice } = useCurrency();

  // Customer details (No login required)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Server configuration
  const [serverName, setServerName] = useState('');
  const [serverRegion, setServerRegion] = useState('Mumbai, India');

  // Checkout states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeStep, setActiveStep] = useState(1); // 1: Configure & Details, 2: Payment Review & Razorpay
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    // If an existing guest user stored details in localStorage, autofill for convenience
    try {
      const saved = localStorage.getItem('novexhost_guest_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setFullName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.mobile) setMobileNumber(parsed.mobile);
      }
    } catch (e) {}

    if (plan && !serverName) {
      setServerName(`${plan.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [plan]);

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  // Helper to load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !fullName.trim()) {
      setErrorMessage('Please enter your full name for server registration.');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address to receive server credentials.');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      localStorage.setItem('novexhost_guest_info', JSON.stringify({
        name: fullName.trim(),
        email: email.trim(),
        mobile: cleanMobile
      }));
    } catch (e) {}

    setActiveStep(2);
  };

  const handleInitiateRazorpay = async () => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create backend order & Razorpay order
      const orderRes = await createPaymentOrder({
        planId: plan.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        serverName: serverName.trim() || `${plan.name} Node`,
        serverRegion
      });

      if (!orderRes.success) {
        throw new Error(orderRes.error || 'Failed to create order on backend.');
      }

      setCreatedOrderData(orderRes);

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your network connection.');
      }

      // 3. Configure Razorpay modal options
      const options = {
        key: orderRes.razorpayKeyId,
        amount: orderRes.amountInPaise,
        currency: 'INR',
        name: 'NOVEXHOST',
        description: `${plan.name} - Instant Deployment`,
        image: '/favicon.svg',
        order_id: orderRes.razorpayOrderId,
        handler: async function (response) {
          // Razorpay payment success handler
          await handlePaymentSuccess(response, orderRes);
        },
        prefill: {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          contact: mobileNumber.trim()
        },
        notes: {
          orderId: orderRes.orderId,
          planId: plan.id,
          serverName: serverName.trim()
        },
        theme: {
          color: '#00f2fe'
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          }
        }
      };

      // If in sandbox mode without active keys or if user triggers test simulation
      if (!window.Razorpay || orderRes.razorpayKeyId === 'rzp_test_placeholder' || orderRes.razorpayOrderId.startsWith('order_')) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failRes) {
          console.error('[Razorpay Failed]:', failRes.error);
          setErrorMessage(`Payment failed: ${failRes.error.description || 'Transaction declined'}`);
          setSubmitting(false);
        });
        rzp.open();
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('[Checkout Error]:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (rzpResponse, orderMeta) => {
    setIsDeploying(true);
    setSubmitting(true);
    setErrorMessage('');

    try {
      console.log('[Razorpay Success Received]:', rzpResponse);
      const verifyRes = await verifyPayment({
        orderId: orderMeta.orderId,
        razorpayOrderId: rzpResponse.razorpay_order_id || orderMeta.razorpayOrderId,
        razorpayPaymentId: rzpResponse.razorpay_payment_id || `pay_${Date.now()}`,
        razorpaySignature: rzpResponse.razorpay_signature || `sig_${Date.now()}`
      });

      if (!verifyRes.success) {
        throw new Error(verifyRes.error || 'Payment signature verification failed.');
      }

      // Navigate to order tracking page with token
      navigate(`/order-success/${orderMeta.orderId}?token=${orderMeta.trackingToken}`);
    } catch (err) {
      console.error('[Verification Error]:', err);
      setErrorMessage(`Payment verification notice: ${err.message}. Your payment was received; please track via order reference.`);
      setIsDeploying(false);
      setSubmitting(false);
    }
  };

  // Development sandbox payment simulation helper
  const handleTestSimulatePayment = async () => {
    setSubmitting(true);
    try {
      let orderRes = createdOrderData;
      if (!orderRes) {
        orderRes = await createPaymentOrder({
          planId: plan.id,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim(),
          serverName: serverName.trim() || `${plan.name} Node`,
          serverRegion
        });
        setCreatedOrderData(orderRes);
      }

      await handlePaymentSuccess({
        razorpay_order_id: orderRes.razorpayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: `test_sig_${Date.now()}`
      }, orderRes);
    } catch (err) {
      setErrorMessage(err.message || 'Test simulation error');
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper" style={{ minHeight: '85vh', padding: '3rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* Header Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/plans" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00f2fe', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <ArrowLeft size={16} /> Back to Hosting Plans
            </Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
              Checkout &bull; <span style={{ color: '#00f2fe' }}>No Registration Required</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Instant automated deployment right after Razorpay payment verification.
            </p>
          </div>

          {/* Stepper indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeStep === 1 ? '#00f2fe' : '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeStep === 1 ? 'rgba(0, 242, 254, 0.2)' : '#10b981', border: `1px solid ${activeStep === 1 ? '#00f2fe' : '#10b981'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {activeStep > 1 ? <Check size={14} /> : '1'}
              </span>
              <span>Details</span>
            </div>
            <span style={{ width: '24px', height: '2px', background: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeStep === 2 ? '#00f2fe' : '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeStep === 2 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: `1px solid ${activeStep === 2 ? '#00f2fe' : 'rgba(255, 255, 255, 0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeStep === 2 ? '#00f2fe' : '#64748b' }}>
                2
              </span>
              <span>Payment &amp; Deploy</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

          {/* LEFT COLUMN: Customer Form or Payment Action */}
          <div>
            {activeStep === 1 && (
              <form onSubmit={handleProceedToReview} style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} style={{ color: '#00f2fe' }} /> Customer Information
                </h2>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Delivery Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@gmail.com"
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Your server credentials, panel link, and Razorpay receipt will be delivered here.
                  </span>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Mobile Number (10 Digits) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', padding: '0.8rem 0.9rem', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9876543210"
                      style={{ flex: 1, padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} style={{ color: '#00f2fe' }} /> Server Configuration
                </h2>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Server Hostname / Label
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="my-cool-server"
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Server Cluster Location
                  </label>
                  <select
                    value={serverRegion}
                    onChange={(e) => setServerRegion(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#030712', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  >
                    {SERVER_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.flag} {loc.name} (Ping: {loc.ping})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 800, fontSize: '1rem', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)' }}
                >
                  <span>Review &amp; Proceed to Payment</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {activeStep === 2 && (
              <div style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} style={{ color: '#00f2fe' }} /> Secure Razorpay Checkout
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Pay via UPI (GPay, PhonePe, Paytm), Credit/Debit Card, NetBanking, or Wallets in INR.
                </p>

                <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>Customer:</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{fullName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>Email:</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>Contact:</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>+91 {mobileNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>Server Label:</span>
                    <span style={{ color: '#00f2fe', fontWeight: 600 }}>{serverName}</span>
                  </div>
                </div>

                {isDeploying ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <Loader2 size={36} className="spin-loader" style={{ color: '#00f2fe', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Payment Verified! Provisioning Server...
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      Contacting Pterodactyl node cluster &amp; allocating RAM limits. Please hold...
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleInitiateRazorpay}
                      disabled={submitting}
                      style={{ width: '100%', padding: '1.1rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 800, fontSize: '1.05rem', border: 'none', borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)', opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={20} className="spin-loader" />
                          <span>Connecting to Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          <span>Pay {formatINR(plan.price)} with Razorpay &rarr;</span>
                        </>
                      )}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ArrowLeft size={14} /> Edit Customer Details
                      </button>

                      {/* Developer Sandbox Quick-Test Trigger */}
                      <button
                        type="button"
                        onClick={handleTestSimulatePayment}
                        disabled={submitting}
                        style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        title="Simulate successful test payment for development testing"
                      >
                        ⚡ Test Mode: Simulate Paid
                      </button>
                    </div>
                  </>
                )}

                <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', color: '#64748b', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} style={{ color: '#00f2fe' }} /> 256-Bit SSL Encrypted</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={14} style={{ color: '#00f2fe' }} /> Instant Provisioning</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14} style={{ color: '#00f2fe' }} /> Auto Invoice</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div>
            <div style={{ background: '#060e1e', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '2rem', position: 'sticky', top: '100px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00f2fe', fontWeight: 700 }}>
                    Selected Plan
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                    {plan.name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {plan.category.toUpperCase()} &bull; {plan.period === 'year' ? '1 Year Term' : '1 Month Term'}
                  </span>
                </div>
                {plan.badge && (
                  <span style={{ background: 'rgba(0, 242, 254, 0.15)', border: '1px solid rgba(0, 242, 254, 0.4)', color: '#00f2fe', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Hardware Specifications */}
              <div style={{ background: 'rgba(3, 7, 18, 0.6)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {plan.ram && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={14} /> Memory:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{plan.ram}</span>
                  </div>
                )}
                {plan.cpu && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} /> Compute:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{plan.cpu}</span>
                  </div>
                )}
                {plan.storage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><HardDrive size={14} /> Storage:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{plan.storage}</span>
                  </div>
                )}
              </div>

              {/* Price Calculation (10% Increased Price with Original Reference) */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Base Reference Rate:</span>
                  <span style={{ color: '#64748b', textDecoration: 'line-through' }}>{formatINR(plan.originalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>NOVEXHOST High-Speed Tier (+10%):</span>
                  <span style={{ color: '#34d399' }}>Applied</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Automated Deployment:</span>
                  <span style={{ color: '#00f2fe', fontWeight: 600 }}>FREE (Instant)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>1.2 Tbps DDoS Shield:</span>
                  <span style={{ color: '#00f2fe', fontWeight: 600 }}>INCLUDED</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '1rem', marginTop: '0.5rem', borderTop: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Total Due Today</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>INR Currency &bull; Taxes Included</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                      {formatINR(plan.price)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#00f2fe', display: 'block' }}>
                      /{plan.period || 'month'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees Box */}
              <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: '10px', padding: '0.9rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                <strong style={{ color: '#00f2fe', display: 'block', marginBottom: '4px' }}>NOVEXHOST SLA Guarantee:</strong>
                All nodes are monitored 24/7 with zero downtime migration, daily backups, and automated failover routing.
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
