import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, RefreshCw, Lock, Mail, MessageSquare, CheckCircle, PackageCheck, Zap } from 'lucide-react';
import NovexLogo from '../components/NovexLogo';

export default function Legal() {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Terms & Conditions';
  let icon = Shield;
  let content = null;

  if (path.includes('refund')) {
    title = 'Refund Policy';
    icon = RefreshCw;
    content = (
      <>
        <h3>1. 24-Hour Service Guarantee</h3>
        <p>
          At NOVEXHOST, we are committed to providing world-class game servers and Cloud VPS hosting. If your server is not automatically deployed or experiences prolonged downtime due to an infrastructure outage on our side within the first 24 hours of purchase, you are eligible for a full refund.
        </p>
        <h3>2. Razorpay Refund Processing</h3>
        <p>
          All eligible refunds are processed directly back to your original payment method (UPI, Debit Card, Credit Card, or NetBanking) through our Razorpay merchant integration. Razorpay typically credits refunded funds within 2 to 5 banking business days.
        </p>
        <h3>3. Non-Refundable Items</h3>
        <p>
          Refunds cannot be issued for top-level domain registrations (as ICANN registrars lock domains immediately), user misconfigurations, third-party software incompatibilities, change of mind after resource usage, or accounts suspended due to Terms of Service violations (e.g. DDoS attacks, port scanning, or malicious scripts).
        </p>
        <h3>4. How to Request a Refund</h3>
        <p>
          To submit a refund inquiry, simply email <strong>support@novexhost.com</strong> or open a Discord ticket with your Order Reference (e.g., <code>ORD-NVX-XXXX</code>) and Razorpay Payment ID.
        </p>
      </>
    );
  } else if (path.includes('privacy')) {
    title = 'Privacy Policy';
    icon = Lock;
    content = (
      <>
        <h3>1. Minimal Customer Data Collection</h3>
        <p>
          NOVEXHOST operates on a guest-first, privacy-respecting architecture. We do not require customer account registration or forced social sign-in to purchase hosting. We only collect the details necessary to deliver and manage your server: full name, contact email address, mobile number, and transaction references.
        </p>
        <h3>2. Payment Security with Razorpay</h3>
        <p>
          All payment card, UPI, and banking transactions are processed securely through Razorpay's PCI-DSS Level 1 compliant infrastructure with 256-bit SSL encryption. NOVEXHOST never stores or accesses your credit card numbers, CVV, or banking passwords.
        </p>
        <h3>3. Data Confidentiality</h3>
        <p>
          Your server files, database contents, and customer details are strictly private. We never sell or share customer data with third-party advertisers. Order lookup is secured with unguessable cryptographic tracking tokens.
        </p>
      </>
    );
  } else if (path.includes('contact')) {
    title = 'Contact NOVEXHOST';
    icon = Mail;
    content = (
      <>
        <div className="contact-card glass-card" style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '2rem' }}>
          <h3 style={{ color: '#00f2fe', marginTop: 0 }}>24/7 Technical Support &amp; Community</h3>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.7' }}>
            Our infrastructure engineering team is available around the clock to assist you with server setups, node migrations, custom Modpack installations, and billing questions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ background: '#030712', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Email Inquiries:</span>
              <strong style={{ color: '#ffffff', display: 'block', fontSize: '1rem', marginTop: '4px' }}>support@novexhost.com</strong>
            </div>

            <div style={{ background: '#030712', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Billing &amp; Payments:</span>
              <strong style={{ color: '#ffffff', display: 'block', fontSize: '1rem', marginTop: '4px' }}>billing@novexhost.com</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <a
              className="primary-btn glow-btn inline-btn"
              href="https://discord.gg/novexhost"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 1.5rem', background: 'linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%)', color: '#030712', fontWeight: 700, borderRadius: '10px', textDecoration: 'none' }}
            >
              <MessageSquare size={18} /> Join Official Discord
            </a>

            <Link
              to="/track-order"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#00f2fe', fontWeight: 600, borderRadius: '10px', textDecoration: 'none' }}
            >
              <PackageCheck size={18} /> Track Existing Order
            </Link>
          </div>
        </div>
      </>
    );
  } else {
    // Terms of Service
    content = (
      <>
        <h3>1. Acceptable Use Policy</h3>
        <p>
          NOVEXHOST provides high-performance computing, game hosting, and VPS infrastructure for lawful personal and commercial operations. Customers must not use our servers for DDoS attacks, malware distribution, port scanning, cryptocurrency mining without prior written authorization, or unlawful mass spamming.
        </p>
        <h3>2. Instant Automated Deployment</h3>
        <p>
          Hosting services purchased on NOVEXHOST are automatically deployed via our API integration upon successful Razorpay payment verification. If automatic provisioning is delayed by node allocation queues, the customer will not be charged again, and an engineer will provision the environment immediately.
        </p>
        <h3>3. Service Level Agreement (SLA)</h3>
        <p>
          We guarantee 99.9% network uptime across all tier-3 datacenter nodes in Mumbai, Singapore, Frankfurt, and Virginia. Scheduled maintenance is announced in advance on our Discord server and status portal.
        </p>
        <h3>4. Backups and Data Integrity</h3>
        <p>
          While NOVEXHOST performs automated node-level snapshots, customers are encouraged to download regular SFTP backups of their game worlds, configurations, and VPS storage.
        </p>
      </>
    );
  }

  const IconComp = icon;

  return (
    <section className="section top-space" style={{ minHeight: '80vh', padding: '3.5rem 1rem' }}>
      <div className="container" style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div className="glass-card glow-border" style={{ background: '#081426', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', paddingBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f2fe' }}>
              <IconComp size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h1>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>NOVEXHOST Legal &bull; Last updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="legal-body-text" style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.75' }}>
            {content}
          </div>
        </div>
      </div>
    </section>
  );
}
