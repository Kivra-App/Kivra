import { createClient } from "@supabase/supabase-js";

import { getAppEnv, hasSupabaseConfig } from "@/core/config/env";

export const createSupabaseClient = () => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const env = getAppEnv();

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
};

export const supabase = createSupabaseClient();
