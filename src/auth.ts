import 'expo-sqlite/localStorage/install';

import { createClient, type Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** null until the Supabase keys are in .env; the app then runs without accounts. */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === 'web',
          flowType: 'pkce',
        },
      })
    : null;

export const authReady = supabase !== null;

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authReady);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/** Where the email's sign-in link lands: this web page, or the app via its `auth` route. */
const emailRedirect = () => (Platform.OS === 'web' ? window.location.origin : Linking.createURL('auth'));

/** Emails a sign-in link (and a 6-digit code too, if the email template includes {{ .Token }}). */
export async function sendEmailCode(email: string) {
  if (!supabase) throw new Error('Sign-in is not set up yet');
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: emailRedirect() } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string) {
  if (!supabase) throw new Error('Sign-in is not set up yet');
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Sign-in is not set up yet');
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return;
  }
  const redirectTo = Linking.createURL('auth');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;
  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Google did not send a sign-in code back');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/** The app side of an email link: swap the link's one-time code for a session. */
export async function finishEmailLink(code: string) {
  if (!supabase) throw new Error('Sign-in is not set up yet');
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function signOut() {
  await supabase?.auth.signOut();
}
