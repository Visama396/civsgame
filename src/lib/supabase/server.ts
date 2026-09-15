import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SERVICE_SUPABASE_KEY ?? "";

if (!URL || !ANON) throw new Error("Supabase env vars missing");

export function getServerClient(bearerToken?: string | null): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: bearerToken
      ? { headers: { Authorization: `Bearer ${bearerToken}` } }
      : undefined,
  });
}

// Service-role client: bypasses RLS. Server-side only — never exposed to the
// browser. Used for checks that the RLS policies don't cover (e.g. confirming
// an auth user is a registered player via the shared `accounts` table).
export function getServiceClient(): SupabaseClient {
  return createClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}