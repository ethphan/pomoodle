import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInResult = 'success' | 'cancelled';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function getUrlParams(url: string) {
  const queryPart = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  const fragmentPart = url.includes('#') ? url.split('#')[1] ?? '' : '';

  const params = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(queryPart).entries()) {
    params.set(key, value);
  }
  for (const [key, value] of new URLSearchParams(fragmentPart).entries()) {
    params.set(key, value);
  }

  return params;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!isMounted) return;
        setSession(data.session);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signInWithEmail: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUpWithEmail: async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        const redirectTo = Linking.createURL('/login');

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            skipBrowserRedirect: true,
            redirectTo,
          },
        });

        if (error) throw error;
        if (!data.url) throw new Error('Google sign-in URL not found.');

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'cancel' || result.type === 'dismiss') return 'cancelled';
        if (result.type !== 'success' || !result.url) {
          throw new Error('Google sign-in was interrupted.');
        }

        const params = getUrlParams(result.url);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          return 'success';
        }

        if (!accessToken || !refreshToken) {
          throw new Error('Failed to read Google auth session tokens.');
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
        return 'success';
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
