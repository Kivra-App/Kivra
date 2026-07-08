import { motion } from "framer-motion";
import { LogOut, RefreshCw, User, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { appLanguage } from "@/core/settings/settings-store";
import { supabase } from "@/core/supabase/supabase-client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Select, type selectOption } from "@/shared/ui/select";

type profileModalProps = {
  avatarUrl: string | null;
  isRefreshing: boolean;
  isSigningOut: boolean;
  language: appLanguage;
  onClose: () => void;
  onLanguageChange: (language: appLanguage) => void;
  onRefresh: () => void;
  onSignOut: () => void;
  projectCount: number;
  username: string;
};

export const ProfileModal = ({
  avatarUrl,
  isRefreshing,
  isSigningOut,
  language,
  onClose,
  onLanguageChange,
  onRefresh,
  onSignOut,
  projectCount,
  username
}: profileModalProps) => {
  const { t } = useTranslation();
  const languageOptions = getLanguageOptions(t);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  return (
    <div
      role="button"
      tabIndex={-1}
      className="fixed inset-0 z-50 grid cursor-default place-items-center bg-background/70 p-4 text-left backdrop-blur-sm"
      aria-label={t("profile.close")}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="w-full max-w-sm overflow-hidden rounded-md border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">{t("profile.title")}</div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("profile.close")}
            title={t("profile.close")}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-12 w-12 rounded-md" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-md border bg-background">
                <User className="h-5 w-5 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{username}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {supabase ? t("profile.syncEnabled") : t("profile.localOnly")}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md border bg-background px-3 py-2">
            <div className="text-xs text-muted-foreground">
              {t("profile.projects")}
            </div>
            <div className="mt-1 font-mono text-sm">
              {projectCount.toLocaleString()}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <ProfileSelect
              label={t("profile.language")}
              value={language}
              options={languageOptions}
              onChange={(value) => onLanguageChange(value as appLanguage)}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              {t("profile.refreshNow")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSigningOut}
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t("auth.signOut")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSelect = ({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: selectOption[];
  value: string;
}) => (
  <div className="grid grid-cols-[1fr_160px] items-center gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <Select
      aria-label={label}
      size="sm"
      value={value}
      options={options}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const getLanguageOptions = (
  t: ReturnType<typeof useTranslation>["t"]
): selectOption[] => [
  { label: t("profile.languageSystem"), value: "system" },
  { label: "English", value: "en" },
  { label: "한국어", value: "ko" }
];
