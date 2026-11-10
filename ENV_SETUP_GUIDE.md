# NOVEXHOST — Environment Variables & Secrets Setup Guide

This document provides a comprehensive audit and configuration reference for all environment variables utilized across the **NOVEXHOST** platform.

---

## 1. Frontend Client vs Server-Side Secrets Separation

Security boundary enforcement:
- **Client-Side Variables (`VITE_*`)**:
  - Embedded into the compiled JavaScript bundle (`dist/assets/*.js`) during Vite build.
  - Visible to any user inspecting browser network requests or source maps.
  - **Permitted**: Public API endpoints, Firebase Web Client credentials, Supabase Anon Keys (protected by PostgreSQL Row Level Security).
  - **Strictly Prohibited**: Never assign server secret keys, database master passwords, or payment gateway secrets to any `VITE_` variable.
- **Server-Side Secrets (Backend / Netlify Functions / Cloudflare Secrets)**:
  - Accessible only within serverless runtime execution environments.
  - **Required**: Razorpay private secrets, WHM API tokens, Pterodactyl Application tokens, SMTP app passwords, and Supabase Service Role keys.

---

## 2. Complete Environment Variables Master Matrix

| Variable Name | Purpose | Required? | Where to Get It | Where to Configure It | Safe Example Placeholder | Environments |
|---|---|---|---|---|---|---|
| `NODE_ENV` | Sets execution runtime environment | Optional (defaults to `development`) | Self-configured | Local `.env`, Cloudflare / Netlify dashboard | `production` | Dev, Preview, Prod |
| `PUBLIC_URL` | Canonical root domain for order tracking URLs sent in customer confirmation emails | Optional (defaults to `http://localhost:3000`) | Custom domain registrar / Cloudflare | Local `.env`, Netlify / Cloudflare env | `https://novexhost.com` | Dev, Preview, Prod |
| `VITE_API_BASE_URL` | Backend API base URL if frontend is deployed separately on a CDN/Pages domain | Optional (defaults to relative `""`) | Cloudflare Pages / Backend Host | Local `.env`, Cloudflare Pages build vars | `https://api.novexhost.com` | Preview, Prod |
| `RAZORPAY_KEY_ID` | Razorpay public key ID used for checkout initialization and order generation | **Required for live payments** | [Razorpay Dashboard > Settings > API Keys](https://dashboard.razorpay.com/app/keys) | Local `.env`, Cloudflare / Netlify environment | `rzp_test_1234567890abcd` (or `rzp_live_...`) | Dev, Preview, Prod |
| `RAZORPAY_KEY_SECRET` | Cryptographic secret for server-side Razorpay order creation and HMAC-SHA256 signature verification | **Required for live payments** | [Razorpay Dashboard > Settings > API Keys](https://dashboard.razorpay.com/app/keys) | Local `.env` (server-side only), Netlify / Cloudflare Secrets | `sec_AbCdEf1234567890` | Dev, Preview, Prod |
| `RAZORPAY_WEBHOOK_SECRET` | Secret token used to cryptographically verify Razorpay webhook payloads (`X-Razorpay-Signature`) | Recommended for automated webhooks | [Razorpay Dashboard > Settings > Webhooks](https://dashboard.razorpay.com/app/webhooks) | Local `.env`, Netlify / Cloudflare Secrets | `whsec_9876543210zyxw` | Dev, Preview, Prod |
| `PTERODACTYL_PANEL_URL` | Base URL of Pterodactyl panel for Game & VPS provisioning | Optional (defaults to `https://panel.novexhost.com`) | Pterodactyl Web Interface URL | Local `.env`, Netlify / Cloudflare environment | `https://panel.novexhost.com` | Dev, Preview, Prod |
| `PTERODACTYL_APPLICATION_API_KEY` | Admin API token (`ptla_...`) with permissions to create users, servers, and node allocations | **Required for auto Pterodactyl provisioning** | Pterodactyl Admin > Application API | Local `.env`, Netlify / Cloudflare Secrets | `ptla_SamplePterodactylAppKey123` | Dev, Preview, Prod |
| `PTERODACTYL_CLIENT_API_KEY` | User client API token (`ptlc_...`) for power actions, file manager, and console websockets | Optional (falls back to App Key) | Pterodactyl Account > API Credentials | Local `.env`, Netlify / Cloudflare Secrets | `ptlc_SampleClientKey456` | Dev, Preview, Prod |
| `PTERODACTYL_NODE_ID` | Target server node ID in Pterodactyl for new deployments | Optional (defaults to `1`) | Pterodactyl Admin > Nodes | Local `.env`, Netlify environment | `1` | Dev, Preview, Prod |
| `PTERODACTYL_LOCATION_ID`| Target location ID in Pterodactyl | Optional (defaults to `1`) | Pterodactyl Admin > Locations | Local `.env`, Netlify environment | `1` | Dev, Preview, Prod |
| `PTERODACTYL_NEST_ID` | Pterodactyl nest category ID | Optional (defaults to `1`) | Pterodactyl Admin > Nests | Local `.env`, Netlify environment | `1` | Dev, Preview, Prod |
| `PTERODACTYL_MINECRAFT_EGG_ID` | Pterodactyl egg identifier for Minecraft | Optional (defaults to `3`) | Pterodactyl Admin > Nests > Minecraft | Local `.env`, Netlify environment | `3` | Dev, Preview, Prod |
| `WHM_HOST` | Hostname or IP of cPanel/WHM server | **Required for cPanel auto-provisioning** | Dedicated cPanel/WHM server IP/FQDN | Local `.env`, Netlify / Cloudflare environment | `https://cpanel.novexhost.com` | Dev, Preview, Prod |
| `WHM_USERNAME` | Administrator or reseller username in WHM | **Required for cPanel auto-provisioning** | WHM administrative login | Local `.env`, Netlify environment | `root` | Dev, Preview, Prod |
| `WHM_API_TOKEN` | WHM Remote API v1 Token | **Required for cPanel auto-provisioning** | WHM > Development > Manage API Tokens | Local `.env`, Netlify / Cloudflare Secrets | `TOKEN1234567890ABCDEF` | Dev, Preview, Prod |
| `WHM_PORT` | Port for WHM SSL management API | Optional (defaults to `2087`) | WHM configuration | Local `.env`, Netlify environment | `2087` | Dev, Preview, Prod |
| `BARE_METAL_AUTO_PROVISION` | Enables bare-metal state machine auto-assignment | Optional (defaults to `true`) | Internal NOC settings | Local `.env`, Netlify environment | `true` | Dev, Preview, Prod |
| `DEFAULT_DATACENTER` | Default datacenter string for physical VDS machines | Optional (defaults to `Equinix Mumbai (BOM1)`) | Datacenter NOC agreement | Local `.env`, Netlify environment | `"Equinix Mumbai (BOM1)"` | Dev, Preview, Prod |
| `IPMI_DEFAULT_SUBNET` | Management subnet for IPMI/KVM controllers | Optional (defaults to `10.240.0.0/24`) | Network Operations team | Local `.env`, Netlify environment | `"10.240.0.0/24"` | Dev, Preview, Prod |
| `SMTP_HOST` | Outgoing SMTP mail relay server | Optional (emails logged if absent) | Google Workspace / SendGrid / Postmark / Mailgun | Local `.env`, Netlify / Cloudflare environment | `smtp.gmail.com` | Dev, Preview, Prod |
| `SMTP_PORT` | Port for SMTP mail submission | Optional (defaults to `587`) | Email provider documentation | Local `.env`, Netlify environment | `587` | Dev, Preview, Prod |
| `SMTP_USER` | SMTP authentication user / email | Optional | Email provider account | Local `.env`, Netlify / Cloudflare environment | `notifications@novexhost.com` | Dev, Preview, Prod |
| `SMTP_PASS` | SMTP authentication password or App Password | Optional | Email provider security settings | Local `.env`, Netlify / Cloudflare Secrets | `abcd efgh ijkl mnop` | Dev, Preview, Prod |
| `SMTP_FROM` | RFC 5322 formatted sender string | Optional | Brand specification | Local `.env`, Netlify environment | `"NOVEXHOST Support <notifications@novexhost.com>"` | Dev, Preview, Prod |
| `SUPABASE_URL` | Supabase remote PostgreSQL database endpoint | Optional (in-memory cluster store used if absent) | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Netlify / Cloudflare environment | `https://your-proj.supabase.co` | Dev, Preview, Prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Master service role key (bypasses RLS for admin/backend jobs) | Optional (required if using remote Supabase) | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Netlify / Cloudflare Secrets | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Dev, Preview, Prod |
| `VITE_SUPABASE_URL` | Client-accessible Supabase project URL | Optional (client fallback) | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Vite build environment | `https://your-proj.supabase.co` | Dev, Preview, Prod |
| `VITE_SUPABASE_ANON_KEY` | Client-accessible public anonymous key | Optional (client fallback) | [Supabase Dashboard > Settings > API](https://supabase.com/dashboard) | Local `.env`, Vite build environment | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Dev, Preview, Prod |
| `VITE_FIREBASE_API_KEY` | Web API key for Firebase Authentication | Optional (fallback included) | [Firebase Console > Project Settings](https://console.firebase.google.com/) | Local `.env`, Vite build environment | `AIzaSyB6hFGmjsowcYxC33JOB-QlBTePk2QwjAk` | Dev, Preview, Prod |
| `VITE_FIREBASE_AUTH_DOMAIN`| Firebase Auth Domain | Optional (fallback included) | Firebase Console > Project Settings | Local `.env`, Vite build environment | `your-app.firebaseapp.com` | Dev, Preview, Prod |
| `VITE_FIREBASE_PROJECT_ID`| Firebase Project ID | Optional (fallback included) | Firebase Console > Project Settings | Local `.env`, Vite build environment | `novexhost-platform` | Dev, Preview, Prod |
| `ADMIN_EMAILS` | Comma-separated admin whitelist | Optional (defaults to developer emails) | Platform operations | Local `.env`, Netlify environment | `admin@novexhost.com,owner@gmail.com` | Dev, Preview, Prod |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier for Wrangler deployments | Optional (CI/CD only) | [Cloudflare Dashboard](https://dash.cloudflare.com/) URL or Workers overview | GitHub Secrets / local Wrangler | `d8a2f4c6e8b0123456789abcdef01234` | Preview, Prod |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with `Cloudflare Pages: Edit` permissions | Optional (CI/CD only) | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) | GitHub Secrets / CI runner | `vK9x...CloudflareApiToken...` | Preview, Prod |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Name of Cloudflare Pages project | Optional (defaults to `novexhost-platform`) | Cloudflare Pages Dashboard | GitHub Actions / Wrangler config | `novexhost-platform` | Preview, Prod |

---

## 3. Discovered Unused / Not Applicable Variables

The code was inspected for standard variables that some systems require; the following are **NOT REQUIRED** by NOVEXHOST:
- `PORT` / `HOST`: Not required in production. Frontend is a static SPA served via CDN/Wrangler; backend functions are serverless. Vite dev server uses `vite.config.js` port 3000 locally.
- `DATABASE_URL`: Not applicable. Database persistence utilizes Supabase via REST/PostgreSQL API (`@supabase/supabase-js`) rather than Prisma or a direct socket pool.
- `JWT_SECRET` / `SESSION_SECRET`: Not applicable. Customer ordering is completely unauthenticated (zero login friction). Administrative access is cryptographically authenticated via Firebase Auth ID tokens verified server-side.
- `CORS_ORIGIN`: Built-in serverless handlers in `netlify/functions` explicitly set `Access-Control-Allow-Origin: *` with credentials headers for API consumer flexibility.

---

## 4. Local vs Cloudflare Pages vs Netlify Setup

### Local Development
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Run Vite dev server:
   ```bash
   npm run dev
   ```
   *Vite's built-in `netlifyFunctionsDevPlugin()` intercepts `/api/*` and executes serverless functions on `http://localhost:3000` with hot-reload.*

### Deployment Architecture
- **Option A: Netlify (Full Full-Stack Serverless)**
  - Connect GitHub repository.
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`
  - Add server secrets in **Netlify Dashboard > Site configuration > Environment variables**.
- **Option B: Cloudflare Pages (Frontend CDN + Serverless / Remote Backend)**
  - Connect GitHub repository to Cloudflare Pages.
  - Framework preset: `Vite`
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Single-Page Application routing is automatically handled via `public/_redirects`.
  - Add client variables (`VITE_*`) in Cloudflare Pages Build Environment Variables.
  - Route backend API either to Netlify Functions or configure Cloudflare Pages Functions to proxy `/api/*`.
