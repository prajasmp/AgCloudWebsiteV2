import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, RefreshCw, Lock, Mail, MessageSquare } from 'lucide-react';

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
        <h3>24-hour refund window</h3>
        <p>
          A refund request is valid only during the first 24 hours after the purchase time. Requests submitted after 24 hours are not eligible for a refund.
        </p>
        <h3>Eligible cases</h3>
        <p>
          Within the first 24 hours, a refund may be approved when AG Cloud is unable to provide the purchased service because of a verified server-side or infrastructure issue caused by us.
        </p>
        <h3>Non-refundable cases</h3>
        <p>
          Refunds are not provided for change of mind, accidental purchase, incorrect plan selection, customer-side configuration problems, policy violations, abuse, suspended accounts, used resources, domain registrations, or incorrect and fraudulent payment details.
        </p>
        <h3>How to request</h3>
        <p>
          Create a Discord support ticket within 24 hours and provide your order ID, transaction ID and a clear description of the issue. All requests are reviewed manually before approval.
        </p>
      </>
    );
  } else if (path.includes('privacy')) {
    title = 'Privacy Policy';
    icon = Lock;
    content = (
      <>
        <h3>Data collection</h3>
        <p>
          We collect Google account profile information, order details and payment references only to operate accounts, verify purchases and provide support. We do not store your Google password.
        </p>
        <h3>Data protection</h3>
        <p>
          Access to order records is strictly limited to the account owner and authorized AG Cloud staff members.
        </p>
      </>
    );
  } else if (path.includes('contact')) {
    title = 'Contact AG Cloud';
    icon = Mail;
    content = (
      <>
        <div className="contact-card glass-card">
          <p>
            ✉️ Email Support: <strong>support@agcloud.fun</strong>
          </p>
          <p>
            For the fastest support, custom server orders, and domain registrations, join our Discord community server and open a support ticket.
          </p>
          <a
            className="primary-btn glow-btn inline-btn"
            href="https://dsc.gg/agcloud"
            target="_blank"
            rel="noreferrer"
          >
            <MessageSquare size={18} /> Contact via Discord
          </a>
        </div>
      </>
    );
  } else {

    content = (
      <>
        <h3>Service use</h3>
        <p>
          AG Cloud services must be used lawfully and within the limits of the selected plan. Fraud, payment abuse, illegal content, attacks, malware, spam, cryptocurrency mining without written approval, or attempts to damage our infrastructure may result in immediate suspension or termination without compensation.
        </p>
        <h3>Payments and activation</h3>
        <p>
          All paid orders are activated only after manual payment verification. Submitting a transaction ID does not guarantee approval. False, reused, edited, reversed, or unverifiable payment details may be rejected and the related account may be restricted.
        </p>
        <h3>Renewals and data</h3>
        <p>
          Customers are responsible for renewing services before expiry and maintaining their own backups. Expired or unpaid services may be suspended and their data may later be permanently deleted.
        </p>
        <h3>Free plans</h3>
        <p>
          Boost and invite plans remain active only while their eligibility requirements continue to be met. Fake, alternate, token, join-for-join, or otherwise manipulated invites are not accepted.
        </p>
        <h3>Availability</h3>
        <p>
          Service locations, hardware and capacity are subject to availability. The 4 GB Ryzen VPS option is offered only when stock is available.
        </p>
      </>
    );
  }

  const IconComp = icon;

  return (
    <section className="section top-space">
      <div className="container legal-container glass-card glow-border">
        <div className="legal-head">
          <IconComp size={32} className="text-cyan" />
          <span className="badge-subtitle">AG Cloud Hosting</span>
          <h1>{title}</h1>
        </div>
        <div className="legal-body">{content}</div>
      </div>
    </section>
  );
}
