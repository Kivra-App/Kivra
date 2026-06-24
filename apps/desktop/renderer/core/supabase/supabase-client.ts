import { createClient } from "@supabase/supabase-js";

import { getAppEnv, hasSupabaseConfig } from "@/core/config/env";

export const createSupabaseClient = () => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const env = getAppEnv();

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true
    }
  });
};

export const supabase = createSupabaseClient();
