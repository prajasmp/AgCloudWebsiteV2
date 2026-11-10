import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let razorpayInstance = null;

if (keyId && keySecret && !keyId.includes('your_') && !keySecret.includes('your_')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.warn('[Razorpay] Initialization warning:', err.message);
  }
}

export function getRazorpayKeyId() {
  return keyId || 'rzp_test_placeholder';
}

export function isRazorpayConfigured() {
  return Boolean(razorpayInstance);
}

/**
 * Creates a Razorpay order via Razorpay API SDK
 * Amount must be in subunits (Paise for INR: 1 INR = 100 paise)
 */
export async function createRazorpayOrder({ amountInInr, receipt, notes = {} }) {
  const amountInPaise = Math.round(Number(amountInInr) * 100);

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes
      });
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      };
    } catch (err) {
      console.error('[Razorpay Order Creation Error]:', err);
      throw new Error(`Razorpay Order Creation Failed: ${err.message || 'API error'}`);
    }
  }

  // Development sandbox fallback if live credentials not yet inserted
  console.warn('[Razorpay Test Mode] Live RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set. Generating sandbox Razorpay Order.');
  const mockRzpId = `order_${Math.random().toString(36).substring(2, 16)}`;
  return {
    id: mockRzpId,
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt.slice(0, 40),
    status: 'created',
    isSandbox: true
  };
}

/**
 * Verifies Razorpay payment signature
 * HMAC-SHA256 of (razorpay_order_id + "|" + razorpay_payment_id) using RAZORPAY_KEY_SECRET
 */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  // If secret is set, verify cryptographic signature
  if (keySecret && !keySecret.includes('your_')) {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      return generatedSignature === razorpaySignature;
    } catch (err) {
      console.error('[Razorpay Signature Error]:', err.message);
      return false;
    }
  }

  // If running in development without configured secret, allow valid mock/test signatures
  console.warn('[Razorpay Test Mode] Skipping strict HMAC signature verification because RAZORPAY_KEY_SECRET is not configured.');
  return razorpaySignature.startsWith('test_sig_') || razorpaySignature.length >= 10;
}

/**
 * Verifies Razorpay webhook signature
 * HMAC-SHA256 of raw body using RAZORPAY_WEBHOOK_SECRET
 */
export function verifyWebhookSignature({ rawBody, signature }) {
  if (!webhookSecret || webhookSecret.includes('your_')) {
    console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set. Allowing webhook in development test mode.');
    return true;
  }

  if (!rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch (err) {
    console.error('[Razorpay Webhook Signature Check Error]:', err.message);
    return false;
  }
}

