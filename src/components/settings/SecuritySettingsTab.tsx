"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useLockStore } from "@/store/lockStore";
import type { LockOptions, LockPolicy } from "@/lib/lock/lockPolicy";
import { lockApi } from "@/services/lock/lockApi";

export function SecuritySettingsTab() {
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const enabled = useLockStore((s) => s.enabled);
  const policy = useLockStore((s) => s.policy);
  const pwaOnResume = useLockStore((s) => s.pwaOnResume);
  const autoTimeoutMinutes = useLockStore((s) => s.autoTimeoutMinutes);
  const setLockConfig = useLockStore((s) => s.setLockConfig);
  const lock = useLockStore((s) => s.lock);

  // Sync latest lock status from server when tab is viewed
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    lockApi
      .status()
      .then(({ data }) => {
        if (typeof data.enabled === "boolean") {
          setLockConfig({
            enabled: data.enabled,
            isLocked: data.isLocked,
            policy: data.policy,
            pwaOnResume: data.pwaOnResume,
            autoTimeoutMinutes: data.autoTimeoutMinutes,
          });
        }
      })
      .catch(() => {});
  }, [authStatus, setLockConfig]);

  // Setup form state
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Change password form state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showChangeFields, setShowChangeFields] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  // Disable lock form state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  if (authStatus === "guest") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Shield className="size-6" />
            </div>
            <h4 className="font-heading text-base font-semibold text-foreground">
              Sign in to Enable Application Lock
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Protect your notes and workspace with a separate application lock
              password. Your lock configuration is stored securely and
              associated with your account.
            </p>
            <Button
              className="mt-5 h-9 gap-2 text-xs font-medium cursor-pointer"
              onClick={() => {
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/api/auth/google";
              }}
            >
              <GoogleIcon />
              <span>Sign in with Google</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle enabling / setting up lock password
  const handleSetupLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupPassword) {
      setSetupError("Password is required");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords do not match");
      return;
    }

    setSetupError(null);
    startTransition(async () => {
      try {
        const { ok, data } = await lockApi.setup(setupPassword, {
          policy: "next_visit",
          pwaOnResume: true,
          autoTimeoutMinutes: 0,
        });
        if (!ok) {
          setSetupError(data.error || "Failed to set lock password");
          return;
        }

        setLockConfig({
          enabled: true,
          isLocked: false,
          policy: "next_visit",
          pwaOnResume: true,
          autoTimeoutMinutes: 0,
        });

        setSetupPassword("");
        setSetupConfirm("");
        toast.success("Application password lock enabled");
      } catch {
        setSetupError("Network error. Please try again.");
      }
    });
  };

  // Handle changing policy or options
  const handleUpdateOptions = (patch: LockOptions) => {
    startTransition(async () => {
      try {
        const { ok, data } = await lockApi.updateSettings(patch);
        if (!ok) {
          toast.error(data.error || "Failed to update settings");
          return;
        }

        setLockConfig(patch);
        toast.success("Lock settings updated");
      } catch {
        toast.error("Network error. Failed to update settings");
      }
    });
  };

  // Handle changing password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setChangeError("Current password is required");
      return;
    }
    if (!newPassword) {
      setChangeError("New password is required");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError("New passwords do not match");
      return;
    }

    setChangeError(null);
    startTransition(async () => {
      try {
        const { ok, data } = await lockApi.changePassword(
          currentPassword,
          newPassword,
        );
        if (!ok) {
          setChangeError(data.error || "Failed to change password");
          return;
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowChangePassword(false);
        toast.success("Lock password updated successfully");
      } catch {
        setChangeError("Network error. Please try again.");
      }
    });
  };

  // Handle disabling lock
  const handleDisableLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError("Password is required to disable lock");
      return;
    }

    setDisableError(null);
    startTransition(async () => {
      try {
        const { ok, data } = await lockApi.disable(disablePassword);
        if (!ok) {
          setDisableError(data.error || "Incorrect password");
          return;
        }

        setLockConfig({ enabled: false, isLocked: false });
        setDisablePassword("");
        setShowDisableDialog(false);
        toast.success("Application password lock disabled");
      } catch {
        setDisableError("Network error. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview status card */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-xl ${
                enabled
                  ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
                  : "bg-muted text-muted-foreground ring-1 ring-border/60"
              }`}
            >
              {enabled ? (
                <ShieldCheck className="size-5" />
              ) : (
                <Shield className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Application Password Lock
                </h4>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    enabled
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border/60"
                  }`}
                >
                  {enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabled
                  ? "Your NextNotePad workspace is protected with a separate lock password."
                  : "Lock NextNotePad with a dedicated password on subsequent visits and PWA reopen."}
              </p>
            </div>
          </div>

          {enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void lock()}
              className="h-8 gap-1.5 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
              title="Immediately lock the application (Ctrl+Alt+L)"
            >
              <Lock className="size-3.5" />
              <span>Lock Now</span>
            </Button>
          )}
        </div>

        {/* User account association info */}
        {user && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Associated Account:</span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
        )}
      </div>

      {/* Setup Form (when lock is not yet enabled) */}
      {!enabled && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
          <div className="mb-4 pb-3 border-b border-border/60">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <span>Set Up Lock Password</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              The lock password is separate from your login credentials and can
              contain any characters, spaces, symbols, and Unicode.
            </p>
          </div>

          <form onSubmit={handleSetupLock} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="setup-lock-pass" className="text-xs font-medium">
                  New Lock Password
                </Label>
                <div className="relative">
                  <Input
                    id="setup-lock-pass"
                    type={setupShowPassword ? "text" : "password"}
                    value={setupPassword}
                    onChange={(e) => {
                      setSetupPassword(e.target.value);
                      if (setupError) setSetupError(null);
                    }}
                    placeholder="Enter lock password"
                    className="pr-9 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setSetupShowPassword(!setupShowPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {setupShowPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="setup-lock-confirm"
                  className="text-xs font-medium"
                >
                  Confirm Lock Password
                </Label>
                <Input
                  id="setup-lock-confirm"
                  type={setupShowPassword ? "text" : "password"}
                  value={setupConfirm}
                  onChange={(e) => {
                    setSetupConfirm(e.target.value);
                    if (setupError) setSetupError(null);
                  }}
                  placeholder="Confirm lock password"
                  className="text-xs"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {setupError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                No minimum length or complexity rules required.
              </p>
              <Button
                type="submit"
                disabled={!setupPassword || isPending}
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>Set Password &amp; Enable</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lock Configuration Options (when lock is enabled) */}
      {enabled && (
        <div className="space-y-4">
          {/* Locking Policy */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
            <div className="mb-4 pb-3 border-b border-border/60">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>Locking Policy &amp; Triggers</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose when NextNotePad automatically requires your lock password.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="lock-policy-select"
                      className="text-xs font-medium"
                    >
                      Website Locking Condition
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Controls when subsequent visits require unlocking.
                    </p>
                  </div>
                </div>
                <Select
                  value={policy}
                  onValueChange={(v) =>
                    handleUpdateOptions({ policy: v as LockPolicy })
                  }
                >
                  <SelectTrigger
                    id="lock-policy-select"
                    className="w-full bg-background border-border/70 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_visit">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Next Visit (Recommended)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Lock when reopening browser, tab, or starting a new
                          session
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="new_day">
                      <div className="flex flex-col">
                        <span className="font-medium">New Day</span>
                        <span className="text-[11px] text-muted-foreground">
                          Lock on your first visit of each new calendar day
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="immediate">
                      <div className="flex flex-col">
                        <span className="font-medium">Always</span>
                        <span className="text-[11px] text-muted-foreground">
                          Lock on every visit or page refresh
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PWA Reopen Switch */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/50 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-3.5 text-primary" />
                    <Label
                      htmlFor="pwa-resume-lock"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Lock PWA on Reopen or Resume
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When you exit or switch away from the installed PWA and return,
                    require the password before revealing notes.
                  </p>
                </div>
                <Switch
                  id="pwa-resume-lock"
                  checked={pwaOnResume}
                  onCheckedChange={(checked) =>
                    handleUpdateOptions({ pwaOnResume: checked })
                  }
                />
              </div>

              {/* Inactivity Timeout */}
              <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="idle-timeout-select"
                      className="text-xs font-medium"
                    >
                      Auto-Lock on Inactivity
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically lock the app after a period without user input.
                    </p>
                  </div>
                </div>
                <Select
                  value={String(autoTimeoutMinutes)}
                  onValueChange={(v) =>
                    handleUpdateOptions({ autoTimeoutMinutes: parseInt(v, 10) })
                  }
                >
                  <SelectTrigger
                    id="idle-timeout-select"
                    className="w-full bg-background border-border/70 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <span className="font-medium">Disabled (Manual only)</span>
                    </SelectItem>
                    <SelectItem value="5">
                      <span className="font-medium">After 5 minutes</span>
                    </SelectItem>
                    <SelectItem value="15">
                      <span className="font-medium">After 15 minutes</span>
                    </SelectItem>
                    <SelectItem value="30">
                      <span className="font-medium">After 30 minutes</span>
                    </SelectItem>
                    <SelectItem value="60">
                      <span className="font-medium">After 1 hour</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Change Password / Disable Section */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
            <div className="mb-4 pb-3 border-b border-border/60 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Password Management
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your lock password or remove application locking.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {!showChangePassword ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                    className="h-8 gap-1.5 text-xs cursor-pointer"
                  >
                    <KeyRound className="size-3.5" />
                    <span>Change Lock Password</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisableDialog(true)}
                    className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <ShieldAlert className="size-3.5" />
                    <span>Disable Password Lock</span>
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleChangePassword}
                  className="rounded-lg border border-border/60 bg-background/50 p-4 space-y-3"
                >
                  <h5 className="text-xs font-semibold text-foreground">
                    Change Lock Password
                  </h5>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="change-current-pass"
                      className="text-xs font-medium"
                    >
                      Current Lock Password
                    </Label>
                    <Input
                      id="change-current-pass"
                      type={showChangeFields ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (changeError) setChangeError(null);
                      }}
                      placeholder="Enter current password"
                      className="text-xs"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="change-new-pass"
                        className="text-xs font-medium"
                      >
                        New Lock Password
                      </Label>
                      <Input
                        id="change-new-pass"
                        type={showChangeFields ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (changeError) setChangeError(null);
                        }}
                        placeholder="Enter new password"
                        className="text-xs"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="change-confirm-pass"
                        className="text-xs font-medium"
                      >
                        Confirm New Password
                      </Label>
                      <Input
                        id="change-confirm-pass"
                        type={showChangeFields ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          if (changeError) setChangeError(null);
                        }}
                        placeholder="Confirm new password"
                        className="text-xs"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {changeError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{changeError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowChangeFields(!showChangeFields)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                    >
                      {showChangeFields ? (
                        <>
                          <EyeOff className="size-3" /> Hide passwords
                        </>
                      ) : (
                        <>
                          <Eye className="size-3" /> Show passwords
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowChangePassword(false);
                          setChangeError(null);
                        }}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !currentPassword ||
                          !newPassword ||
                          !confirmNewPassword ||
                          isPending
                        }
                        size="sm"
                        className="h-7 gap-1.5 text-xs font-medium"
                      >
                        {isPending && (
                          <Loader2 className="size-3 animate-spin" />
                        )}
                        <span>Update Password</span>
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Disable Lock Form */}
              {showDisableDialog && (
                <form
                  onSubmit={handleDisableLock}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3"
                >
                  <h5 className="text-xs font-semibold text-destructive">
                    Confirm Disabling Lock
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Enter your current lock password to disable application
                    locking.
                  </p>
                  <div className="space-y-1.5">
                    <Input
                      type="password"
                      autoFocus
                      value={disablePassword}
                      onChange={(e) => {
                        setDisablePassword(e.target.value);
                        if (disableError) setDisableError(null);
                      }}
                      placeholder="Current lock password"
                      className="text-xs max-w-sm"
                    />
                  </div>

                  {disableError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{disableError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDisableDialog(false);
                        setDisableError(null);
                      }}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={!disablePassword || isPending}
                      size="sm"
                      className="h-7 gap-1.5 text-xs font-medium"
                    >
                      {isPending && <Loader2 className="size-3 animate-spin" />}
                      <span>Disable Lock</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
