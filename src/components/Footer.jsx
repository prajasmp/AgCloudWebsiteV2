import React from 'react';
import { Link } from 'react-router-dom';
import NovexLogo from './NovexLogo';
import { ShieldCheck, Zap, Headphones, PackageCheck, Globe, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer novex-footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <div className="brand" style={{ marginBottom: '1rem' }}>
            <NovexLogo size={32} showText={true} />
          </div>
          <p className="footer-desc" style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '320px' }}>
            International premium hosting platform. High-performance game servers, Gen4 NVMe Cloud VPS, and automated deployment with 1.2 Tbps enterprise DDoS protection.
          </p>
          <div className="footer-security-badges" style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#00f2fe', background: 'rgba(6, 182, 212, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <Lock size={12} /> Razorpay Verified
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <Zap size={12} /> Instant Auto-Setup
            </span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Hosting Solutions</h4>
          <Link to="/plans">Minecraft Game Servers</Link>
          <Link to="/plans">High-Clock Cloud VPS</Link>
          <Link to="/plans">Bot Hosting</Link>
          <Link to="/plans">Top-Level Domains</Link>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <Link to="/track-order" style={{ color: '#00f2fe', fontWeight: 600 }}>
            <PackageCheck size={14} style={{ display: 'inline', marginRight: '5px' }} />
            Track Order
          </Link>
          <Link to="/contact">24/7 Technical Support</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>

        <div className="footer-col">
          <h4>Connect</h4>
          <a href="https://discord.gg/novexhost" target="_blank" rel="noopener noreferrer">
            Discord Community
          </a>
          <a href="mailto:support@novexhost.com">support@novexhost.com</a>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
            Server Nodes: Mumbai (IN), Singapore (SG), Frankfurt (DE), Virginia (US)
          </div>
        </div>
      </div>

      <div className="copyright container" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.12)', paddingTop: '1.5rem', marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
        <div>
          &copy; {new Date().getFullYear()} NOVEXHOST. All rights reserved. Not affiliated with Mojang or Microsoft.
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>Powered by Pterodactyl &amp; KVM</span>
          <span>&bull;</span>
          <span>99.9% Uptime Guarantee</span>
        </div>
      </div>
    </footer>
  );
}
