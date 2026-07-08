import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Box, FolderOpen, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useSettingsStore } from "@/core/settings/settings-store";
import { useAuthUser, useSignOut } from "@/features/auth";
import { useProjects } from "@/features/project";
import { useProjectStore } from "@/features/project/stores/project-store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { NavProjectLink } from "@/shared/ui/nav-project-link";
import { ProfileModal } from "@/shared/ui/profile-modal";

type appShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: appShellProps) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const signOut = useSignOut();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const language = useSettingsStore((store) => store.language);
  const setLanguage = useSettingsStore((store) => store.setLanguage);
  const selectedProjectId = useProjectStore((store) => store.selectedProjectId);
  const projects = useProjects();
  const selectedProject =
    projects.data?.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex min-h-screen flex-col border-r bg-card"
      >
        <div className="border-b px-4 py-3">
          <Logo size="sm" showTagline />
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <Link
            to="/"
            className="group relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Box className="h-4 w-4" />
            {t("nav.dashboard")}
          </Link>
          <NavProjectLink
            projectId={selectedProjectId}
            search={{ tab: "explorer" }}
            title={!selectedProjectId ? t("nav.openProjectFirst") : undefined}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedProject?.name ?? t("nav.selectProject")}
            </span>
          </NavProjectLink>
          <Link
            to="/settings"
            className="group relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Settings className="h-4 w-4" />
            {t("nav.settings")}
          </Link>
        </nav>
        <div className="border-t p-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              title={authUser.data?.username ?? t("auth.profile")}
              onClick={() => setIsProfileOpen(true)}
            >
              {authUser.data?.avatarUrl ? (
                <img
                  src={authUser.data.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-md"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <User className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {authUser.data?.username ?? t("auth.profile")}
                </span>
              </span>
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={t("auth.signOut")}
              aria-label={t("auth.signOut")}
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.aside>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="overflow-hidden"
      >
        {children}
      </motion.main>
      {isProfileOpen && (
        <ProfileModal
          projectCount={projects.data?.length ?? 0}
          username={authUser.data?.username ?? t("auth.profile")}
          avatarUrl={authUser.data?.avatarUrl ?? null}
          isRefreshing={authUser.isFetching || projects.isFetching}
          isSigningOut={signOut.isPending}
          language={language}
          onClose={() => setIsProfileOpen(false)}
          onLanguageChange={setLanguage}
          onRefresh={() => {
            void authUser.refetch();
            void projects.refetch();
          }}
          onSignOut={() => signOut.mutate()}
        />
      )}
    </div>
  );
};
