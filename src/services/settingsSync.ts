import { fetchJson, jsonBody, ApiError } from "@/lib/api/fetchJson";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { DEFAULT_SETTINGS } from "@/lib/constants/defaultSettings";
import { THEME_ORDER } from "@/lib/constants/themes";
import type { EditorSettings } from "@/types/settings";
import type { ThemeName } from "@/types/theme";
import type { RecentEntry } from "@/types/file";

interface CloudSettingsResponse {
  theme: string | null;
  json: string | null;
  recentFiles: RecentEntry[];
  favorites: string[];
}

type SettingsPatch = Partial<{
  theme: string;
  json: string;
  recentFiles: RecentEntry[];
  favorites: string[];
}>;

const PUSH_DEBOUNCE_MS = 1500;
const MAX_SYNCED_RECENTS = 50;
// Matches settingsStore's own initial value — used if Drive ever has a theme id this build
// no longer recognizes (e.g. a theme renamed/removed since that value was saved).
const FALLBACK_THEME: ThemeName = "notepad-plus-plus";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPatch: SettingsPatch = {};
let unsubscribers: (() => void)[] = [];

function isThemeName(value: string): value is ThemeName {
  return (THEME_ORDER as readonly string[]).includes(value);
}

function settingsPatch(): SettingsPatch {
  const { settings, theme } = useSettingsStore.getState();
  return { theme, json: JSON.stringify(settings) };
}

function recentsPatch(): SettingsPatch {
  const { recent, favorites } = useRecentFilesStore.getState();
  return { recentFiles: recent.slice(0, MAX_SYNCED_RECENTS), favorites };
}

/** Sends only the parts that changed; the server merges them into a fresh read of
 *  `.appConfig.json`, so a concurrent change from another device to a different part survives. */
async function flush(): Promise<void> {
  const patch = pendingPatch;
  pendingPatch = {};
  if (Object.keys(patch).length === 0) return;
  try {
    await fetchJson("/api/settings", {
      ...jsonBody("PUT", patch),
      action: "Sync settings",
      background: true,
    });
  } catch (err) {
    // Re-queue so the next change (or the next login) retries it; localStorage keeps the value
    // on this device meanwhile, so nothing is lost locally.
    pendingPatch = { ...patch, ...pendingPatch };
    console.error("Failed to sync settings to Google Drive:", err);
  }
}

function schedule(patch: SettingsPatch) {
  if (useAuthStore.getState().status !== "authenticated") return;
  pendingPatch = { ...pendingPatch, ...patch };
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void flush(), PUSH_DEBOUNCE_MS);
}

/**
 * Called once right after sign-in. Settings, recent files and favorites live in the user's
 * `NextNotePad.com/.appConfig.json`: Drive wins if it has a value, otherwise it's seeded from
 * this browser's (possibly guest-customized) values. Changes are then pushed, debounced.
 */
export async function syncSettingsOnLogin(): Promise<void> {
  try {
    const cloud = await fetchJson<CloudSettingsResponse>("/api/settings", {
      action: "Load settings",
      background: true,
    });
    const seed: SettingsPatch = {};

    if (cloud.theme && cloud.json) {
      const parsed = JSON.parse(cloud.json) as Partial<EditorSettings>;
      useSettingsStore.setState({
        settings: { ...DEFAULT_SETTINGS, ...parsed },
        theme: isThemeName(cloud.theme) ? cloud.theme : FALLBACK_THEME,
      });
    } else {
      Object.assign(seed, settingsPatch());
    }

    // Drive ids are per-account, so recents/favorites from guest mode (local ids) don't carry
    // over — only the account's own list from Drive is used.
    useRecentFilesStore.setState({
      recent: cloud.recentFiles ?? [],
      favorites: cloud.favorites ?? [],
    });

    if (Object.keys(seed).length > 0) {
      pendingPatch = { ...pendingPatch, ...seed };
      await flush();
    }
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      console.error("Settings sync failed:", err);
    }
    return;
  }

  if (unsubscribers.length > 0) return; // already watching from an earlier login this session
  unsubscribers = [
    useSettingsStore.subscribe(() => schedule(settingsPatch())),
    useRecentFilesStore.subscribe((state, prev) => {
      if (state.recent !== prev.recent || state.favorites !== prev.favorites)
        schedule(recentsPatch());
    }),
  ];
}
