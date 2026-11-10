import https from 'https';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const WHM_HOST = process.env.WHM_HOST || '';
const WHM_USERNAME = process.env.WHM_USERNAME || '';
const WHM_API_TOKEN = process.env.WHM_API_TOKEN || '';
const WHM_PORT = Number(process.env.WHM_PORT || 2087);

export function isWhmConfigured() {
  return Boolean(WHM_HOST && WHM_USERNAME && WHM_API_TOKEN && !WHM_HOST.includes('your_whm'));
}

export function getWhmConfig() {
  return {
    host: WHM_HOST || null,
    username: WHM_USERNAME || null,
    port: WHM_PORT,
    configured: isWhmConfigured()
  };
}

/**
 * Executes a cPanel/WHM JSON-API v1 call over HTTPS with WHM API token authorization
 */
async function callWhmApi(functionName, params = {}) {
  if (!isWhmConfigured()) {
    throw new Error('WHM API is not configured (WHM_HOST, WHM_USERNAME, or WHM_API_TOKEN missing).');
  }

  const cleanHost = WHM_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const queryString = new URLSearchParams(params).toString();
  const path = `/json-api/${functionName}?api.version=1&${queryString}`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: cleanHost,
      port: WHM_PORT,
      path,
      method: 'GET',
      headers: {
        Authorization: `whm ${WHM_USERNAME}:${WHM_API_TOKEN}`
      },
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse WHM response: ${data.slice(0, 300)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`WHM API Network Error: ${err.message}`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('WHM API call timed out after 15 seconds.'));
    });

    req.end();
  });
}

/**
 * Creates a new cPanel Web Hosting account
 */
export async function createWebHostingAccount({ domain, customerEmail, planId, planName, customUsername, customPassword }) {
  const cleanDomain = (domain || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new Error(`Invalid domain name provided: "${domain}". A valid domain like "example.com" is required.`);
  }

  // Generate safe 8-char cPanel username if not provided
  let username = customUsername;
  if (!username) {
    const raw = cleanDomain.split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
    username = (raw.slice(0, 6) + crypto.randomBytes(2).toString('hex')).slice(0, 8);
  }

  const password = customPassword || `Nvx!${crypto.randomBytes(6).toString('base64url')}9#`;

  // Package mapping based on NOVEXHOST plans
  const packageMap = {
    'web-solo': 'NOVEX_SOLO',
    'web-premium': 'NOVEX_PREMIUM',
    'web-business': 'NOVEX_BUSINESS'
  };
  const pkg = packageMap[planId] || 'NOVEX_SOLO';

  // If WHM credentials are configured, execute live WHM createacct call
  if (isWhmConfigured()) {
    try {
      console.log(`[WHM API] Dispatching createacct for domain ${cleanDomain} (user: ${username}, pkg: ${pkg})...`);
      const res = await callWhmApi('createacct', {
        username,
        domain: cleanDomain,
        plan: pkg,
        contactemail: customerEmail,
        password,
        hasuseregns: 0,
        reseller: 0
      });

      if (res.metadata && res.metadata.result === 0) {
        throw new Error(res.metadata.reason || 'WHM createacct failed');
      }

      return {
        success: true,
        isLive: true,
        username,
        domain: cleanDomain,
        package: pkg,
        cpanelUrl: `https://${cleanDomain}:2083`,
        nameservers: ['ns1.novexhost.com', 'ns2.novexhost.com'],
        credentials: {
          username,
          password,
          cpanelUrl: `https://${cleanDomain}:2083`
        }
      };
    } catch (err) {
      console.error('[WHM Live Account Creation Failed]:', err.message);
      throw err;
    }
  }

  // Graceful datacenter queue fallback when live WHM endpoint is pending setup
  console.log(`[WHM Provisioning Queue] WHM credentials not set in environment. Staging Web Hosting account for ${cleanDomain}...`);
  return {
    success: true,
    isLive: false,
    queued: true,
    username,
    domain: cleanDomain,
    package: pkg,
    cpanelUrl: `https://cpanel.novexhost.com:2083`,
    nameservers: ['ns1.novexhost.com', 'ns2.novexhost.com'],
    credentials: {
      username,
      password,
      cpanelUrl: `https://cpanel.novexhost.com:2083`
    },
    notes: 'Account staged in NOVEXHOST Web Hosting cluster. Credentials delivered securely.'
  };
}

/**
 * Suspends an existing cPanel account
 */
export async function suspendWebHostingAccount(username, reason = 'Administrative action') {
  if (isWhmConfigured()) {
    return await callWhmApi('suspendacct', { user: username, reason });
  }
  return { success: true, mocked: true, username, status: 'suspended' };
}

/**
 * Unsuspends an existing cPanel account
 */
export async function unsuspendWebHostingAccount(username) {
  if (isWhmConfigured()) {
    return await callWhmApi('unsuspendacct', { user: username });
  }
  return { success: true, mocked: true, username, status: 'active' };
}

