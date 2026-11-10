# NOVEXHOST — User Action Checklist & Input Requirements

This document provides an actionable, step-by-step checklist of every credential, API key, and dashboard action you must provide to transition NOVEXHOST from development/sandbox mode to live production.

---

## Section 1: Required Before Local Testing
*No third-party accounts are strictly mandatory for local development; the built-in development sandbox mocks all payments and provisions simulated resources in memory.*

- [x] **Node.js Environment** `[VERIFIED]`
  - **Requirement**: Node.js 18+ (verified running Node v22.14.0).
  - **Action**: Run `npm install` and `npm run build` to verify local dependencies.
- [x] **Local `.env` File** `[VERIFIED]`
  - **Requirement**: A valid `.env` file present in the project root.
  - **Action**: Safe defaults are pre-configured in `.env.example`.

---

## Section 2: Required Before Real Payment Testing

### 1. `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
- **Status**: `[NEEDS MY INPUT]`
- **Why It Is Needed**: Initializes the Razorpay checkout modal and enables backend verification of HMAC-SHA256 signatures to confirm customer payments before deployment.
- **Where to Obtain**:
  - Direct URL: [https://dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys)
- **Step-by-Step Instructions**:
  1. Log in to your Razorpay Dashboard.
  2. Toggle to **Test Mode** in the header dropdown.
  3. Navigate to **Account & Settings** > **API Keys**.
  4. Click **Generate Key** (or **Regenerate Key** if you have an existing one).
  5. Copy both the **Key Id** (`rzp_test_...`) and **Key Secret**.
- **Where to Enter**:
  - For local testing: Place in `.env` as `RAZORPAY_KEY_ID=...` and `RAZORPAY_KEY_SECRET=...`.
  - For production: Add to your Cloudflare Pages / Netlify Dashboard under Environment Variables.
- **Is It a Secret?**:
  - `RAZORPAY_KEY_ID`: Public identifier (safe in checkout).
  - `RAZORPAY_KEY_SECRET`: **STRICT SECRET** (never expose to frontend or git).
- **Required Before Live Deployment?**: **YES** (for accepting payments).

---

### 2. `RAZORPAY_WEBHOOK_SECRET`
- **Status**: `[NEEDS MY INPUT]`
- **Why It Is Needed**: Secures asynchronous payment notifications (e.g., if a customer completes UPI in their mobile banking app after closing the browser tab).
- **Where to Obtain**:
  - Direct URL: [https://dashboard.razorpay.com/app/webhooks](https://dashboard.razorpay.com/app/webhooks)
- **Step-by-Step Instructions**:
  1. In Razorpay Dashboard, navigate to **Account & Settings** > **Webhooks**.
  2. Click **Add New Webhook**.
  3. Enter Webhook URL: `https://your-domain.com/api/payments/webhook`.
  4. Enter a secure random string in the **Secret** field.
  5. Under **Active Events**, select:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`
  6. Save the webhook and copy the secret you entered.
- **Where to Enter**:
  - Set as `RAZORPAY_WEBHOOK_SECRET=your_secret` in `.env` and production host.
- **Is It a Secret?**: **YES** (STRICT SECRET).
- **Required Before Live Deployment?**: **YES** (for resilient payment capture).

---

## Section 3: Required Before Automatic Server Provisioning

### 1. Pterodactyl Panel API Key (`PTERODACTYL_APPLICATION_API_KEY`)
- **Category**: Game Servers (Minecraft, Palworld, Rust, GTA V) & Cloud VPS.
- **Status**: `[NEEDS MY INPUT]` (Fallback sandbox active in dev mode).
- **Why It Is Needed**: Automatically creates customer user accounts, allocates ports/IPs, and deploys game servers immediately after payment verification.
- **Where to Obtain**:
  - Direct URL: `https://<your-pterodactyl-panel>/admin/api`
- **Step-by-Step Instructions**:
  1. Log in to your Pterodactyl Panel as an administrator.
  2. Click **Admin Control Panel** (gear icon in the top right).
  3. In the sidebar, navigate to **Application API**.
  4. Click **Create New**.
  5. Grant read and write permissions to:
     - `Users`
     - `Nodes`
     - `Allocations`
     - `Servers`
  6. Click **Create** and immediately copy the token (`ptla_...`).
- **Where to Enter**:
  - Enter as `PTERODACTYL_APPLICATION_API_KEY=ptla_...` in `.env` and hosting environment.
  - Also ensure `PTERODACTYL_PANEL_URL=https://<your-panel-fqdn>` matches your panel.
- **Is It a Secret?**: **YES** (STRICT SECRET).
- **Required Before Live Deployment?**: Required if automatic Pterodactyl deployment is enabled.

---

### 2. cPanel / WHM API Token (`WHM_API_TOKEN`)
- **Category**: Web Hosting (NOVEX SOLO, NOVEX PREMIUM, NOVEX BUSINESS).
- **Status**: `[NEEDS MY INPUT]` (Fallback queue active in dev mode).
- **Why It Is Needed**: Automatically provisions Linux web hosting accounts, sets disk/bandwidth quotas, generates cPanel logins, and triggers AutoSSL upon checkout.
- **Where to Obtain**:
  - Direct URL: `https://<your-whm-server>:2087/cpsess.../scripts/apitokens`
- **Step-by-Step Instructions**:
  1. Log in to your WHM administrative panel (`https://your-server-ip:2087`).
  2. In the left search box, type **Manage API Tokens**.
  3. Click **Generate Token**.
  4. Enter a token name (e.g. `NOVEXHOST-Billing`).
  5. Under Privileges, grant:
     - `Account Creation` (`createacct`)
     - `Account Modification` (`suspendacct`, `unsuspendacct`, `killacct`)
     - `Package Management`
  6. Click **Save** and copy the generated token string.
- **Where to Enter**:
  - Enter as `WHM_API_TOKEN=...`, `WHM_HOST=https://your-whm-domain.com`, and `WHM_USERNAME=root` in `.env` or hosting settings.
- **Is It a Secret?**: **YES** (STRICT SECRET).
- **Required Before Live Deployment?**: Required if automatic cPanel account creation is enabled.

---

### 3. VDS Physical Bare-Metal Server Inventory
- **Category**: Bare-Metal Physical Machines (Ryzen 9 9950X, Ryzen 7 5700G/5800X, Intel Xeon E5-2699/2680/2670 v4).
- **Status**: `[NEEDS MY INPUT]` (6 simulated machine chassis configured in dev store).
- **Why It Is Needed**: Physical bare-metal machines require dedicated hardware chassis IDs, rack locations, dedicated IPv4 blocks, and IPMI management IPs.
- **Step-by-Step Instructions**:
  1. Open your NOVEXHOST Admin Portal at `/admin`.
  2. Navigate to the **VDS Machines** tab.
  3. Review the available chassis fleet.
  4. Click **Add Physical Machine** or update existing chassis with your live IPMI controller IP, BMC credentials, and public IPv4 subnet assignments.
- **Where to Enter**:
  - Admin Portal `/admin` or via environment defaults (`DEFAULT_DATACENTER="Equinix Mumbai (BOM1)"`, `IPMI_DEFAULT_SUBNET="10.240.0.0/24"`).

---

## Section 4: Required Before Production Deployment

### 1. Transactional Email / SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)
- **Status**: `[NEEDS MY INPUT]` (Emails logged to console in dev mode).
- **Why It Is Needed**: Sends aqua-branded invoice receipts, unguessable order-tracking links, and server/cPanel credentials to customers immediately after purchase.
- **Where to Obtain**:
  - Google Workspace / Gmail App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
  - SendGrid / Postmark / Mailgun: Respective developer SMTP credentials.
- **Where to Enter**:
  - Configure `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in production secrets.
- **Is It a Secret?**: `SMTP_PASS` is a **STRICT SECRET**.

---

### 2. Cloudflare Pages Deployment Configuration
- **Status**: `[VERIFIED]` (Wrangler installed and `wrangler.jsonc` + `public/_redirects` configured).
- **Step-by-Step Instructions for Cloudflare Dashboard**:
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
  2. Navigate to **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
  3. Select your GitHub repository (`NOVEXHOST`).
  4. Set Build Settings:
     - **Framework preset**: `Vite`
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
  5. In **Environment Variables**, add:
     - `NODE_VERSION` = `20`
     - `VITE_API_BASE_URL` = `<your-backend-api-url>` (if hosting backend on Netlify or custom server).
  6. Click **Save and Deploy**.

---

## Section 5: Optional Services and Integrations

| Service | Setting Name | Purpose | Default Behavior If Omitted |
|---|---|---|---|
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Remote PostgreSQL cloud database sync | In-memory cluster store (`devStore.js`) stores all active orders, machines, and web accounts locally. |
| Firebase | `VITE_FIREBASE_API_KEY` | Admin dashboard authentication | Pre-configured with fallback development project credentials. |
| Admin Emails | `ADMIN_EMAILS` | Whitelist for `/admin` access | Defaults to `admin@novexhost.com, r26377269@gmail.com, notxlaksly@gmail.com`. |
| Public Base URL | `PUBLIC_URL` | Order tracking link prefix | Defaults to `http://localhost:3000` in dev or `https://novexhost.com` in prod. |

---

## Section 6: Action Status Summary

| Item | Action Required By You | Current Status |
|---|---|---|
| Node.js & Vite Build | None | **VERIFIED** |
| SPA Routing (`_redirects`) | None | **VERIFIED** |
| Wrangler Setup (`wrangler.jsonc`) | None | **VERIFIED** |
| Razorpay Test Mode Keys | Enter test key ID & secret in `.env` | **NEEDS MY INPUT** |
| Razorpay Live Mode Keys | Enter production live credentials before launch | **NEEDS MY INPUT** |
| Pterodactyl Application API Key | Enter your panel URL and `ptla_...` key | **NEEDS MY INPUT** |
| cPanel / WHM API Token | Enter WHM host IP/domain and API token | **NEEDS MY INPUT** |
| SMTP Mail Credentials | Enter SMTP host, user, and password for email delivery | **NEEDS MY INPUT** |
| Cloudflare Git Connection | Connect repository in Cloudflare Pages dashboard | **NEEDS MY INPUT** |
