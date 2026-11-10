import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function netlifyFunctionsDevPlugin() {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/') && !req.url.startsWith('/.netlify/functions/')) {
          return next();
        }

        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        let funcName = urlObj.pathname.replace(/^\/(api|\.netlify\/functions)\//, '');

        // Map routes to function file names
        if (funcName === 'payments/create' || funcName === 'payments/create-order') funcName = 'create-payment';
        if (funcName === 'payments/verify') funcName = 'verify-payment';
        if (funcName === 'payments/webhook' || funcName === 'famgateway-webhook') funcName = 'razorpay-webhook';
        if (funcName === 'payments/status') funcName = 'payment-status';
        if (funcName === 'orders/track') funcName = 'track-order';
        if (funcName === 'admin/retry-deployment') funcName = 'admin-retry-deployment';
        if (funcName === 'admin/products') funcName = 'admin-products';
        if (funcName === 'admin/settings') funcName = 'admin-settings';
        if (funcName === 'admin/webhosting') funcName = 'admin-webhosting';
        if (funcName === 'admin/vds') funcName = 'admin-vds';
        if (funcName === 'admin/orders' || funcName === 'admin/orders/action') funcName = 'admin-orders';
        if (funcName === 'admin/approve-order') funcName = 'admin-approve-order';
        if (funcName === 'admin/servers') funcName = 'admin-servers';
        if (funcName === 'admin/metrics') funcName = 'admin-metrics';
        if (funcName === 'admin/admin-users') funcName = 'admin-admin-users';
        if (funcName === 'admin/users') funcName = 'admin-users';
        if (funcName === 'admin/infrastructure') funcName = 'admin-infrastructure';
        if (funcName === 'admin/server-action') funcName = 'admin-server-action';

        if (funcName === 'my-servers/action' || funcName === 'my-server-action') funcName = 'server-action';
        if (funcName === 'my-servers/details') funcName = 'my-server-details';
        if (funcName === 'my-servers/command') funcName = 'my-server-command';
        if (funcName === 'my-servers/console-token') funcName = 'my-server-console-token';
        if (funcName === 'my-servers/files') funcName = 'my-server-files';
        if (funcName === 'my-servers/settings') funcName = 'my-server-settings';
        if (funcName === 'my-orders') funcName = 'my-orders';
        if (funcName === 'my-servers') funcName = 'my-servers';
        if (funcName === 'auth/sync-user') funcName = 'auth-sync-user';

        try {
          let body = '';
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            await new Promise((resolve) => {
              req.on('data', chunk => body += chunk);
              req.on('end', resolve);
            });
          }

          const module = await server.ssrLoadModule(`./netlify/functions/${funcName}.js`);
          const handler = module.handler;

          if (!handler) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Function handler ${funcName} not found` }));
          }

          const event = {
            httpMethod: req.method,
            headers: req.headers,
            queryStringParameters: Object.fromEntries(urlObj.searchParams.entries()),
            body: body
          };

          const result = await handler(event, {});

          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
          }
          res.end(result.body || '');
        } catch (err) {
          console.error(`Local function invocation error (${funcName}):`, err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  server: {
    port: 3000,
    open: false
  }
});
