export type appEnv = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export const getAppEnv = (): appEnv => ({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""
});

export const hasSupabaseConfig = () => {
  const env = getAppEnv();

  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
};
