import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { debugLog } from '../lib/debugLog.js';

const AuthContext = createContext(null);

function getRedirectBaseUrl() {
  if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://shopeto.org';
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      // #region agent log
      debugLog('AuthContext.jsx:getSession', 'getSession_result', {
        hasSession: !!data?.session,
        errorMessage: error?.message ?? null
      }, 'H3');
      // #endregion
      if (!isMounted) return;
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const baseUrl = getRedirectBaseUrl();

  const value = {
    session,
    user,
    loading,
    justRegistered,
    clearJustRegistered: () => setJustRegistered(false),
    setJustRegistered,
    signIn: (params) => supabase.auth.signInWithPassword(params),
    signUp: (params) =>
      supabase.auth.signUp({
        ...params,
        options: { emailRedirectTo: baseUrl }
      }),
    signOut: () => supabase.auth.signOut(),
    resetPasswordForEmail: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/update-password`
      }),
    signInWithOtp: (params) =>
      supabase.auth.signInWithOtp({
        ...params,
        options: { emailRedirectTo: baseUrl }
      })
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
