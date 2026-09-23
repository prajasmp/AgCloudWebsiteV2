import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <section className="section top-space">
      <div className="container success-card glass-card glow-border">
        <div className="status-badge-icon">
          <CheckCircle size={48} className="text-cyan" />
        </div>
        <span className="badge-subtitle">Payment Submitted</span>
        <h1>Your order is pending verification</h1>
        <p className="order-id-tag">
          Order ID: <code>{id}</code>
        </p>
        <p className="subtext">
          AG Cloud staff will verify your UPI transaction ID. You can track the latest activation status in your client dashboard or Discord server.
        </p>
        <div className="actions-row">
          <Link className="primary-btn glow-btn" to="/dashboard">
            Open Dashboard
          </Link>
          <a
            className="secondary-btn"
            href="https://dsc.gg/agcloud"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Support Discord
          </a>
        </div>
      </div>
    </section>
  );
}
