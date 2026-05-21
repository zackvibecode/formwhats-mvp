import { createClient } from "@supabase/supabase-js";

/**
 * Browser/client Supabase client for FormWhats MVP.
 *
 * Reads the public URL and anon key from environment variables.
 * For now this is the only client we use; server-side / service-role
 * clients will be added in later steps when authentication is wired up.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // Soft warning during local dev so the app still boots even if env is
  // missing. Tighten this once Supabase is actually required.
  // eslint-disable-next-line no-console
  console.warn(
    "[FormWhats] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
