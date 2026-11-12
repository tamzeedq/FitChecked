import type { Session, User } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { supabase, supabaseConfigured } from './supabase';

type Result = { error: string | null; needsConfirmation?: boolean };

type AuthState = {
  session: Session | null;
  user: User | null;
  /** False until the persisted session has been read from storage. */
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<Result>;
};

export function friendlyError(message?: string): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first, then sign in.';
  if (m.includes('password') && m.includes('characters')) return 'Password is too short.';
  if (m.includes('weak') || m.includes('easy to guess')) return 'Choose a stronger password.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('fetch') || m.includes('network')) return "Can't reach the server. Check your connection.";
  if (m.includes('valid email') || m.includes('invalid email')) return 'Enter a valid email address.';
  return 'Something went wrong. Please try again.';
}

const NOT_CONFIGURED = 'Sign-in is not configured for this build.';

const fail = (e: unknown): Result => ({ error: friendlyError(e instanceof Error ? e.message : undefined) });

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  signIn: async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? friendlyError(error.message) : null };
    } catch (e) {
      return fail(e);
    }
  },
  signUp: async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { error: friendlyError(error.message) };
      // Supabase hides duplicate emails by returning a user with no identities.
      if (data.user && data.user.identities?.length === 0) return { error: friendlyError('already registered') };
      return { error: null, needsConfirmation: !data.session };
    } catch (e) {
      return fail(e);
    }
  },
  signOut: async () => {
    // Local scope always clears the stored session, even offline.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    set({ session: null, user: null });
  },
  resetPassword: async (email) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      return { error: error ? friendlyError(error.message) : null };
    } catch (e) {
      return fail(e);
    }
  },
}));

/** Mount once at the root: loads the stored session, follows auth changes and ties token refresh to AppState. */
export function useAuthListener() {
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) useAuth.setState({ session: data.session, user: data.session?.user ?? null, initialized: true });
      })
      .catch(() => {
        if (active) useAuth.setState({ initialized: true });
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuth.setState({ session, user: session?.user ?? null, initialized: true });
    });

    let appState: { remove: () => void } | undefined;
    if (Platform.OS !== 'web') {
      const sync = (s: string) => {
        if (s === 'active') supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
      };
      sync(AppState.currentState ?? 'active');
      appState = AppState.addEventListener('change', sync);
    }
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      appState?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const MIN_PASSWORD = 8;
