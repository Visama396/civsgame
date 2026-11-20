import { createClient } from "@supabase/supabase-js";

// Shared Supabase project with ViPlay; the `accounts` table already exists and
// is linked to Supabase Auth users via accounts.auth_id.
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL as string,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string,
);
