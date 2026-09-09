import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { checkSupabaseHealth } from '../services/dataService';
import { AuthContext } from './auth-context';

const DEMO_ADMIN = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@smartclothing.lk',
  full_name: 'Platform Administrator',
  phone: '0112000000',
  role: 'admin',
  status: 'active',
};

const DEMO_SESSION_KEY = 'smart_clothing_admin_session';

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
  const [configError] = useState(
    isSupabaseConfigured
      ? null
      : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env',
  );

  useEffect(() => {
    let active = true;

    async function initAuth() {
      const isOnline = await checkSupabaseHealth();

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
      isAdmin: profile?.role === 'admin' && profile?.status === 'active',
      signIn: async (email, password) => {
        const isOnline = await checkSupabaseHealth();
        const normalizedEmail = (email || '').trim().toLowerCase();
        const trimmedPassword = (password || '').trim();

        // 1. Direct query to Supabase 'users' table
        if (isOnline && supabase) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('email', normalizedEmail)
              .maybeSingle();

            if (!error && data) {
              if (data.password === trimmedPassword) {
                const adminProfile = {
                  id: data.id,
                  email: data.email,
                  full_name: data.name || 'Platform Administrator',
                  role: data.role || 'admin',
                  status: 'active',
                  phone: data.phone || '0712345678',
                };
                const userSession = {
                  access_token: 'token-' + Date.now(),
                  user: { id: data.id, email: data.email },
                  user_profile: adminProfile,
                };
                localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(userSession));
                setSession(userSession);
                setProfile(adminProfile);
                return { data: userSession, error: null };
              } else {
                return {
                  data: null,
                  error: {
                    message: 'Invalid password. Please check your credentials.',
                  },
                };
              }
            }
          } catch (err) {
            console.warn('Supabase authentication notice:', err);
          }
        }

        // 2. Verified admin credentials check
        if (normalizedEmail === 'admin@smartclothing.lk' && trimmedPassword === 'Admin@123') {
          const adminProfile = {
            id: DEMO_ADMIN.id,
            email: 'admin@smartclothing.lk',
            full_name: 'Platform Administrator',
            role: 'admin',
            status: 'active',
            phone: '0712345678',
          };
          const userSession = {
            access_token: 'token-' + Date.now(),
            user: { id: DEMO_ADMIN.id, email: 'admin@smartclothing.lk' },
            user_profile: adminProfile,
          };
          localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(userSession));
          setSession(userSession);
          setProfile(adminProfile);
          return { data: userSession, error: null };
        }

        return {
          data: null,
          error: {
            message: 'Invalid credentials. Please enter valid email (admin@smartclothing.lk) and password (Admin@123).',
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
    }),
    [session, profile, loading, configError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
