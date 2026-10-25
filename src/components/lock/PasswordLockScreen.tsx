"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";
import { fetchJson } from "@/lib/api/fetchJson";
import { useLockStore } from "@/store/lockStore";
import { initUserWorkspace } from "@/hooks/useAuthBootstrap";
import type { AuthUser } from "@/store/authStore";

interface UnlockApiResponse {
  success: boolean;
  error?: string;
  locked?: boolean;
  retryAfterSeconds?: number;
  user?: AuthUser;
}

export function PasswordLockScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutCountdown === null || lockoutCountdown <= 0) {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = window.setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, [lockoutCountdown]);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password || isPending || lockoutCountdown !== null) return;

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/lock/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        const data: UnlockApiResponse = await res.json().catch(() => ({
          success: false,
          error: "Failed to parse response",
        }));

        if (res.ok && data.success && data.user) {
          // Initialize workspace data securely
          await initUserWorkspace(data.user);
          // Update lock store state
          useLockStore.getState().unlock(data.user);
        } else {
          setError(data.error || "Incorrect password. Please try again.");
          if (data.retryAfterSeconds) {
            setLockoutCountdown(data.retryAfterSeconds);
          }
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  };

  const handleSignOut = async () => {
    if (
      !window.confirm(
        "Sign out of your NextNotePad account? You will return to Guest mode.",
      )
    ) {
      return;
    }

    try {
      await fetchJson("/api/auth/logout", {
        method: "POST",
        action: "Sign out",
      });
    } catch {
      // Ignore network errors on sign out
    }
    window.location.reload();
  };

  const isLockedOut = lockoutCountdown !== null && lockoutCountdown > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Application Password Lock"
      className="bg-[#0a0d1a] text-foreground fixed inset-0 z-50 flex h-full min-h-screen w-full flex-col items-center justify-between overflow-y-auto px-4 py-8 sm:px-6 select-none"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-gradient-to-b from-amber-500/10 via-primary/5 to-transparent blur-3xl"
      />

      {/* Top brand header */}
      <header className="relative flex flex-col items-center gap-2 pt-2">
        <div className="flex items-center gap-2">
          <AppLogo size="md" showText={false} showDomain={false} />
          <span className="font-heading text-lg font-bold tracking-tight text-white flex items-center leading-none">
            <span className="np-brand-gradient">Next</span>
            <span>NotePad</span>
            <span className="text-amber-500 font-semibold text-xs ml-0.5">
              .com
            </span>
          </span>
        </div>
      </header>

      {/* Center lock card */}
      <main className="relative my-auto w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-transparent ring-1 ring-white/10 shadow-inner">
              <Lock className="size-6 text-amber-400" />
              <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                <ShieldCheck className="size-3" />
              </div>
            </div>

            <h1 className="font-heading text-lg font-semibold tracking-tight text-white">
              Application Locked
            </h1>
            <p className="mt-1 text-xs text-white/60">
              Enter your lock password to access your notes and workspace.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="lock-password-input"
                className="text-xs font-medium text-white/70 flex items-center justify-between"
              >
                <span>Password</span>
                <span className="text-[10px] text-white/40">
                  Accepts any character
                </span>
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <KeyRound className="size-4" />
                </div>
                <Input
                  ref={inputRef}
                  id="lock-password-input"
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  disabled={isPending || isLockedOut}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter lock password"
                  autoComplete="current-password"
                  className="h-10 pl-9 pr-10 text-sm bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:border-amber-400/60 focus-visible:ring-amber-400/20 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive-foreground animate-in fade-in duration-200"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {isLockedOut && (
              <div className="text-center text-xs text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-xl py-2">
                Locked out for {lockoutCountdown} seconds
              </div>
            )}

            <Button
              type="submit"
              disabled={!password || isPending || isLockedOut}
              className="w-full h-10 gap-2 font-medium bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 rounded-xl cursor-pointer transition-all duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <Unlock className="size-4" />
                  <span>Unlock</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Forgot password? Sign out</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative text-center text-[11px] text-white/40">
        <span>{APP_BRAND.name}</span>
        <span className="mx-1.5">•</span>
        <span>Secure Application Lock</span>
      </footer>
    </div>
  );
}
