"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Server,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { ApiError, fetchJson, jsonBody } from "@/lib/api/fetchJson";

interface AiConfigStatus {
  gemini: { apiKeyConfigured: boolean; model: string | null };
  claude: { apiKeyConfigured: boolean; model: string | null };
}

type Patch = Partial<{
  geminiApiKey: string | null;
  geminiModel: string | null;
  agentRouterApiKey: string | null;
  claudeModel: string | null;
}>;

const apiKeySchema = z
  .string()
  .refine(
    (v) => v === "" || v.trim() === v,
    "Remove leading/trailing whitespace",
  )
  .refine(
    (v) => v === "" || v.length >= 10,
    "That doesn't look like a valid API key",
  );

const modelNameSchema = z
  .string()
  .refine(
    (v) => v === "" || v.trim() === v,
    "Remove leading/trailing whitespace",
  )
  .refine((v) => v === "" || !/\s/.test(v), "Model name can't contain spaces");

const aiConfigFormSchema = z.object({
  geminiApiKey: apiKeySchema,
  geminiModel: modelNameSchema,
  agentRouterApiKey: apiKeySchema,
  claudeModel: modelNameSchema,
});

type AiConfigFormValues = z.infer<typeof aiConfigFormSchema>;

const EMPTY_FORM_VALUES: AiConfigFormValues = {
  geminiApiKey: "",
  geminiModel: "",
  agentRouterApiKey: "",
  claudeModel: "",
};

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Recommended" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "Fast" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tag: "High Reasoning" },
];

