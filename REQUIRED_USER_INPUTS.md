# DETAILS I MUST PROVIDE TO COMPLETE NOVEXHOST DEPLOYMENT

This document lists **only the missing third-party credentials and actions** that cannot be discovered from the repository.

---

## 1. Razorpay Live Payment Gateway (Required for Real Money Transactions)

*The checkout and payment verification flows are 100% verified in test/sandbox mode. To accept real customer payments in production, you must provide:*

1. **`RAZORPAY_KEY_ID`**:
   - **Value Needed**: Your live key starting with `rzp_live_...`.
   - **Where to Get**: [Razorpay Dashboard > Settings > API Keys](https://dashboard.razorpay.com/app/keys) (toggle to **Live Mode**).
   - **Where to Enter**: Cloudflare Pages / Netlify Dashboard Environment Variables.
   - **Is It a Secret**: Public key ID (used in frontend checkout).

2. **`RAZORPAY_KEY_SECRET`**:
   - **Value Needed**: Your live secret key generated alongside the Key ID.
   - **Where to Get**: [Razorpay Dashboard > Settings > API Keys](https://dashboard.razorpay.com/app/keys).
   - **Where to Enter**: Netlify / Cloudflare Secrets Dashboard (backend only).
   - **Is It a Secret**: **STRICT SECRET**.

3. **`RAZORPAY_WEBHOOK_SECRET`**:
   - **Value Needed**: Secret string configured when creating the webhook.
   - **Where to Get**: [Razorpay Dashboard > Settings > Webhooks](https://dashboard.razorpay.com/app/webhooks). Create webhook pointing to `https://your-domain.com/api/payments/webhook` with events `payment.captured`, `order.paid`, `payment.failed`.
   - **Where to Enter**: Netlify / Cloudflare Secrets Dashboard.
   - **Is It a Secret**: **STRICT SECRET**.

---

## 2. Pterodactyl Panel Integration (Required for Automated Game Server / VPS Deployment)

*When omitted, orders complete safely into the internal cluster staging queue with a notice in `/admin`.*

1. **`PTERODACTYL_PANEL_URL`**:
   - **Value Needed**: The FQDN URL of your Pterodactyl panel (e.g. `https://panel.yourdomain.com`).
2. **`PTERODACTYL_APPLICATION_API_KEY`**:
   - **Value Needed**: Token starting with `ptla_...` generated from Pterodactyl Admin > Application API with read/write permissions for Users, Nodes, Allocations, and Servers.
   - **Is It a Secret**: **STRICT SECRET**.

---

## 3. cPanel / WHM Integration (Required for Automated Web Hosting Deployment)

*When omitted, web hosting orders stage in the internal cluster queue without crashing.*

1. **`WHM_HOST`**:
   - **Value Needed**: Dedicated server IP or FQDN where WHM runs (e.g. `https://cpanel.yourdomain.com`).
2. **`WHM_USERNAME`**:
   - **Value Needed**: WHM administrative username (typically `root`).
3. **`WHM_API_TOKEN`**:
   - **Value Needed**: WHM Remote API v1 token generated in WHM > Manage API Tokens with `createacct`, `suspendacct`, `unsuspendacct` privileges.
   - **Is It a Secret**: **STRICT SECRET**.

---

## 4. SMTP Mail Server (Required for Customer Email Notifications)

*When omitted, order receipts and server credentials are logged to the console safely without throwing errors.*

1. **`SMTP_HOST`**: Hostname of your mail server (e.g. `smtp.gmail.com` or `mail.yourdomain.com`).
2. **`SMTP_PORT`**: Port (typically `587` or `465`).
3. **`SMTP_USER`**: Email address used for sending (e.g. `notifications@novexhost.com`).
4. **`SMTP_PASS`**: Mail password or Google App Password.
   - **Is It a Secret**: **STRICT SECRET**.
5. **`SMTP_FROM`**: Sender string (e.g. `"NOVEXHOST Support <notifications@novexhost.com>"`).

---

## 5. Physical Bare-Metal Server Verification (For VDS Machines)

*Automatic bare-metal provisioning is intentionally kept **DISABLED** (`BARE_METAL_AUTO_PROVISION=false`) by default to prevent failed netboot attempts on non-existent hardware.*

- **Action Needed**: When physical servers are racked in the datacenter, verify:
  1. IPMI/BMC controller IP addresses and credentials.
  2. Assigned public dedicated IPv4 subnets and gateway MAC addresses.
  3. Preboot Execution Environment (PXE) network installation images.
- Once physical hardware is verified, you can toggle `BARE_METAL_AUTO_PROVISION=true` in `.env` / Admin Console.
