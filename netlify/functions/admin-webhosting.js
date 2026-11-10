import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { getAllWebHostingAccounts, updateWebHostingAccount, getAllOrdersFromStore, getOrderByIdFromStore } from './lib/devStore.js';
import { suspendWebHostingAccount, unsuspendWebHostingAccount, getWhmConfig } from './lib/whmService.js';
import { executeServerDeployment } from './lib/provisioningService.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
      const accounts = getAllWebHostingAccounts();
      const allOrders = getAllOrdersFromStore();
      const webOrders = allOrders.filter(o => o.plan_id?.startsWith('web-'));
      const whmConfig = getWhmConfig();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          whmConfig,
          accounts,
          webOrders
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, accountId, username, orderId } = body;

      if (action === 'suspend' && username) {
        await suspendWebHostingAccount(username);
        updateWebHostingAccount(accountId, { status: 'suspended' });
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, message: `Account ${username} suspended.` })
        };
      }

      if (action === 'unsuspend' && username) {
        await unsuspendWebHostingAccount(username);
        updateWebHostingAccount(accountId, { status: 'active' });
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, message: `Account ${username} unsuspended.` })
        };
      }

      if (action === 'retry' && orderId) {
        const result = await executeServerDeployment(orderId);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, result })
        };
      }

      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unknown action specified' })
      };
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    console.error('admin-webhosting error:', err);
    return {
      statusCode: err.message?.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}

