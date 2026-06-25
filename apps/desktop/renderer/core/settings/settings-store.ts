import { create } from "zustand";
import { persist } from "zustand/middleware";

export type appLanguage = "system" | "en" | "ko";

type settingsStore = {
  language: appLanguage;
  setLanguage: (language: appLanguage) => void;
};

export const useSettingsStore = create<settingsStore>()(
  persist(
    (set) => ({
      language: "system",
      setLanguage: (language) => set({ language })
    }),
    {
      name: "kivra.settings"
    }
  )
);

export const resolveLanguage = (language: appLanguage) => {
  if (language !== "system") {
    return language;
  }

  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
};
