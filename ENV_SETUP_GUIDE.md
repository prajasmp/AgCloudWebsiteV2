# NOVEXHOST — Verified Environment Variables & Secrets Guide

This document reflects the **real, code-verified** environment variables across the NOVEXHOST repository.

---

## 1. Actual Architecture & Deployment Target

- **Frontend**: Single-Page Application (React 18 + Vite) located in `src/`, compiled to `dist/`.
- **Backend API**: Serverless Functions located in `netlify/functions/*.js` and `netlify/functions/lib/*.js`.
- **Local Development**: Vite server runs on port 3000 (`vite.config.js`). It includes a custom middleware (`netlifyFunctionsDevPlugin`) that executes the functions in `netlify/functions/` locally on `http://localhost:3000/api/*`.
- **Deployment Options**:
  1. **Netlify (Recommended for Full-Stack)**: `netlify.toml` automatically builds the frontend (`dist`) and deploys all serverless functions in `netlify/functions/`.
  2. **Cloudflare Pages (Frontend Only) + Remote Functions**: Cloudflare Pages serves the static bundle (`dist`) with `_redirects` handling SPA routing. API calls route to the backend URL configured in `VITE_API_BASE_URL`.

---

## 2. Environment Variables Verification Table

| Variable Name | Purpose | Where to Obtain | Where to Enter | Secret or Public | Required or Optional | Verification Status |
|---|---|---|---|---|---|---|
| `NODE_ENV` | Sets execution mode (`development` or `production`). In production, strict HMAC and SSL are enforced. | Self-configured | Local `.env`, Hosting dashboard | Public | Optional (defaults to `development`) | **VERIFIED IN CODE** |
| `PUBLIC_URL` | Base URL used to build customer order-tracking links in email receipts. | Domain registrar or host URL | Local `.env`, Hosting dashboard | Public | Optional (defaults to `http://localhost:3000`) | **VERIFIED IN CODE** |
| `VITE_API_BASE_URL` | Base URL of backend API when frontend is hosted separately on Cloudflare Pages. | Backend deployment URL | Local `.env`, Cloudflare build vars | Public | Optional (defaults to relative `""`) | **VERIFIED IN CODE** |
| `RAZORPAY_KEY_ID` | Public Razorpay key ID for initializing client checkout modal. | [Razorpay Dashboard > API Keys](https://dashboard.razorpay.com/app/keys) | Local `.env`, Hosting dashboard | Public | **Required for live payments** | **VERIFIED (TEST MODE PASSES)** |
| `RAZORPAY_KEY_SECRET` | Secret key for backend order creation and HMAC-SHA256 signature verification. | [Razorpay Dashboard > API Keys](https://dashboard.razorpay.com/app/keys) | Local `.env` (server-side only), Secrets dashboard | **STRICT SECRET** | **Required for live payments** | **VERIFIED (TEST MODE PASSES)** |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for verifying incoming Razorpay webhooks (`x-razorpay-signature`). | [Razorpay Dashboard > Webhooks](https://dashboard.razorpay.com/app/webhooks) | Local `.env`, Secrets dashboard | **STRICT SECRET** | Optional in dev / **Required in prod** | **VERIFIED IN TESTS** |
| `PTERODACTYL_PANEL_URL` | Base URL of Pterodactyl panel API. | Pterodactyl installation URL | Local `.env`, Hosting dashboard | Public | Optional (defaults to `https://panel.novexhost.com`) | **VERIFIED (FALLBACK ACTIVE)** |
| `PTERODACTYL_APPLICATION_API_KEY` | Admin API key (`ptla_...`) to create users, servers, and node allocations. | Pterodactyl Admin > Application API | Local `.env`, Secrets dashboard | **STRICT SECRET** | Required for live Pterodactyl auto-provisioning | **VERIFIED (FALLBACK ACTIVE)** |
| `PTERODACTYL_CLIENT_API_KEY` | User API key (`ptlc_...`) for console websockets and server power. | Pterodactyl Account > API Credentials | Local `.env`, Secrets dashboard | **STRICT SECRET** | Optional (falls back to Application Key) | **VERIFIED (FALLBACK ACTIVE)** |
| `PTERODACTYL_NODE_ID` | Target server node ID in Pterodactyl. | Pterodactyl Admin > Nodes | Local `.env`, Hosting dashboard | Public | Optional (defaults to `1`) | **VERIFIED IN CODE** |
| `PTERODACTYL_LOCATION_ID` | Target location ID in Pterodactyl. | Pterodactyl Admin > Locations | Local `.env`, Hosting dashboard | Public | Optional (defaults to `1`) | **VERIFIED IN CODE** |
| `PTERODACTYL_NEST_ID` | Pterodactyl nest category ID. | Pterodactyl Admin > Nests | Local `.env`, Hosting dashboard | Public | Optional (defaults to `1`) | **VERIFIED IN CODE** |
| `PTERODACTYL_MINECRAFT_EGG_ID` | Egg ID for Minecraft servers in Pterodactyl. | Pterodactyl Admin > Nests > Egg | Local `.env`, Hosting dashboard | Public | Optional (defaults to `3`) | **VERIFIED IN CODE** |
| `WHM_HOST` | Hostname or IP of cPanel/WHM server. | Dedicated cPanel/WHM server | Local `.env`, Hosting dashboard | Public | Required for live cPanel auto-provisioning | **VERIFIED (QUEUE ACTIVE)** |
| `WHM_USERNAME` | Administrator or reseller username in WHM. | WHM administrative account | Local `.env`, Hosting dashboard | Public | Optional (defaults to `root`) | **VERIFIED IN CODE** |
| `WHM_API_TOKEN` | WHM Remote API v1 authorization token. | WHM > Manage API Tokens | Local `.env`, Secrets dashboard | **STRICT SECRET** | Required for live cPanel auto-provisioning | **VERIFIED (QUEUE ACTIVE)** |
| `WHM_PORT` | Port for WHM SSL management API. | WHM server port configuration | Local `.env`, Hosting dashboard | Public | Optional (defaults to `2087`) | **VERIFIED IN CODE** |
| `BARE_METAL_AUTO_PROVISION` | Enables automated bare-metal PXE/IPMI netboot deployment. | Datacenter NOC operations | Local `.env`, Hosting dashboard | Public | Optional (MUST remain `false` until verified) | **VERIFIED (SAFELY DISABLED)** |
| `DEFAULT_DATACENTER` | Default datacenter label for physical VDS chassis. | Datacenter NOC agreement | Local `.env`, Hosting dashboard | Public | Optional (defaults to `Equinix Mumbai (BOM1)`) | **VERIFIED IN CODE** |
| `SMTP_HOST` | Outgoing SMTP mail relay server. | Email provider (SendGrid, Postmark, Google) | Local `.env`, Hosting dashboard | Public | Optional (logs to console if absent) | **VERIFIED (FALLBACK ACTIVE)** |
| `SMTP_PORT` | Port for SMTP mail submission. | Email provider documentation | Local `.env`, Hosting dashboard | Public | Optional (defaults to `587`) | **VERIFIED IN CODE** |
| `SMTP_USER` | SMTP authentication username / email. | Email provider account | Local `.env`, Hosting dashboard | Public | Optional (logs to console if absent) | **VERIFIED (FALLBACK ACTIVE)** |
| `SMTP_PASS` | SMTP authentication password or App Password. | Email provider security settings | Local `.env`, Secrets dashboard | **STRICT SECRET** | Optional (logs to console if absent) | **VERIFIED (FALLBACK ACTIVE)** |
| `SMTP_FROM` | Sender display string for customer emails. | Brand specification | Local `.env`, Hosting dashboard | Public | Optional (defaults to NOVEXHOST Support) | **VERIFIED IN CODE** |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase remote PostgreSQL database HTTPS endpoint. | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Hosting dashboard | Public | Optional (in-memory cluster store used if absent) | **VERIFIED (FALLBACK ACTIVE)** |
| `SUPABASE_SERVICE_ROLE_KEY` | Master service role key bypassing PostgreSQL RLS. | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Secrets dashboard | **STRICT SECRET** | Optional (only required if remote Supabase used) | **VERIFIED (FALLBACK ACTIVE)** |
| `VITE_SUPABASE_ANON_KEY` | Client-accessible Supabase anonymous key. | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Vite build environment | Public | Optional | **VERIFIED (FALLBACK ACTIVE)** |
| `VITE_FIREBASE_*` (8 vars) | Client-side Firebase configuration for Admin Console login. | [Firebase Console > Project Settings](https://console.firebase.google.com/) | Local `.env`, Vite build environment | Public | Optional (dev fallbacks hardcoded in `firebase.js`) | **VERIFIED (FALLBACK ACTIVE)** |
| `FIREBASE_CLIENT_EMAIL` | Service account email for server-side token validation. | Firebase Console > Service Accounts | Local `.env`, Secrets dashboard | Public | Optional (client-token fallback active) | **VERIFIED (FALLBACK ACTIVE)** |
| `FIREBASE_PRIVATE_KEY` | Service account RSA private key for server-side admin token validation. | Firebase Console > Service Accounts | Local `.env`, Secrets dashboard | **STRICT SECRET** | Optional (client-token fallback active) | **VERIFIED (FALLBACK ACTIVE)** |
| `ADMIN_EMAILS` | Comma-separated list of authorized administrator email addresses. | Organization owners | Local `.env`, Hosting dashboard | Public | Optional (defaults to developer emails) | **VERIFIED IN CODE** |
| `UPI_RECEIVER_ID` | Fallback UPI VPA for direct UPI intent requests. | UPI merchant account | Local `.env`, Hosting dashboard | Public | Optional (defaults to `billing@novexhost`) | **VERIFIED IN CODE** |
| `UPI_RECEIVER_NAME` | Payee display name for direct UPI intent requests. | Business name | Local `.env`, Hosting dashboard | Public | Optional (defaults to `NOVEXHOST`) | **VERIFIED IN CODE** |

---

## 3. Variables Confirmed Obsolete / Not Used in Repository

The following variables often found in generic hosting checklists are **NOT referenced by the codebase**:
- `CLOUDFLARE_ACCOUNT_ID`: Not used by application code (only used if running external CI/CD scripts).
- `CLOUDFLARE_API_TOKEN`: Not used by application code.
- `CLOUDFLARE_PAGES_PROJECT_NAME`: Not used by application code.
- `DATABASE_URL`: Not used. All database calls route through `@supabase/supabase-js` or `devStore.js`.
- `PORT` / `HOST`: Not used in production.
- `JWT_SECRET` / `SESSION_SECRET`: Not used. Guest checkout requires zero login; admin auth uses Firebase tokens.
- `CORS_ORIGIN`: Not used. Netlify serverless function handlers dynamically assign CORS headers.
- `IPMI_DEFAULT_SUBNET`: Not queried as an environment variable.
