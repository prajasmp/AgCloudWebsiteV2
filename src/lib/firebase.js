import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB6hFGmjsowcYxC33JOB-QlBTePk2QwjAk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ag-cloud-a4a6d.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://ag-cloud-a4a6d-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ag-cloud-a4a6d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ag-cloud-a4a6d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "846289322228",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:846289322228:web:37668e544a58d9431b5ea1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TRH1Q7Z9FP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged };
