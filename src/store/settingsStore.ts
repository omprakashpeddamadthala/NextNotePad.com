import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EditorSettings } from "@/types/settings";
import type { ThemeName } from "@/types/theme";
import { DEFAULT_SETTINGS } from "@/lib/constants/defaultSettings";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

interface SettingsState {
  settings: EditorSettings;
  theme: ThemeName;
}

interface SettingsActions {
  updateSettings: (patch: Partial<EditorSettings>) => void;
  setTheme: (theme: ThemeName) => void;
  resetSettings: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      theme: "notepad-plus-plus",

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      setTheme: (theme) => set({ theme }),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      zoomIn: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            zoomLevel: Math.min(state.settings.zoomLevel + 1, 10),
          },
        })),

      zoomOut: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            zoomLevel: Math.max(state.settings.zoomLevel - 1, -5),
          },
        })),

      resetZoom: () =>
        set((state) => ({ settings: { ...state.settings, zoomLevel: 0 } })),
    }),
    {
      name: "np-settings",
      storage: createJSONStorage(() => zustandLocalStorage),
    },
  ),
);
