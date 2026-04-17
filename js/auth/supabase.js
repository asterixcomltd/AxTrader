// AxTrader Supabase Auth Client
// Initializes Supabase client for auth (placeholder until Supabase project is connected)

import { AUTH } from '../config.js';

let _client = null;

/**
 * Initialize Supabase auth client.
 * Returns null if Supabase is not configured.
 */
export async function initSupabase() {
  if (!_client) {
    if (AUTH.supabase_url && AUTH.supabase_anon_key) {
      try {
        // Dynamic import of @supabase/supabase-js
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        _client = createClient(AUTH.supabase_url, AUTH.supabase_anon_key);
      } catch {
        console.warn('[Supabase] Failed to initialize — using localStorage auth fallback.');
      }
    }
  }
  return _client;
}

/**
 * Sign in with email/password via Supabase.
 */
export async function signInWithEmail(email, password) {
  const supabase = await initSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign up with email/password via Supabase.
 */
export async function signUp(email, password) {
  const supabase = await initSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out.
 */
export async function signOut() {
  const supabase = await initSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Send password reset email.
 */
export async function sendReset(email) {
  const supabase = await initSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/**
 * Get current session.
 */
export async function getSession() {
  const supabase = await initSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data?.session;
}

// Listen to auth state changes
export function onAuthChange(callback) {
  initSupabase().then(supabase => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  });
}
