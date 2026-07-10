import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase publishable (anon) credentials. These are safe to embed in a public
 * client: they only allow access permitted by RLS / Realtime authorization.
 * Realtime broadcast on public channels is used for online multiplayer.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const SUPABASE_URL =
  extra.supabaseUrl ?? 'https://txpurcygggkslnpkaxol.supabase.co';

export const SUPABASE_ANON_KEY =
  extra.supabaseAnonKey ?? 'sb_publishable_unSaOO4N4VntWaiFrVtA5Q_oXLOkgM-';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: { eventsPerSecond: 20 },
      },
    });
  }
  return client;
}

export function isOnlineAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
