import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getPlanById, CATEGORIES } from '../data/plans';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { createPaymentOrder } from '../services/api';
import {
  ShieldCheck, Lock, AlertTriangle, Zap, User, Mail, Smartphone,
  Check, ArrowRight, ArrowLeft, Upload, FileCheck, Image as ImageIcon,
  QrCode, Copy, CheckCircle2, Server
} from 'lucide-react';

export default function Checkout() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plan = getPlanById(planId || '');
  const { user, loginWithGoogle } = useAuth();
  const { formatPrice } = useCurrency();

  const [currentStep, setCurrentStep] = useState(1);

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [deliveryEmail, setDeliveryEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [serverName, setServerName] = useState('');

  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.displayName || '');
      if (!deliveryEmail) setDeliveryEmail(user.email || '');
    }
  }, [user]);

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  const trustedPrice = plan.price || 0;
  const trustedDuration = plan.period === 'year' ? '1 Year' : '1 Month';
  const upiReceiverId = 'anandagcloud@fam';

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!user) {
      loginWithGoogle();
      return;
    }
    if (!fullName || !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!deliveryEmail || !deliveryEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!mobileNumber || mobileNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPreview(event.target.result);
      setProofImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      loginWithGoogle();
      return;
    }

    if (!proofImage) {
      setErrorMessage('Payment screenshot/proof is required before confirming your order.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await createPaymentOrder({
        planId: plan.id,
        fullName: fullName.trim(),
        deliveryEmail: deliveryEmail.trim(),
        mobileNumber: mobileNumber.trim(),
        paymentProof: proofImage,
        serverName: serverName.trim() || `${plan.name} Server`
      });

      setSubmittedOrderId(res.orderId);
      setSubmitting(false);
      setShowSuccessPopup(true);
    } catch (err) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit order. Please try again.');
    }
  };

  const qrUri = `upi://pay?pa=${upiReceiverId}&pn=AG%20Cloud%20Hosting&am=${trustedPrice}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUri)}`;

  return (
    <section className="section top-space">
      <div className="container checkout-container">

        <div className="checkout-header text-center">
          <span className="famgateway-badge">
            <ShieldCheck size={16} className="text-cyan" /> 3-Step Secure Order System
          </span>
          <h1 className="checkout-title">Subscribe to {plan.name}</h1>
          <p className="checkout-subtitle">
            {CATEGORIES[plan.category] || 'Minecraft Hosting'} · <strong className="text-cyan">{formatPrice(trustedPrice, plan.period)}</strong>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <div className={`step-pill ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: currentStep === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', border: currentStep === 1 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', color: currentStep === 1 ? '#38bdf8' : '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: currentStep >= 1 ? '#0284c7' : '#334155', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
              <span>1. Customer Details</span>
            </div>
            <span style={{ color: '#475569' }}>→</span>
            <div className={`step-pill ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: currentStep === 2 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', border: currentStep === 2 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', color: currentStep === 2 ? '#38bdf8' : '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: currentStep >= 2 ? '#0284c7' : '#334155', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
              <span>2. QR Payment</span>
            </div>
            <span style={{ color: '#475569' }}>→</span>
            <div className={`step-pill ${currentStep === 3 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: currentStep === 3 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', border: currentStep === 3 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', color: currentStep === 3 ? '#38bdf8' : '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: currentStep === 3 ? '#0284c7' : '#334155', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
              <span>3. Payment Proof</span>
            </div>
          </div>
        </div>

        <div className="checkout-grid" style={{ maxWidth: '980px', margin: '0 auto' }}>

          <aside className="famgateway-qr-card glass-card glow-border" style={{ alignSelf: 'flex-start' }}>
            <div className="card-top-header">
              <span className="gateway-label">Trusted Plan Data</span>
              <span className="live-timer-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <ShieldCheck size={14} /> Verified Backend Price
              </span>
            </div>

            <div className="plan-summary-box" style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>{plan.name}</h2>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginBottom: '1.25rem' }}>
                {formatPrice(trustedPrice, plan.period)}
              </div>

              <div className="plan-resource-grid" style={{ display: 'grid', gap: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  <span>Selected Plan:</span>
                  <strong style={{ color: '#f8fafc' }}>{plan.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  <span>Plan Price:</span>
                  <strong style={{ color: '#10b981' }}>₹{trustedPrice}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  <span>Plan Duration:</span>
                  <strong style={{ color: '#38bdf8' }}>{trustedDuration}</strong>
                </div>
                {plan.ram && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <span>Allocated RAM:</span>
                    <strong style={{ color: '#f8fafc' }}>{plan.ram}</strong>
                  </div>
                )}
                {plan.storage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <span>Disk Storage:</span>
                    <strong style={{ color: '#f8fafc' }}>{plan.storage}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="famgateway-steps" style={{ marginTop: '1.25rem' }}>
              <p><Check size={14} className="step-check" /> 1. Selected plan: <strong>{plan.name}</strong></p>
              <p><Check size={14} className="step-check" /> 2. Exact amount: <strong>₹{trustedPrice}</strong></p>
              <p><Check size={14} className="step-check" /> 3. Pterodactyl server provisioned on admin approval</p>
            </div>
          </aside>

          <div className="payment-methods-card glass-card glow-border">

            {!user && (
              <div className="login-gate-banner" style={{ marginBottom: '1.5rem' }}>
                <Lock size={18} className="text-orange" />
                <div>
                  <strong>Google Sign In Required</strong>
                  <p>Authenticates server ownership to your verified Firebase Google account.</p>
                </div>
                <button type="button" className="primary-btn small glow-btn" onClick={loginWithGoogle}>
                  Sign in
                </button>
              </div>
            )}

            {errorMessage && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {errorMessage}
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>Step 1: Customer Details</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Enter your contact information for order registration and server delivery.</p>
                </div>

                <form onSubmit={handleStep1Next} className="payment-form">
                  <div className="form-grid">

                    <label>
                      Full Name *
                      <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </label>

                    <label>
                      Email Address *
                      <div className="input-with-icon">
                        <Mail size={16} className="input-icon" />
                        <input
                          type="email"
                          required
                          value={deliveryEmail}
                          onChange={e => setDeliveryEmail(e.target.value)}
                          placeholder="Email for server credentials"
                        />
                      </div>
                    </label>

                    <label className="full-width">
                      Mobile Number *
                      <div className="input-with-icon">
                        <Smartphone size={16} className="input-icon" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobileNumber}
                          onChange={e => setMobileNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                    </label>

                    <label className="full-width">
                      Minecraft Server Name (Optional)
                      <div className="input-with-icon">
                        <Server size={16} className="input-icon" />
                        <input
                          type="text"
                          value={serverName}
                          onChange={e => setServerName(e.target.value)}
                          placeholder={`e.g. ${plan.name} Server`}
                        />
                      </div>
                    </label>

                    <div className="full-width" style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Selected Plan</span>
                        <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{plan.name}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Plan Price</span>
                        <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>₹{trustedPrice}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Plan Duration</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{trustedDuration}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-btn full glow-btn pay-submit-btn"
                    style={{ marginTop: '1.25rem', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    Next: Step 2 — QR Payment <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>Step 2: QR Payment</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Scan the QR code using any UPI App (FamPay, PhonePe, GPay, Paytm) and pay the exact amount.</p>
                </div>

                <div className="text-center" style={{ margin: '1rem 0' }}>

                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: '1rem' }}>
                    <img
                      src={qrImageUrl}
                      alt="UPI Payment QR Code"
                      style={{ width: '210px', height: '210px', display: 'block', borderRadius: '8px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.85rem 1.15rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>UPI ID: <strong className="text-cyan">{upiReceiverId}</strong></span>
                    <button
                      type="button"
                      className="secondary-btn small"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        navigator.clipboard.writeText(upiReceiverId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                    >
                      <Copy size={13} /> {copiedUpi ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>Exact Amount to Pay: </span>
                    <strong style={{ color: '#34d399', fontSize: '1.2rem', marginLeft: '0.4rem' }}>₹{trustedPrice}</strong>
                  </div>

                  <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#fef08a', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <AlertTriangle size={18} style={{ minWidth: '18px', marginTop: '2px', color: '#facc15' }} />
                    <span><strong>Note:</strong> Take a screenshot after completing the payment. You will need to upload it as payment proof.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCurrentStep(1)}
                    style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="primary-btn glow-btn pay-submit-btn"
                    onClick={() => setCurrentStep(3)}
                    style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    Next: Step 3 — Upload Proof <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>Step 3: Upload Payment Proof</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Upload your transaction screenshot so the admin can verify your payment.</p>
                </div>

                <form onSubmit={handleConfirmOrder} className="payment-form">

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Upload Payment Screenshot / Proof *
                    </label>
                    <div style={{ border: '2px dashed rgba(56, 189, 248, 0.4)', background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="proof-upload-input"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proof-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
                        {proofPreview ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={proofPreview}
                              alt="Payment Proof Preview"
                              style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.5)', objectFit: 'contain' }}
                            />
                            <span style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle2 size={16} /> Image selected. Click to change screenshot.
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={36} className="text-cyan" />
                            <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>Click to browse & upload payment screenshot</strong>
                            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Supports PNG, JPG, WEBP (Max 5MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.15rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                      Order Summary Confirmation
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                      <div>Selected Plan: <strong style={{ color: '#f8fafc' }}>{plan.name}</strong></div>
                      <div>Amount Paid: <strong style={{ color: '#10b981' }}>₹{trustedPrice}</strong></div>
                      <div>Duration: <strong style={{ color: '#38bdf8' }}>{trustedDuration}</strong></div>
                      <div>Customer Email: <strong style={{ color: '#f8fafc' }}>{deliveryEmail}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setCurrentStep(2)}
                      style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="primary-btn glow-btn pay-submit-btn"
                      style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {submitting ? (
                        <span>Submitting Order...</span>
                      ) : (
                        <>
                          <Check size={18} /> Confirm Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="payment-modal-overlay">
          <div className="glass-card text-center" style={{ maxWidth: '480px', width: '92%', padding: '2rem 1.5rem' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={36} style={{ color: '#34d399' }} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Order Submitted Successfully
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '8px' }}>
              "Order submitted successfully. The admin will review your payment. Your server will be created only after payment approval."
            </p>

            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#38bdf8' }}>
              Order ID: <strong>{submittedOrderId}</strong>
            </div>

            <button
              type="button"
              className="primary-btn glow-btn full"
              onClick={() => {
                setShowSuccessPopup(false);
                navigate(`/track-order?email=${encodeURIComponent(deliveryEmail)}&id=${encodeURIComponent(submittedOrderId)}`);
              }}
            >
              Track Order Status Now
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
