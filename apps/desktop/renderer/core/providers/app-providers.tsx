import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { i18n } from "@/core/i18n/i18n";
import {
  resolveLanguage,
  useSettingsStore
} from "@/core/settings/settings-store";
import { supabase } from "@/core/supabase/supabase-client";
import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { handleAuthCallbackUrl } from "@/features/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000
    }
  }
});

const autoRefreshIntervalMs = 300_000;

type appProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: appProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBridge />
      <AuthDeepLinkBridge />
      <LanguagePreferenceBridge />
      <AutoRefreshBridge />
      {children}
    </QueryClientProvider>
  );
};

const LanguagePreferenceBridge = () => {
  const language = useSettingsStore((store) => store.language);

  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(language));
  }, [language]);

  return null;
};

const AutoRefreshBridge = () => {
  useEffect(() => {
    const refreshQueries = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["github-repositories"] });
    };

    const intervalId = window.setInterval(refreshQueries, autoRefreshIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshQueries();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
};

const AuthSessionBridge = () => {
  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

const AuthDeepLinkBridge = () => {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return undefined;
    }

    let unlisten: (() => void) | null = null;
    let isActive = true;

    const refreshAuthQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    };

    const handleUrls = (urls: string[] | null) => {
      for (const url of urls ?? []) {
        void handleAuthCallbackUrl(url)
          .then((handled) => {
            if (handled) {
              refreshAuthQueries();
            }
          })
          .catch(() => undefined);
      }
    };

    void getCurrent()
      .then(handleUrls)
      .catch(() => undefined);

    void onOpenUrl(handleUrls)
      .then((nextUnlisten) => {
        if (isActive) {
          unlisten = nextUnlisten;
          return;
        }

        nextUnlisten();
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
      unlisten?.();
    };
  }, []);

  return null;
};
