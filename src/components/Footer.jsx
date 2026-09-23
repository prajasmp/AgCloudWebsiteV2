import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <div className="brand">
            <img src="/assets/agcloud-logo.png" alt="AG Cloud" className="brand-logo" />
            <span>AG CLOUD</span>
          </div>
          <p className="footer-desc">
            Premium hosting, built for speed, reliability and serious communities.
          </p>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/terms">Terms</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/privacy">Privacy</Link>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/track-order">Track Order</Link>
          <a href="https://dsc.gg/agcloud" target="_blank" rel="noopener noreferrer">
            Discord Community
          </a>
          <a href="mailto:support@agcloud.fun">Email Support</a>
        </div>
      </div>

      <div className="copyright container">
        © {new Date().getFullYear()} AG Cloud Hosting. All rights reserved.
      </div>
    </footer>
  );
}
