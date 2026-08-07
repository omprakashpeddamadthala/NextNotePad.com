// Ambient types for the (Chromium-only) PWA install-prompt APIs — not part of TypeScript's "dom"
// lib, so declared here the same way speechRecognition.d.ts covers the Web Speech API.

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

interface Navigator {
  /** iOS Safari's own "already installed as a home-screen app" flag. */
  standalone?: boolean;
}
