import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError] = useState(
    isSupabaseConfigured
      ? null
      : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env',
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function loadProfile(user) {
      if (!user) {
        if (active) setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.error(error);
        setProfile(null);
        return;
      }
      setProfile(data);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      loadProfile(data.session?.user).finally(() => {
        if (active) setLoading(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      configError,
      isAdmin: profile?.role === 'admin' && profile?.status === 'active',
      signIn: (email, password) => {
        if (!supabase) {
          return Promise.resolve({ error: { message: configError } });
        }
        return supabase.auth.signInWithPassword({ email, password });
      },
      signOut: () => (supabase ? supabase.auth.signOut() : Promise.resolve()),
    }),
    [session, profile, loading, configError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