const CLAUDE_MODELS = [
  { id: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", tag: "Latest" },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", tag: "Coding" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", tag: "Enterprise" },
];

export function AiConfigSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [status, setStatus] = useState<AiConfigStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AiConfigFormValues>({
    resolver: zodResolver(aiConfigFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM_VALUES,
  });

  function loadStatus() {
    fetchJson<AiConfigStatus>("/api/admin/ai-config", {
      action: "Load AI config",
    })
      .then((s) => {
        setStatus(s);
        setForbidden(false);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
        else toast.error("Couldn't load AI config.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadStatus, []);

  async function submitPatch(
    patch: Patch,
    { resetForm }: { resetForm: boolean },
  ) {
    setSaving(true);
    try {
      const s = await fetchJson<AiConfigStatus>("/api/admin/ai-config", {
        ...jsonBody("PUT", patch),
        action: "Save AI config",
      });
      setStatus(s);
      if (resetForm) reset(EMPTY_FORM_VALUES);
      toast.success("AI configuration saved successfully.");
    } catch {
      toast.error("Couldn't save AI configuration.");
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(values: AiConfigFormValues) {
    const patch: Patch = {
      ...(values.geminiApiKey && { geminiApiKey: values.geminiApiKey }),
      ...(values.geminiModel && { geminiModel: values.geminiModel }),
      ...(values.agentRouterApiKey && {
        agentRouterApiKey: values.agentRouterApiKey,
      }),
      ...(values.claudeModel && { claudeModel: values.claudeModel }),
    };
    if (Object.keys(patch).length === 0) {
      toast.info("No modifications to save. Update a field first.");
      return;
    }
    void submitPatch(patch, { resetForm: true });
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <SkeletonText lines={4} />
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <SkeletonText lines={4} />
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="size-10 text-rose-500 mx-auto mb-3 opacity-90" />
        <h4 className="text-base font-semibold text-foreground">Deployment Admin Required</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
          AI configuration is deployment-wide and affects all workspace visitors. Sign in as the designated deployment administrator to modify backend AI credentials.
        </p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* Header Info */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Server AI Intelligence Configuration</h4>
              <p className="text-xs text-muted-foreground">Manage deployment-wide Google Gemini &amp; Claude LLM credentials</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" /> Admin Authenticated
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Server className="size-3.5 text-primary shrink-0" />
          <span>Shared deployment settings. Leaving fields empty preserves currently stored server keys.</span>
        </div>
      </div>

      {/* Google Gemini Card */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-semibold text-xs">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">Google Gemini</h4>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                  status.gemini.apiKeyConfigured
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}>
                  {status.gemini.apiKeyConfigured ? "Key Active" : "Not Set"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Direct Google Generative AI integration</p>
            </div>
          </div>
        </div>

        {/* Gemini API Key Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="gemini-api-key" className="text-xs font-semibold">
              Gemini API Key
            </Label>
            {status.gemini.apiKeyConfigured && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Key saved in database
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="gemini-api-key"
                type={showGeminiKey ? "text" : "password"}
                autoComplete="off"
                placeholder={
                  status.gemini.apiKeyConfigured
                    ? "•••••••••••••••• (leave blank to keep)"
                    : "Enter AIzaSy... API key"
                }
                className="pr-10 bg-background/60 font-mono text-xs"
                {...register("geminiApiKey")}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showGeminiKey ? "Hide key" : "Show key"}
              >
                {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {status.gemini.apiKeyConfigured && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Clear key (fall back to GEMINI_API_KEY environment variable)"
                onClick={() =>
                  void submitPatch({ geminiApiKey: null }, { resetForm: false })
                }
                disabled={saving}
                className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          {errors.geminiApiKey && (
            <p className="text-destructive text-xs">{errors.geminiApiKey.message}</p>
          )}
        </div>

        {/* Gemini Model Field */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="gemini-model" className="text-xs font-semibold">
              Gemini Model ID
            </Label>
            <span className="text-[11px] text-muted-foreground">Select preset or type custom</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GEMINI_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setValue("geminiModel", m.id, { shouldValidate: true })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                <span>{m.label}</span>
                <span className="text-[10px] text-muted-foreground bg-background/80 px-1 rounded">
                  {m.tag}
                </span>
              </button>
            ))}
          </div>

          <Input
            id="gemini-model"
            autoComplete="off"
            placeholder={status.gemini.model ?? "gemini-2.5-flash (default)"}
            className="font-mono text-xs bg-background/60"
            {...register("geminiModel")}
          />
          {errors.geminiModel && (
            <p className="text-destructive text-xs">{errors.geminiModel.message}</p>
          )}
        </div>
      </div>

      {/* Claude via AgentRouter Card */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-semibold text-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">Claude (via AgentRouter)</h4>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                  status.claude.apiKeyConfigured
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}>
                  {status.claude.apiKeyConfigured ? "Key Active" : "Not Set"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Anthropic Claude models routed via AgentRouter endpoint</p>
            </div>
          </div>
        </div>

        {/* AgentRouter API Key Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="agentrouter-api-key" className="text-xs font-semibold">
              AgentRouter API Key
            </Label>
            {status.claude.apiKeyConfigured && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Key saved in database
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="agentrouter-api-key"
                type={showClaudeKey ? "text" : "password"}
                autoComplete="off"
                placeholder={
                  status.claude.apiKeyConfigured
                    ? "•••••••••••••••• (leave blank to keep)"
                    : "Enter sk-... API key"
                }
                className="pr-10 bg-background/60 font-mono text-xs"
                {...register("agentRouterApiKey")}
              />
              <button
                type="button"
                onClick={() => setShowClaudeKey(!showClaudeKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showClaudeKey ? "Hide key" : "Show key"}
              >
                {showClaudeKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {status.claude.apiKeyConfigured && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Clear key (fall back to AGENTROUTER_API_KEY environment variable)"
                onClick={() =>
                  void submitPatch(
                    { agentRouterApiKey: null },
                    { resetForm: false },
                  )
                }
                disabled={saving}
                className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          {errors.agentRouterApiKey && (
            <p className="text-destructive text-xs">{errors.agentRouterApiKey.message}</p>
          )}
        </div>

        {/* Claude Model Field */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="claude-model" className="text-xs font-semibold">
              Claude Model ID
            </Label>
            <span className="text-[11px] text-muted-foreground">Select preset or type custom</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CLAUDE_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setValue("claudeModel", m.id, { shouldValidate: true })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                <span>{m.label}</span>
                <span className="text-[10px] text-muted-foreground bg-background/80 px-1 rounded">
                  {m.tag}
                </span>
              </button>
            ))}
          </div>

          <Input
            id="claude-model"
            autoComplete="off"
            placeholder={status.claude.model ?? "e.g. claude-opus-4-8 (required for Claude)"}
            className="font-mono text-xs bg-background/60"
            {...register("claudeModel")}
          />
          {errors.claudeModel && (
            <p className="text-destructive text-xs">{errors.claudeModel.message}</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(EMPTY_FORM_VALUES)}
          disabled={saving}
          className="text-xs"
        >
          Discard Changes
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="gap-2 text-xs font-semibold px-5"
        >
          <Save className="size-3.5" />
          {saving ? "Saving Configuration…" : "Save AI Credentials"}
        </Button>
      </div>
    </form>
  );
}
