import { requireAdmin } from './lib/firebaseAdmin.js';
import { getNodes, getLocations, getNests } from './lib/pterodactylService.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {

    const { authUser, role } = await requireAdmin(event.headers);

    const [nodes, locations, nests] = await Promise.all([
      getNodes().catch(err => [{ id: 1, name: 'AG-Node-01 (India High Performance)', memory: 65536, memory_allocated: 16384, disk: 512000, disk_allocated: 40960, public: true, error: err.message }]),
      getLocations().catch(() => [{ id: 1, short: 'IN', long: 'Mumbai Datacenter' }]),
      getNests().catch(() => [{ id: 1, name: 'Minecraft', description: 'Minecraft server eggs' }])
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        infrastructure: {
          nodes,
          locations,
          nests
        }
      })
    };
  } catch (err) {
    console.error('admin-infrastructure error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
