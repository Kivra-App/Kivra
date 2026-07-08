import { motion } from "framer-motion";
import {
  Code2,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Terminal
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { InfoNote } from "@/features/settings/components/info-note";
import { IntegrationRow } from "@/features/settings/components/integration-row";
import { JetBrainsPluginList } from "@/features/settings/components/jetbrains-plugin-list";
import {
  useInstallJetBrainsPlugin,
  useInstallMissingJetBrainsPlugins,
  useInstallShellCapture,
  useInstallVsCodeExtension,
  useIntegrationStatus,
  useUninstallShellCapture
} from "@/features/settings";

export const SettingsRoute = () => {
  const { t } = useTranslation();
  const integrationStatus = useIntegrationStatus();
  const installShell = useInstallShellCapture();
  const uninstallShell = useUninstallShellCapture();
  const installJetBrains = useInstallJetBrainsPlugin();
  const installMissingJetBrains = useInstallMissingJetBrainsPlugins();
  const installVsCode = useInstallVsCodeExtension();
  const [shellAction, setShellAction] = useState<"install" | "uninstall" | null>(null);
  const [jetBrainsAction, setJetBrainsAction] = useState<"all" | "missing" | null>(null);
  const hasMissingJetBrainsPlugins = Boolean(
    integrationStatus.data?.jetbrainsMissingInstallPaths.length
  );
  const shellResult =
    shellAction === "install"
      ? installShell.data
      : shellAction === "uninstall"
        ? uninstallShell.data
        : undefined;
  const jetBrainsResult =
    jetBrainsAction === "all"
      ? installJetBrains.data
      : jetBrainsAction === "missing"
        ? installMissingJetBrains.data
        : undefined;
  const shellError =
    shellAction === "install" ? installShell.error : shellAction === "uninstall" ? uninstallShell.error : null;
  const jetBrainsError =
    jetBrainsAction === "all"
      ? installJetBrains.error
      : jetBrainsAction === "missing"
        ? installMissingJetBrains.error
        : null;
  const vscodeResult = installVsCode.data;
  const vscodeError = installVsCode.error;
  const handleInstallShell = () => {
    setShellAction("install");
    uninstallShell.reset();
    installShell.reset();
    installShell.mutate();
  };
  const handleUninstallShell = () => {
    setShellAction("uninstall");
    installShell.reset();
    uninstallShell.reset();
    uninstallShell.mutate();
  };
  const handleInstallJetBrains = () => {
    setJetBrainsAction("all");
    installMissingJetBrains.reset();
    installJetBrains.reset();
    installJetBrains.mutate();
  };
  const handleInstallMissingJetBrains = () => {
    setJetBrainsAction("missing");
    installJetBrains.reset();
    installMissingJetBrains.reset();
    installMissingJetBrains.mutate();
  };
  const handleInstallVsCode = () => {
    installVsCode.reset();
    installVsCode.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="flex h-screen min-h-0 flex-col overflow-hidden"
    >
      <header className="shrink-0 border-b px-4 py-4">
        <h1 className="text-lg font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {t("settings.description")}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
        <section className="max-w-6xl space-y-3">
          <IntegrationRow
            icon={<Terminal className="h-5 w-5" />}
            title={t("settings.shell.title")}
            description={t("settings.shell.description")}
            statusLabel={
              integrationStatus.data?.shellInstalled
                ? t("settings.installed")
                : t("settings.notInstalled")
            }
            detail={integrationStatus.data?.shellIntegrationPath}
            isInstalled={Boolean(integrationStatus.data?.shellInstalled)}
            isPending={installShell.isPending || uninstallShell.isPending}
            buttonLabel={
              integrationStatus.data?.shellInstalled
                ? t("settings.shell.reinstall")
                : t("settings.shell.install")
            }
            installingLabel={t("settings.installing")}
            onInstall={handleInstallShell}
            secondaryButtonLabel={
              integrationStatus.data?.shellInstalled
                ? t("settings.shell.uninstall")
                : undefined
            }
            onSecondaryAction={handleUninstallShell}
            result={shellResult}
            resultMessage={shellResult ? t(shellResult.messageKey) : undefined}
            error={shellError}
            errorFallback={t("settings.errorFallback")}
          >
            <InfoNote
              icon={<ShieldCheck className="h-4 w-4" />}
              title={t("settings.shell.permissionTitle")}
            >
              {t("settings.shell.permissionDetail")}
            </InfoNote>
          </IntegrationRow>

          <IntegrationRow
            icon={<PlugZap className="h-5 w-5" />}
            title={t("settings.jetbrains.title")}
            description={t("settings.jetbrains.description")}
            statusLabel={
              integrationStatus.data?.jetbrainsInstalled
                ? t("settings.jetbrains.ready")
                : integrationStatus.data?.jetbrainsPartiallyInstalled
                  ? t("settings.jetbrains.needsAttention")
                : t("settings.jetbrains.notLinked")
            }
            isInstalled={Boolean(integrationStatus.data?.jetbrainsInstalled)}
            isPending={installJetBrains.isPending || installMissingJetBrains.isPending}
            buttonLabel={
              integrationStatus.data?.jetbrainsInstalled || integrationStatus.data?.jetbrainsPartiallyInstalled
                ? t("settings.jetbrains.reinstall")
                : t("settings.jetbrains.install")
            }
            installingLabel={t("settings.installing")}
            onInstall={handleInstallJetBrains}
            secondaryButtonLabel={
              hasMissingJetBrainsPlugins
                ? t("settings.jetbrains.installMissing")
                : undefined
            }
            onSecondaryAction={handleInstallMissingJetBrains}
            result={jetBrainsResult}
            resultMessage={jetBrainsResult ? t(jetBrainsResult.messageKey) : undefined}
            error={jetBrainsError}
            errorFallback={t("settings.errorFallback")}
          >
            <InfoNote
              icon={<RefreshCw className="h-4 w-4" />}
              title={t("settings.jetbrains.restartTitle")}
            >
              {t("settings.jetbrains.restartDetail")}
            </InfoNote>
            <JetBrainsPluginList
              plugins={integrationStatus.data?.jetbrainsPlugins ?? []}
              installedLabel={t("settings.jetbrains.linked")}
              missingLabel={t("settings.jetbrains.missing")}
              emptyLabel={t("settings.jetbrains.emptyDetected")}
            />
          </IntegrationRow>

          <IntegrationRow
            icon={<Code2 className="h-5 w-5" />}
            title={t("settings.vscode.title")}
            description={t("settings.vscode.description")}
            statusLabel={
              integrationStatus.data?.vscodeInstalled
                ? t("settings.vscode.ready")
                : integrationStatus.data?.vscodeCliPath
                  ? t("settings.vscode.notLinked")
                  : t("settings.vscode.cliMissing")
            }
            detail={integrationStatus.data?.vscodeCliPath ?? undefined}
            isInstalled={Boolean(integrationStatus.data?.vscodeInstalled)}
            isPending={installVsCode.isPending}
            buttonLabel={
              integrationStatus.data?.vscodeInstalled
                ? t("settings.vscode.reinstall")
                : t("settings.vscode.install")
            }
            installingLabel={t("settings.installing")}
            onInstall={handleInstallVsCode}
            result={vscodeResult}
            resultMessage={vscodeResult ? t(vscodeResult.messageKey) : undefined}
            error={vscodeError}
            errorFallback={t("settings.errorFallback")}
          >
            <InfoNote
              icon={<RefreshCw className="h-4 w-4" />}
              title={t("settings.vscode.restartTitle")}
            >
              {t("settings.vscode.restartDetail")}
            </InfoNote>
          </IntegrationRow>
        </section>
      </div>
    </motion.div>
  );
};
