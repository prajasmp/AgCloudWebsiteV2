import crypto from 'crypto';
import { getTrustedPlan } from './lib/planConfig.js';
import { addOrderToStore } from './lib/devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { createRazorpayOrder, getRazorpayKeyId } from './lib/razorpayClient.js';
import { sendOrderConfirmationEmail } from './lib/emailService.js';

export async function handler(event, context) {
  // CORS & Preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { planId, fullName, email, mobileNumber, serverName, serverRegion } = body;

    // Strict validation
    if (!planId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing plan selection (planId is required).' })
      };
    }

    if (!fullName || !fullName.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Full Name is required for server registration.' })
      };
    }

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A valid email address is required for server delivery.' })
      };
    }

    if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 10) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A valid 10-digit mobile number is required.' })
      };
    }

    const plan = getTrustedPlan(planId);
    if (!plan) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Selected plan is not recognized: ${planId}` })
      };
    }

    // Generate unique order ID and unguessable 64-char crypto tracking token
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `ORD-NVX-${Date.now().toString().slice(-4)}${randomSuffix}`;
    const trackingToken = crypto.randomBytes(24).toString('hex');
    const nowIso = new Date().toISOString();

    // Create Razorpay backend order
    const rzpOrder = await createRazorpayOrder({
      amountInInr: plan.price,
      receipt: orderId,
      notes: {
        orderId,
        planId: plan.id,
        customerEmail: email.trim().toLowerCase(),
        customerName: fullName.trim()
      }
    });

    const orderRecord = {
      id: orderId,
      tracking_token: trackingToken,
      owner_uid: email.trim().toLowerCase(),
      user_name: fullName.trim(),
      user_email: email.trim().toLowerCase(),
      contact_email: email.trim().toLowerCase(),
      mobile: mobileNumber.trim(),
      plan_id: plan.id,
      plan_name: plan.name,
      original_price: plan.originalPrice,
      amount: plan.price,
      currency: 'INR',
      razorpay_order_id: rzpOrder.id,
      razorpay_payment_id: null,
      payment_status: 'PENDING',
      provisioning_status: 'waiting_payment',
      server_name: (serverName && serverName.trim()) ? serverName.trim() : `${plan.name} Node`,
      server_region: serverRegion || 'Mumbai, India',
      duration: plan.duration || '1 Month',
      duration_days: plan.durationDays || 30,
      rejection_reason: null,
      deployment_error: null,
      retry_count: 0,
      created_at: nowIso,
      updated_at: nowIso
    };

    // Store order in devStore (persisted on disk)
    addOrderToStore(orderRecord);

    // Also persist to Supabase if configured
    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').insert(orderRecord);
      } catch (dbErr) {
        console.warn('[DB Order Insert Warning]:', dbErr.message);
      }
    }

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(orderRecord).catch(err => {
      console.warn('[Email Warning]:', err.message);
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        orderId,
        trackingToken,
        razorpayOrderId: rzpOrder.id,
        amount: plan.price,
        amountInPaise: rzpOrder.amount,
        currency: 'INR',
        razorpayKeyId: getRazorpayKeyId(),
        planName: plan.name,
        customer: {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          contact: mobileNumber.trim()
        }
      })
    };
  } catch (err) {
    console.error('[Create Payment Order Error]:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message || 'Failed to initialize payment order.' })
    };
  }
}
