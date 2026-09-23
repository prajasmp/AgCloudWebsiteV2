import { verifyFirebaseToken } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { getTrustedPlan } from './lib/planConfig.js';
import { addOrderToStore } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {

    const authUser = await verifyFirebaseToken(event.headers);

    const body = JSON.parse(event.body || '{}');
    const { planId, fullName, mobileNumber, deliveryEmail, paymentProof, serverName } = body;

    if (!planId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: planId' })
      };
    }

    if (!paymentProof) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment screenshot/proof is required to confirm order.' })
      };
    }

    const plan = getTrustedPlan(planId);
    if (!plan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid plan selection: ${planId}` })
      };
    }

    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `ORD-${Date.now().toString().slice(-4)}${randomHex}`;
    const nowIso = new Date().toISOString();

    const orderData = {
      id: orderId,
      owner_uid: authUser.uid,
      user_name: fullName || authUser.name || authUser.email?.split('@')[0] || 'Customer',
      user_email: authUser.email,
      contact_email: deliveryEmail || authUser.email,
      mobile: mobileNumber || '',
      upi_id: '9549549711@fam',
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price,
      duration: plan.duration || '1 Month',
      duration_days: plan.durationDays || 30,
      payment_proof: paymentProof,
      server_name: serverName || `${plan.name} Server`,
      payment_status: 'PENDING',
      provisioning_status: 'waiting_approval',
      rejection_reason: null,
      created_at: nowIso,
      updated_at: nowIso
    };

    addOrderToStore(orderData);

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('orders').insert(orderData);
      } catch (dbErr) {
        console.error('Supabase DB Order Insert Warning:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        orderId,
        status: 'PENDING',
        amount: plan.price,
        duration: plan.duration || '1 Month',
        planName: plan.name,
        message: 'Order submitted successfully. The admin will review your payment. Your server will be created only after payment approval.'
      })
    };
  } catch (err) {
    console.error('[Create Payment Order Error]:', err.message);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
