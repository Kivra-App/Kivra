import { supabase } from "@/core/supabase/supabase-client";
import { syncUserProfile } from "@/core/supabase/sync-service";
import { invokeCommand, isTauriRuntime } from "@/core/tauri/tauri-client";

const authCallbackUrl = "kivra://auth/callback";

export type authUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export const getCurrentUser = async (): Promise<authUser | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const user = {
    id: data.user.id,
    username:
      data.user.user_metadata.user_name ??
      data.user.user_metadata.preferred_username ??
      data.user.email ??
      "GitHub User",
    avatarUrl: data.user.user_metadata.avatar_url ?? null
  };

  await syncUserProfile({
    id: user.id,
    githubId:
      data.user.user_metadata.provider_id ??
      data.user.user_metadata.sub ??
      data.user.id,
    username: user.username,
    avatarUrl: user.avatarUrl
  });

  return user;
};

export const signInWithGithub = async () => {
  if (!supabase) {
    throw new Error("SUPABASE_CONFIG_REQUIRED");
  }

  if (!isTauriRuntime()) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: authCallbackUrl,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("GITHUB_OAUTH_URL_MISSING");
  }

  await invokeCommand("open_external_url", { url: data.url });
};

export const handleAuthCallbackUrl = async (url: string): Promise<boolean> => {
  if (!supabase) {
    return false;
  }

  const callbackUrl = parseAuthCallbackUrl(url);

  if (!callbackUrl) {
    return false;
  }

  const error = callbackUrl.searchParams.get("error_description");

  if (error) {
    throw new Error(error);
  }

  const code = callbackUrl.searchParams.get("code");

  if (!code) {
    return false;
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw exchangeError;
  }

  return true;
};

export const getGithubAccessToken = async (): Promise<string | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.provider_token) {
    return null;
  }

  return data.session.provider_token;
};

export const signOut = async () => {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
};

const parseAuthCallbackUrl = (url: string) => {
  try {
    const callbackUrl = new URL(url);
    const isAuthCallback =
      callbackUrl.protocol === "kivra:" &&
      callbackUrl.hostname === "auth" &&
      callbackUrl.pathname === "/callback";

    return isAuthCallback ? callbackUrl : null;
  } catch {
    return null;
  }
};
