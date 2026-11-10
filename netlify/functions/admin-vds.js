import { verifyFirebaseToken, isAuthorizedAdmin } from './lib/firebaseAdmin.js';
import { getAllPhysicalMachines, setPhysicalMachines, updatePhysicalMachine, getAllVdsRecords, getAllOrdersFromStore, updateOrderInStore } from './lib/devStore.js';
import { DEFAULT_PHYSICAL_INVENTORY, allocatePhysicalMachine, startBareMetalProvisioning } from './lib/bareMetalService.js';
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

    // Seed default inventory if store is empty
    let machines = getAllPhysicalMachines();
    if (!machines || machines.length === 0) {
      machines = setPhysicalMachines([...DEFAULT_PHYSICAL_INVENTORY]);
    }

    if (event.httpMethod === 'GET') {
      const vdsRecords = getAllVdsRecords();
      const allOrders = getAllOrdersFromStore();
      const vdsOrders = allOrders.filter(o => o.plan_id?.startsWith('vds-'));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          machines,
          vdsRecords,
          vdsOrders
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, machineId, orderId, status, ipAddress, notes } = body;

      if (action === 'update_machine' && machineId) {
        const updated = updatePhysicalMachine(machineId, {
          ...(status ? { status } : {}),
          ...(ipAddress ? { ipPool: [ipAddress] } : {}),
          ...(notes ? { notes } : {})
        });
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, machine: updated })
        };
      }

      if (action === 'assign_hardware' && machineId && orderId) {
        updatePhysicalMachine(machineId, { status: 'allocated', allocatedOrderId: orderId });
        updateOrderInStore(orderId, { machine_id: machineId, provisioning_status: 'provisioning' });
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, message: `Machine ${machineId} assigned to order ${orderId}` })
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
    console.error('admin-vds error:', err);
    return {
      statusCode: err.message?.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}

