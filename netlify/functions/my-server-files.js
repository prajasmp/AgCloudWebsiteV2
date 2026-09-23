import { requireAuthenticatedUser } from './lib/firebaseAdmin.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import {
  listFiles, getFileContents, writeFileContents, createFolder,
  renameFile, deleteFile, getUploadUrl
} from './lib/pterodactylService.js';
import { getAllServersFromStore, addServerToStore } from './lib/devStore.js';

function sanitizePath(filePath) {
  if (!filePath) return '/';
  if (filePath.includes('..') || filePath.includes('\\')) {
    throw new Error('Invalid path: Directory traversal not allowed.');
  }
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
}

export async function handler(event, context) {
  try {
    const { authUser, role } = await requireAuthenticatedUser(event.headers);
    let params = {};
    if (event.httpMethod === 'POST') {
      params = JSON.parse(event.body || '{}');
    } else {
      params = event.queryStringParameters || {};
    }

    const { serverId, action = 'list', directory = '/', filePath, content, folderName, oldName, newName, fileName } = params;

    if (!serverId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing serverId parameter' }) };
    }

    const isAdmin = role === 'owner' || role === 'admin';

    let server = getAllServersFromStore().find(
      s => s.id === serverId || s.panel_server_id === serverId || s.panel_uuid === serverId
    );
    if (!server && isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('servers')
          .select('*')
          .or(`id.eq.${serverId},panel_server_id.eq.${serverId}`)
          .maybeSingle();
        if (data) server = data;
      } catch (err) {
        console.warn('DB fetch server warning:', err.message);
      }
    }

    if (!server) {
      server = {
        id: serverId,
        owner_uid: authUser.uid,
        owner_email: authUser.email,
        panel_server_id: serverId.replace('srv_', '') || '1001',
        panel_uuid: `srv-dev-${serverId}`,
        server_name: 'AG Minecraft Server'
      };
      addServerToStore(server);
    }

    if (!isAdmin && server.owner_uid !== authUser.uid) {
      console.warn(`[Security Alert] User ${authUser.email} (${authUser.uid}) attempted unauthorized file action '${action}' on server ${serverId}`);
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this server' }) };
    }

    const targetIdentifier = server.panel_uuid || server.panel_server_id || serverId;

    if (action === 'list') {
      const cleanDir = sanitizePath(directory);
      const files = await listFiles(targetIdentifier, cleanDir);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: cleanDir, files })
      };
    }

    if (action === 'read') {
      const cleanFile = sanitizePath(filePath);
      const fileData = await getFileContents(targetIdentifier, cleanFile);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: cleanFile, content: fileData })
      };
    }

    if (action === 'write') {
      const cleanFile = sanitizePath(filePath);
      await writeFileContents(targetIdentifier, cleanFile, content || '');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, filePath: cleanFile })
      };
    }

    if (action === 'createFolder') {
      const cleanDir = sanitizePath(directory);
      await createFolder(targetIdentifier, cleanDir, folderName);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, folderName })
      };
    }

    if (action === 'rename') {
      const cleanDir = sanitizePath(directory);
      await renameFile(targetIdentifier, cleanDir, oldName, newName);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, oldName, newName })
      };
    }

    if (action === 'delete') {
      const cleanDir = sanitizePath(directory);
      await deleteFile(targetIdentifier, cleanDir, fileName);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, fileName })
      };
    }

    if (action === 'getUploadUrl') {
      const result = await getUploadUrl(targetIdentifier);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Unknown file action: ${action}` }) };
  } catch (err) {
    console.error('my-server-files error:', err);
    return {
      statusCode: err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : err.message.includes('Invalid path') ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
}
