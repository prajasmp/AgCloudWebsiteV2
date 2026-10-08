const FIREBASE_AUTH_ORIGIN = 'https://ag-cloud-a4a6d.firebaseapp.com';

export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname.startsWith('/__/auth/')) {
      const firebaseUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, FIREBASE_AUTH_ORIGIN);
      return fetch(new Request(firebaseUrl, request), { redirect: 'manual' });
    }

    return env.ASSETS.fetch(request);
  },
};
