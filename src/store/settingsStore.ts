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
      theme: "notepad-dark",

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      setTheme: (theme) => set({ theme }),

      // Your own templates and dictionary words are content, not preferences, so a reset keeps them.
      resetSettings: () =>
        set((state) => ({
          settings: {
            ...DEFAULT_SETTINGS,
            userTemplates: state.settings.userTemplates,
            spellCheckWords: state.settings.spellCheckWords,
          },
        })),

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
      // Settings saved by an older version lack newer keys; fill them from the defaults.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...saved,
          settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        };
      },
    },
  ),
);
