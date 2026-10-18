"use client";

import { useLockStore } from "@/store/lockStore";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";

/**
 * An impenetrable privacy shield overlay rendered when the app or PWA is backgrounded
 * or switching tasks. Prevents the OS app switcher (iOS/Android/Windows) from capturing
 * screenshots of private notes and documents.
 */
export function PrivacyShield() {
  const visible = useLockStore((s) => s.privacyShieldVisible);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0d1a] text-white select-none pointer-events-none"
    >
      <div className="flex flex-col items-center gap-3">
        <AppLogo size="lg" showText={false} showDomain={false} />
        <span className="font-heading text-sm font-semibold tracking-tight text-white/80">
          {APP_BRAND.name}
        </span>
      </div>
    </div>
  );
}
