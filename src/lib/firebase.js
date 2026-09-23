import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB6hFGmjsowcYxC33JOB-QlBTePk2QwjAk",
  authDomain: "ag-cloud-a4a6d.firebaseapp.com",
  projectId: "ag-cloud-a4a6d",
  storageBucket: "ag-cloud-a4a6d.firebasestorage.app",
  messagingSenderId: "846289322228",
  appId: "1:846289322228:web:37668e544a58d9431b5ea1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged };
