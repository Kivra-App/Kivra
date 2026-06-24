import { FolderOpen, FolderPlus, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useRegisterProject } from "@/features/project/hooks/use-projects";
import { selectProjectFolder } from "@/features/project/services/project-dialog-service";
import { Button } from "@/shared/ui/button";

export const ProjectRegistration = () => {
  const { t } = useTranslation();
  const [projectPath, setProjectPath] = useState("");
  const registerProject = useRegisterProject();
  const canUseNativeActions = isTauriRuntime();
  const [folderPickerError, setFolderPickerError] = useState<string | null>(null);
  const registrationError = formatProjectError({
    message: registerProject.error instanceof Error ? registerProject.error.message : null,
    t
  });
  const pickerError = formatProjectError({
    message: folderPickerError,
    t
  });

  const registerSelectedProject = (selectedPath: string) => {
    registerProject.mutate(selectedPath, {
      onSuccess: () => setProjectPath("")
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canUseNativeActions || registerProject.isPending) {
      return;
    }

    const trimmedPath = projectPath.trim();

    if (trimmedPath) {
      registerSelectedProject(trimmedPath);
      return;
    }

    await handleSelectFolder({ shouldRegister: true });
  };

  const handleSelectFolder = async ({
    shouldRegister = false
  }: {
    shouldRegister?: boolean;
  } = {}) => {
    setFolderPickerError(null);

    try {
      const selectedPath = await selectProjectFolder();

      if (selectedPath) {
        setProjectPath(selectedPath);

        if (shouldRegister) {
          registerSelectedProject(selectedPath);
        }
      }
    } catch (error) {
      setFolderPickerError(
        error instanceof Error ? error.message : "PROJECT_FOLDER_SELECT_FAILED"
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border bg-card p-4"
    >
      <div>
        <div className="text-sm font-semibold">{t("project.localImportTitle")}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("project.localImportDetail")}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          value={projectPath}
          onChange={(event) => setProjectPath(event.target.value)}
          placeholder={t("project.pathPlaceholder")}
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-xs outline-none focus:border-foreground disabled:bg-muted"
          disabled={!canUseNativeActions}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={registerProject.isPending || !canUseNativeActions}
          onClick={() => void handleSelectFolder()}
        >
          <FolderOpen className="h-4 w-4" />
          {t("project.browseFolder")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={registerProject.isPending || !canUseNativeActions}
        >
          {registerProject.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FolderPlus className="h-4 w-4" />
          )}
          {t("project.addProject")}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("project.localImportHint")}
      </p>
      {!canUseNativeActions && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("runtime.desktopRequiredDetail")}
        </p>
      )}
      {registrationError && (
        <ProjectErrorMessage
          title={registrationError.title}
          detail={registrationError.detail}
        />
      )}
      {pickerError && (
        <ProjectErrorMessage title={pickerError.title} detail={pickerError.detail} />
      )}
    </form>
  );
};

type projectErrorMessageProps = {
  detail?: string;
  title: string;
};

const ProjectErrorMessage = ({ detail, title }: projectErrorMessageProps) => (
  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3">
    <div className="text-xs font-medium text-destructive">{title}</div>
    {detail && (
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    )}
  </div>
);

const formatProjectError = ({
  message,
  t
}: {
  message: string | null;
  t: ReturnType<typeof useTranslation>["t"];
}) => {
  if (!message) {
    return null;
  }

  if (message === "DESKTOP_RUNTIME_REQUIRED") {
    return {
      title: t("runtime.desktopRequired"),
      detail: t("runtime.desktopRequiredDetail")
    };
  }

  if (message === "PROJECT_STRUCTURE_UNREADABLE") {
    return {
      title: t("project.structureUnreadable"),
      detail: t("project.structureUnreadableDetail")
    };
  }

  if (message.trim().startsWith("[") || message.includes("invalid_type")) {
    return {
      title: t("project.structureUnreadable"),
      detail: t("project.structureUnreadableDetail")
    };
  }

  return {
    title: message
  };
};
