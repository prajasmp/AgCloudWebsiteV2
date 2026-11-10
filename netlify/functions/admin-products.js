import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { getAllTrustedPlans, updatePlanPrice } from './lib/planConfig.js';
import { setProductPriceOverride, getProductPriceOverrides } from './lib/devStore.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const authUser = await verifyFirebaseToken(event.headers);

    if (!isAuthorizedAdmin(authUser.email)) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden: Admin access required' })
      };
    }

    if (event.httpMethod === 'GET') {
      const plans = getAllTrustedPlans();
      const overrides = getProductPriceOverrides();

      const mergedPlans = plans.map(p => {
        const override = overrides[p.id];
        return {
          ...p,
          price: override?.price !== undefined ? override.price : p.price,
          isCustomPrice: Boolean(override)
        };
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ products: mergedPlans })
      };
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { planId, price } = body;

      if (!planId || price === undefined || isNaN(price)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Valid planId and numerical price required.' })
        };
      }

      setProductPriceOverride(planId, Number(price));
      updatePlanPrice(planId, Number(price));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          planId,
          price: Number(price),
          message: `Product price for ${planId} updated to ₹${price}`
        })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('[Admin Products Error]:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}

