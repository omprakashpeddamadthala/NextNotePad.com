"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Server,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { ApiError, fetchJson, jsonBody } from "@/lib/api/fetchJson";

interface AiConfigStatus {
  gemini: { apiKeyConfigured: boolean; model: string | null };
}

type Patch = Partial<{
  geminiApiKey: string | null;
  geminiModel: string | null;
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
});

type AiConfigFormValues = z.infer<typeof aiConfigFormSchema>;

const EMPTY_FORM_VALUES: AiConfigFormValues = {
  geminiApiKey: "",
  geminiModel: "",
};

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Recommended", desc: "Fastest response with advanced multimodal reasoning" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "Fast", desc: "Low-latency balanced completions" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tag: "High Reasoning", desc: "Deep code analysis & context window" },
];

export function AdminAiConfigSection() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [status, setStatus] = useState<AiConfigStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

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
      toast.success("Google Gemini configuration saved successfully.");
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
    };
    if (Object.keys(patch).length === 0) {
      toast.info("No modifications to save. Update a field first.");
      return;
    }
    void submitPatch(patch, { resetForm: true });
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4 max-w-3xl">
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
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center max-w-2xl mx-auto my-8">
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
    <form className="space-y-6 max-w-3xl pb-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Google Gemini Configuration</h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    status.gemini.apiKeyConfigured
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border border-border/60"
                  }`}
                >
                  {status.gemini.apiKeyConfigured ? "Key Active" : "Not Configured"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Official Google GenAI engine powering grammar correction, markdown generation &amp; prompt assistance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" /> Admin Authenticated
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Server className="size-3.5 text-primary shrink-0" />
          <span>Stored securely in PostgreSQL database. Leaving the key field empty keeps the currently active key.</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs space-y-5">
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
                    ? "•••••••••••••••• (leave blank to keep current key)"
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
                className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          {errors.geminiApiKey ? (
            <p className="text-destructive text-xs">{errors.geminiApiKey.message}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Obtain your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Google AI Studio</a>.
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gemini-model" className="text-xs font-semibold flex items-center gap-1.5">
                <Zap className="size-3.5 text-blue-500" /> Model Selection
              </Label>
              <p className="text-[11px] text-muted-foreground">Select a fast preset or specify a custom Google Gemini model ID</p>
            </div>
            {status.gemini.model && (
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Active: {status.gemini.model}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GEMINI_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setValue("geminiModel", m.id, { shouldValidate: true })}
                className="flex flex-col text-left p-2.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/80 hover:border-border transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold text-foreground font-mono">{m.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-background border border-border/50 text-muted-foreground">
                    {m.tag}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{m.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <Label htmlFor="gemini-model" className="text-[11px] text-muted-foreground">
              Custom Model ID
            </Label>
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
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(EMPTY_FORM_VALUES)}
          disabled={saving}
          className="text-xs cursor-pointer"
        >
          Discard Changes
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="gap-2 text-xs font-semibold px-5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="size-3.5" />
          {saving ? "Saving Configuration…" : "Save Gemini Credentials"}
        </Button>
      </div>
    </form>
  );
}
