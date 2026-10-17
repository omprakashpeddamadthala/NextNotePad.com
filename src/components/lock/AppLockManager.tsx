"use client";

import { useAppLock } from "@/hooks/useAppLock";
import { PrivacyShield } from "./PrivacyShield";

export function AppLockManager() {
  useAppLock();
  return <PrivacyShield />;
}
