const FIREBASE_AUTH_ORIGIN = 'https://ag-cloud-a4a6d.firebaseapp.com';

const isFirebaseAuthPath = (pathname) =>
  pathname === '/__/auth' || pathname.startsWith('/__/auth/');

export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);

    if (isFirebaseAuthPath(requestUrl.pathname)) {
      const firebaseUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, FIREBASE_AUTH_ORIGIN);
      const firebaseRequest = new Request(firebaseUrl, request);
      return fetch(firebaseRequest, { redirect: 'manual' });
    }

    return env.ASSETS.fetch(request);
  },
};
