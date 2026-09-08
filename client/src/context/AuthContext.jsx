import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { checkSupabaseHealth, getConnectionStatus, setForceDemo } from '../services/dataService';
import { AuthContext } from './auth-context';

const DEMO_ADMIN = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@smartclothing.lk',
  full_name: 'Platform Administrator',
  phone: '0112000000',
  role: 'admin',
  status: 'active',
};

const DEMO_SESSION_KEY = 'smart_clothing_demo_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      return saved ? JSON.parse(saved).user_profile : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState(getConnectionStatus());
  const [configError] = useState(
    isSupabaseConfigured
      ? null
      : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env',
  );

  useEffect(() => {
    let active = true;

    async function initAuth() {
      const isOnline = await checkSupabaseHealth();
      if (active) {
        setConnStatus(getConnectionStatus());
      }

      if (isOnline && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            if (active) setSession(data.session);
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_user_id', data.session.user.id)
              .maybeSingle();
            if (active && prof) {
              setProfile(prof);
            }
          }
        } catch (err) {
          console.warn('Supabase auth session check warning:', err);
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    initAuth();

    let listener = null;
    if (supabase) {
      const authSub = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (nextSession?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', nextSession.user.id)
            .maybeSingle();
          if (active) setProfile(prof || null);
        } else if (!localStorage.getItem(DEMO_SESSION_KEY)) {
          if (active) setProfile(null);
        }
      });
      listener = authSub.data;
    }

    return () => {
      active = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      configError,
      connStatus,
      isAdmin: profile?.role === 'admin' && profile?.status === 'active',
      signIn: async (email, password) => {
        const isOnline = await checkSupabaseHealth();
        const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

        // 1. Try Supabase Auth if online and not forced demo
        if (isOnline && supabase && !isForcedDemo) {
          try {
            const res = await supabase.auth.signInWithPassword({ email, password });
            if (!res.error) {
              setSession(res.data.session);
              const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_user_id', res.data.user.id)
                .maybeSingle();
              setProfile(prof || null);
              setConnStatus(getConnectionStatus());
              return { data: res.data, error: null };
            }
          } catch (err) {
            console.warn('Supabase sign-in error:', err);
          }
        }

        // 2. Demo / Fallback Auth for admin testing
        const normalizedEmail = email.trim().toLowerCase();
        if (
          normalizedEmail === 'admin@smartclothing.lk' ||
          normalizedEmail === 'admin@example.com' ||
          normalizedEmail === 'admin'
        ) {
          const demoUser = {
            id: DEMO_ADMIN.id,
            email: DEMO_ADMIN.email,
            user_metadata: { full_name: DEMO_ADMIN.full_name },
          };
          const demoSessionObj = {
            access_token: 'demo-token-' + Date.now(),
            user: demoUser,
            user_profile: DEMO_ADMIN,
          };
          localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoSessionObj));
          setSession(demoSessionObj);
          setProfile(DEMO_ADMIN);
          setConnStatus(getConnectionStatus());
          return { data: { session: demoSessionObj, user: demoUser }, error: null };
        }

        return {
          data: null,
          error: {
            message: 'Invalid credentials. For Admin access, use admin@smartclothing.lk (Password: any or Admin@123).',
          },
        };
      },
      signOut: async () => {
        localStorage.removeItem(DEMO_SESSION_KEY);
        setSession(null);
        setProfile(null);
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
        }
      },
      toggleMode: (enableDemo) => {
        setForceDemo(enableDemo);
        setConnStatus(getConnectionStatus());
      },
    }),
    [session, profile, loading, configError, connStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

