import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  auth,
  googleProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from '../lib/firebase';

import { syncUserWithBackend } from '../services/api';

const AuthContext = createContext();

const PRIMARY_ADMIN_EMAIL = 'r26377269@gmail.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ag_cloud_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem('ag_cloud_user_role');
      if (savedRole) return savedRole;
    } catch (e) {}
    if (user?.email && user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return 'owner';
    }
    return 'customer';
  });

  const syncUserToDatabase = async (userObj) => {
    if (!userObj) return;

    localStorage.setItem('ag_cloud_user', JSON.stringify(userObj));

    try {
      const res = await syncUserWithBackend(userObj);
      if (res && res.role) {
        setUserRole(res.role);
        localStorage.setItem('ag_cloud_user_role', res.role);
      } else if (userObj.email && (
        userObj.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
        userObj.email.toLowerCase() === 'anand@agcloud.fun'
      )) {
        setUserRole('owner');
        localStorage.setItem('ag_cloud_user_role', 'owner');
      }
    } catch (err) {
      console.warn('User database sync warning:', err.message || err);
      if (userObj.email && userObj.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
        setUserRole('owner');
        localStorage.setItem('ag_cloud_user_role', 'owner');
      }
    }
  };

  useEffect(() => {

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const gUser = {
            uid: result.user.uid,
            displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
            email: result.user.email,
            photoURL: result.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.displayName || 'G')}&background=0284c7&color=ffffff&bold=true`
          };
          setUser(gUser);
          await syncUserToDatabase(gUser);
        }
      })
      .catch((err) => {
        console.warn('Firebase getRedirectResult error:', err);
      });

    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken().catch(() => null);
        const gUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'G')}&background=0284c7&color=ffffff&bold=true`,
          idToken
        };
        setUser(gUser);
        await syncUserToDatabase(gUser);
      }
    });

    return () => unsubscribeFirebase();
  }, []);

  const loginWithGoogle = async () => {
    if (authLoading) return;
    setAuthLoading(true);

    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error('Firebase Google redirect sign-in failed:', err?.code, err?.message);
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setUserRole('customer');
    localStorage.removeItem('ag_cloud_user');
    localStorage.removeItem('ag_cloud_user_role');
  };

  const isPrimaryOwner = Boolean(
    user?.email && user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
  );

  const isAdmin = Boolean(
    isPrimaryOwner ||
    userRole === 'owner' ||
    userRole === 'admin' ||
    (user?.email && (
      user.email.toLowerCase() === 'anand@agcloud.fun' ||
      user.email.toLowerCase() === 'dexomine2000@gmail.com'
    ))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authLoading,
        loginWithGoogle,
        logout,
        isAdmin,
        isPrimaryOwner,
        userRole,
        setUserRole,
        isSupabaseConfigured: isSupabaseConfigured()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
