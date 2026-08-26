import { fetchJson, jsonBody, ApiError } from "@/lib/api/fetchJson";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { DEFAULT_SETTINGS } from "@/lib/constants/defaultSettings";
import { THEME_ORDER } from "@/lib/constants/themes";
import type { EditorSettings } from "@/types/settings";
import type { ThemeName } from "@/types/theme";

interface CloudSettingsResponse {
  theme: string | null;
  json: string | null;
}

const PUSH_DEBOUNCE_MS = 1500;
// Matches settingsStore's own initial value — used if the cloud ever has a theme id this build
// no longer recognizes (e.g. a theme renamed/removed since that value was saved).
const FALLBACK_THEME: ThemeName = "notepad-plus-plus";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeFromSettings: (() => void) | null = null;

function isThemeName(value: string): value is ThemeName {
  return (THEME_ORDER as readonly string[]).includes(value);
}

async function pushSettingsToCloud(): Promise<void> {
  const { settings, theme } = useSettingsStore.getState();
  try {
    await fetchJson("/api/settings", {
      ...jsonBody("PUT", { theme, json: JSON.stringify(settings) }),
      action: "Sync settings",
    });
  } catch (err) {
    // Best-effort — localStorage already has the change, so a failed sync only delays it
    // reaching other devices, it never loses anything on this one.
    console.error("Failed to sync settings to the cloud:", err);
  }
}

/**
 * Called once right after `authStore` flips to "authenticated" (from `useAuthBootstrap`,
 * alongside the workspace load). Reconciles local (possibly guest-customized) settings against
 * whatever this account has saved in the cloud, then keeps them in sync for the rest of the
 * session — same "cloud wins if it has data, otherwise seed the cloud from local" shape as
 * `migrateOrLoadCloudWorkspace` uses for the file tree.
 */
export async function syncSettingsOnLogin(): Promise<void> {
  try {
    const cloud = await fetchJson<CloudSettingsResponse>("/api/settings", { action: "Load settings" });
    if (cloud.theme && cloud.json) {
      const parsed = JSON.parse(cloud.json) as Partial<EditorSettings>;
      useSettingsStore.setState({
        settings: { ...DEFAULT_SETTINGS, ...parsed },
        theme: isThemeName(cloud.theme) ? cloud.theme : FALLBACK_THEME,
      });
    } else {
      // First login (or first login since this account had settings): nothing saved yet, so
      // seed the cloud from whatever's local rather than silently discarding it.
      await pushSettingsToCloud();
    }
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      console.error("Settings sync failed:", err);
    }
    return;
  }

  if (unsubscribeFromSettings) return; // already watching from an earlier login this session
  unsubscribeFromSettings = useSettingsStore.subscribe(() => {
    if (useAuthStore.getState().status !== "authenticated") return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void pushSettingsToCloud(), PUSH_DEBOUNCE_MS);
  });
}
