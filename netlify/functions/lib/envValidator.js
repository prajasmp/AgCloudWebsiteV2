/**
 * NOVEXHOST - Environment Configuration Validator
 * Validates required and optional configuration keys without leaking secrets in logs or responses.
 */

export function validateEnvironment() {
  const isProd = process.env.NODE_ENV === 'production';

  const checks = [
    // --- Application & Public ---
    {
      key: 'PUBLIC_URL',
      category: 'Application',
      required: false,
      present: Boolean(process.env.PUBLIC_URL),
      description: 'Canonical public domain used for tracking links in customer emails'
    },
    {
      key: 'NODE_ENV',
      category: 'Application',
      required: false,
      present: Boolean(process.env.NODE_ENV),
      description: 'Runtime environment (development, production, test)'
    },

    // --- Razorpay Payment Gateway ---
    {
      key: 'RAZORPAY_KEY_ID',
      category: 'Payment Gateway',
      required: isProd,
      present: Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('placeholder') && !process.env.RAZORPAY_KEY_ID.includes('your_')),
      description: 'Razorpay API Key ID (rzp_test_... or rzp_live_...)'
    },
    {
      key: 'RAZORPAY_KEY_SECRET',
      category: 'Payment Gateway',
      required: isProd,
      present: Boolean(process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('your_')),
      description: 'Razorpay API Secret Key used for HMAC payment signature validation'
    },
    {
      key: 'RAZORPAY_WEBHOOK_SECRET',
      category: 'Payment Gateway',
      required: false,
      present: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET && !process.env.RAZORPAY_WEBHOOK_SECRET.includes('your_')),
      description: 'Webhook verification secret for Razorpay asynchronous payment events'
    },

    // --- Pterodactyl Provisioning (Game Servers & VPS) ---
    {
      key: 'PTERODACTYL_PANEL_URL',
      category: 'Pterodactyl Provisioning',
      required: false,
      present: Boolean(process.env.PTERODACTYL_PANEL_URL),
      description: 'URL of the Pterodactyl panel (e.g. https://panel.novexhost.com)'
    },
    {
      key: 'PTERODACTYL_APPLICATION_API_KEY',
      category: 'Pterodactyl Provisioning',
      required: false,
      present: Boolean(process.env.PTERODACTYL_APPLICATION_API_KEY && !process.env.PTERODACTYL_APPLICATION_API_KEY.includes('your_')),
      description: 'Application API token (ptla_...) for creating users, servers, and allocations'
    },

    // --- cPanel / WHM Provisioning (Web Hosting) ---
    {
      key: 'WHM_HOST',
      category: 'Web Hosting (WHM)',
      required: false,
      present: Boolean(process.env.WHM_HOST),
      description: 'WHM host domain or IP (e.g. https://cpanel.novexhost.com)'
    },
    {
      key: 'WHM_USERNAME',
      category: 'Web Hosting (WHM)',
      required: false,
      present: Boolean(process.env.WHM_USERNAME),
      description: 'WHM root or reseller administrative username'
    },
    {
      key: 'WHM_API_TOKEN',
      category: 'Web Hosting (WHM)',
      required: false,
      present: Boolean(process.env.WHM_API_TOKEN && !process.env.WHM_API_TOKEN.includes('your_')),
      description: 'WHM API token generated in WHM > Manage API Tokens'
    },

    // --- SMTP Email Delivery ---
    {
      key: 'SMTP_HOST',
      category: 'Email Delivery',
      required: false,
      present: Boolean(process.env.SMTP_HOST),
      description: 'SMTP host (e.g. smtp.gmail.com or mail.novexhost.com)'
    },
    {
      key: 'SMTP_USER',
      category: 'Email Delivery',
      required: false,
      present: Boolean(process.env.SMTP_USER),
      description: 'SMTP username/email'
    },
    {
      key: 'SMTP_PASS',
      category: 'Email Delivery',
      required: false,
      present: Boolean(process.env.SMTP_PASS && !process.env.SMTP_PASS.includes('your_')),
      description: 'SMTP password or App Password'
    },

    // --- Database / Supabase ---
    {
      key: 'SUPABASE_URL',
      category: 'Database',
      required: false,
      present: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      description: 'Supabase project HTTPS endpoint'
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      category: 'Database',
      required: false,
      present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')),
      description: 'Supabase service role secret key for backend database queries'
    },

    // --- Authentication ---
    {
      key: 'ADMIN_EMAILS',
      category: 'Authentication',
      required: false,
      present: Boolean(process.env.ADMIN_EMAILS),
      description: 'Authorized administrator email addresses (comma-separated)'
    }
  ];

  const missingRequired = checks.filter(c => c.required && !c.present).map(c => c.key);
  const missingOptional = checks.filter(c => !c.required && !c.present).map(c => c.key);
  const presentCount = checks.filter(c => c.present).length;

  return {
    isProduction: isProd,
    allRequiredPresent: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    totalConfigured: presentCount,
    totalChecked: checks.length,
    checks: checks.map(c => ({
      key: c.key,
      category: c.category,
      present: c.present,
      required: c.required,
      description: c.description
    }))
  };
}
