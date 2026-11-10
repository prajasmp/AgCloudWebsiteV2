import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return transporter;
}

function getAquaEmailWrapper(title, contentHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 30px auto; background-color: #0b1526; border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.15); }
    .header { background: linear-gradient(135deg, #04101e 0%, #082238 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid rgba(6, 182, 212, 0.2); }
    .logo-text { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; }
    .logo-accent { color: #00f2fe; }
    .tagline { color: #38bdf8; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; font-weight: 600; }
    .body-content { padding: 36px 30px; color: #cbd5e1; font-size: 15px; line-height: 1.7; }
    .highlight-card { background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: #94a3b8; font-size: 13px; }
    .stat-value { color: #ffffff; font-weight: 600; font-size: 14px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #00f2fe 0%, #06b6d4 100%); color: #030712 !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; margin-top: 20px; text-align: center; box-shadow: 0 0 20px rgba(0, 242, 254, 0.4); }
    .footer { background-color: #060b13; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .footer a { color: #06b6d4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-text">NOVEX<span class="logo-accent">HOST</span></h1>
      <div class="tagline">Next-Generation Cloud &amp; VPS Hosting</div>
    </div>
    <div class="body-content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} NOVEXHOST Inc. All rights reserved.</p>
      <p>High Performance Game Servers &bull; NVMe Cloud VPS &bull; Enterprise DDoS Protection</p>
      <p><a href="https://novexhost.com/track-order">Track Orders</a> &bull; <a href="https://novexhost.com/terms">Terms of Service</a> &bull; <a href="https://novexhost.com/contact">24/7 Support</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendEmail({ to, subject, html }) {
  const from = process.env.SMTP_FROM || 'NOVEXHOST Support <notifications@novexhost.com>';

  const mailOptions = {
    from,
    to,
    subject: `[NOVEXHOST] ${subject}`,
    html
  };

  const client = getTransporter();
  if (client) {
    try {
      const info = await client.sendMail(mailOptions);
      console.log(`[Email Sent] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Email Error]:', err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[Email Mock (Configure SMTP to deliver live)]: To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }
}

// 1. Order Confirmation (Waiting for payment)
export async function sendOrderConfirmationEmail(order) {
  const trackingUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track-order?id=${order.id}&token=${order.tracking_token}`;
  const html = getAquaEmailWrapper('Order Placed Successfully', `
    <h2 style="color: #ffffff; margin-top: 0;">Order Received: <span style="color: #00f2fe;">${order.id}</span></h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>Thank you for choosing NOVEXHOST. Your hosting package configuration has been reserved.</p>
    <div class="highlight-card">
      <div class="stat-row"><span class="stat-label">Plan</span><span class="stat-value">${order.plan_name}</span></div>
      <div class="stat-row"><span class="stat-label">Amount</span><span class="stat-value">₹${order.amount} INR</span></div>
      <div class="stat-row"><span class="stat-label">Server Name</span><span class="stat-value">${order.server_name || 'Standard Node'}</span></div>
      <div class="stat-row"><span class="stat-label">Payment Status</span><span class="stat-value" style="color: #fbbf24;">${order.payment_status?.toUpperCase()}</span></div>
    </div>
    <p>Your server will be automatically provisioned within seconds of completing payment through Razorpay.</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="btn">View Order &amp; Track Status &rarr;</a>
    </div>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Order Received: ${order.id}`, html });
}

// 2. Payment Confirmation
export async function sendPaymentConfirmationEmail(order) {
  const trackingUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track-order?id=${order.id}&token=${order.tracking_token}`;
  const html = getAquaEmailWrapper('Payment Verified Successfully', `
    <h2 style="color: #ffffff; margin-top: 0;">Payment Confirmed! &check;</h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>We have successfully received your payment of <strong>₹${order.amount} INR</strong> via Razorpay.</p>
    <div class="highlight-card">
      <div class="stat-row"><span class="stat-label">Order Reference</span><span class="stat-value">${order.id}</span></div>
      <div class="stat-row"><span class="stat-label">Razorpay Payment ID</span><span class="stat-value" style="color: #00f2fe;">${order.razorpay_payment_id || 'Captured'}</span></div>
      <div class="stat-row"><span class="stat-label">Plan</span><span class="stat-value">${order.plan_name}</span></div>
      <div class="stat-row"><span class="stat-label">Amount Paid</span><span class="stat-value">₹${order.amount} INR</span></div>
      <div class="stat-row"><span class="stat-label">Status</span><span class="stat-value" style="color: #34d399;">PAID</span></div>
    </div>
    <p>Our automated deployment engine is now assembling your high-performance server environment.</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="btn">Live Server Deployment Tracker &rarr;</a>
    </div>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Payment Confirmed: ${order.id} (₹${order.amount} INR)`, html });
}

// 3. Deployment Started
export async function sendDeploymentStartedEmail(order) {
  const trackingUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track-order?id=${order.id}&token=${order.tracking_token}`;
  const html = getAquaEmailWrapper('Automated Server Deployment Started', `
    <h2 style="color: #ffffff; margin-top: 0;">Server Provisioning In Progress &bull;</h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>Great news! Your dedicated slot on our high-speed node cluster is now being provisioned.</p>
    <div class="highlight-card">
      <div class="stat-row"><span class="stat-label">Server</span><span class="stat-value">${order.server_name || order.plan_name}</span></div>
      <div class="stat-row"><span class="stat-label">Node Status</span><span class="stat-value" style="color: #00f2fe;">Allocating Port &amp; Memory</span></div>
      <div class="stat-row"><span class="stat-label">Deployment Status</span><span class="stat-value" style="color: #38bdf8;">PROVISIONING</span></div>
    </div>
    <p>You can track the live installation logs and node connection details via the secure portal:</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="btn">Open Deployment Console &rarr;</a>
    </div>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Deploying Server: ${order.id}`, html });
}

// 4. Server Successfully Deployed
export async function sendServerReadyEmail(order, serverDetails) {
  const panelUrl = process.env.PTERODACTYL_PANEL_URL || 'https://panel.novexhost.com';
  const trackingUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track-order?id=${order.id}&token=${order.tracking_token}`;
  const html = getAquaEmailWrapper('Your Server Is Live!', `
    <h2 style="color: #ffffff; margin-top: 0;">🚀 Your Server is Active &amp; Ready!</h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>Your NOVEXHOST server environment has finished deploying and is online.</p>
    <div class="highlight-card">
      <div class="stat-row"><span class="stat-label">Server Name</span><span class="stat-value">${serverDetails.server_name || order.server_name}</span></div>
      <div class="stat-row"><span class="stat-label">Connection IP</span><span class="stat-value" style="color: #00f2fe; font-family: monospace;">${serverDetails.ip || 'Assigned'}:${serverDetails.port || ''}</span></div>
      <div class="stat-row"><span class="stat-label">Panel Server ID</span><span class="stat-value">${serverDetails.panel_server_id || order.panel_server_id}</span></div>
      <div class="stat-row"><span class="stat-label">Allocated RAM</span><span class="stat-value">${serverDetails.memory_mb ? (serverDetails.memory_mb / 1024) + ' GB' : 'Configured'}</span></div>
      <div class="stat-row"><span class="stat-label">Status</span><span class="stat-value" style="color: #34d399; font-weight: 700;">ONLINE (ACTIVE)</span></div>
    </div>
    <p>You can manage files, view console logs, install plugins, and reboot your server anytime through the NOVEXHOST Control Panel.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${panelUrl}" class="btn" style="margin-right: 12px;">Open Control Panel &rarr;</a>
      <a href="${trackingUrl}" style="color: #38bdf8; font-size: 13px; font-weight: 600; text-decoration: underline; margin-left: 10px;">View Tracking Details</a>
    </div>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Server Online: ${serverDetails.server_name || order.plan_name} is Ready!`, html });
}

// 5. Deployment Failure
export async function sendDeploymentFailureEmail(order, errorReason) {
  const trackingUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track-order?id=${order.id}&token=${order.tracking_token}`;
  const html = getAquaEmailWrapper('Action Needed: Server Deployment Queue', `
    <h2 style="color: #ef4444; margin-top: 0;">Deployment Delayed - Notice</h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>Your payment for order <strong>${order.id}</strong> is verified and secure. However, our automated deployment experienced a node capacity or configuration delay:</p>
    <div class="highlight-card" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08);">
      <div class="stat-row"><span class="stat-label">Reason</span><span class="stat-value" style="color: #f87171;">${errorReason || 'Node allocation queue pending'}</span></div>
      <div class="stat-row"><span class="stat-label">Payment Status</span><span class="stat-value" style="color: #34d399;">PAID &amp; SECURE</span></div>
      <div class="stat-row"><span class="stat-label">Deployment Status</span><span class="stat-value" style="color: #fbbf24;">RETRY QUEUED</span></div>
    </div>
    <p>Our automated systems or systems administrator will retry provisioning immediately. You will <strong>not</strong> be charged again.</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="btn">Check Live Order Status &rarr;</a>
    </div>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Deployment Notice: Order ${order.id}`, html });
}

// 6. Refund Updates
export async function sendRefundUpdateEmail(order, refundDetails) {
  const html = getAquaEmailWrapper('Refund Processed', `
    <h2 style="color: #ffffff; margin-top: 0;">Refund Status Update</h2>
    <p>Hello <strong>${order.user_name || 'Customer'}</strong>,</p>
    <p>A refund has been initiated for your order <strong>${order.id}</strong> through Razorpay.</p>
    <div class="highlight-card">
      <div class="stat-row"><span class="stat-label">Refund Amount</span><span class="stat-value" style="color: #00f2fe;">₹${refundDetails.amount || order.amount} INR</span></div>
      <div class="stat-row"><span class="stat-label">Refund Reference</span><span class="stat-value">${refundDetails.refundId || 'Standard Refund'}</span></div>
      <div class="stat-row"><span class="stat-label">Destination</span><span class="stat-value">Original Payment Method (UPI / Bank)</span></div>
      <div class="stat-row"><span class="stat-label">Timeline</span><span class="stat-value">Typically 2-5 business days</span></div>
    </div>
    <p>If you have any questions, our support team is available 24/7 on Discord or via our contact page.</p>
  `);
  return sendEmail({ to: order.user_email || order.contact_email, subject: `Refund Update: Order ${order.id}`, html });
}
