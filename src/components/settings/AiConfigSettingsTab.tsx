"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
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

/** Every field is optional — blank means "keep the current value", not "invalid" — so each
 *  refinement only fires once a value is actually entered. */
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

/** Shared across every visitor to this deployment (not a per-browser setting like the rest of
 *  Settings), so it's gated to admins only — see src/lib/auth/admin.ts.
 *  Never pre-fills an input with a real key: the server only ever reports whether one is set, so
 *  a field left blank on save means "no change", not "clear". */
export function AiConfigSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [status, setStatus] = useState<AiConfigStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
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
      toast.success("AI config saved.");
    } catch {
      toast.error("Couldn't save AI config.");
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
      toast.info("Nothing to save — enter a value first.");
      return;
    }
    void submitPatch(patch, { resetForm: true });
  }

  if (loading) {
    return (
      <div className="py-4">
        <SkeletonText lines={5} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Sign in as the deployment admin to view or change this.
      </p>
    );
  }

  if (!status) return null;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-muted-foreground text-xs">
        Shared across everyone using this deployment — not a per-browser setting
        like the rest of Settings. Leave a field blank and save to keep its
        current value.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="gemini-api-key">
          Gemini API Key{" "}
          {status.gemini.apiKeyConfigured ? "(set)" : "(not set)"}
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="gemini-api-key"
            type="password"
            autoComplete="off"
            aria-invalid={!!errors.geminiApiKey}
            placeholder={
              status.gemini.apiKeyConfigured
                ? "•••• (leave blank to keep)"
                : "Not set"
            }
            {...register("geminiApiKey")}
          />
          {status.gemini.apiKeyConfigured && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Clear (fall back to GEMINI_API_KEY env var)"
              onClick={() =>
                void submitPatch({ geminiApiKey: null }, { resetForm: false })
              }
              disabled={saving}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        {errors.geminiApiKey && (
          <p className="text-destructive text-xs">
            {errors.geminiApiKey.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gemini-model">Gemini Model</Label>
        <Input
          id="gemini-model"
          autoComplete="off"
          aria-invalid={!!errors.geminiModel}
          placeholder={status.gemini.model ?? "gemini-3.6-flash (default)"}
          {...register("geminiModel")}
        />
        {errors.geminiModel && (
          <p className="text-destructive text-xs">
            {errors.geminiModel.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="agentrouter-api-key">
          AgentRouter API Key{" "}
          {status.claude.apiKeyConfigured ? "(set)" : "(not set)"}
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="agentrouter-api-key"
            type="password"
            autoComplete="off"
            aria-invalid={!!errors.agentRouterApiKey}
            placeholder={
              status.claude.apiKeyConfigured
                ? "•••• (leave blank to keep)"
                : "Not set"
            }
            {...register("agentRouterApiKey")}
          />
          {status.claude.apiKeyConfigured && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Clear (fall back to AGENTROUTER_API_KEY env var)"
              onClick={() =>
                void submitPatch(
                  { agentRouterApiKey: null },
                  { resetForm: false },
                )
              }
              disabled={saving}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        {errors.agentRouterApiKey && (
          <p className="text-destructive text-xs">
            {errors.agentRouterApiKey.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="claude-model">Claude Model</Label>
        <Input
          id="claude-model"
          autoComplete="off"
          aria-invalid={!!errors.claudeModel}
          placeholder={
            status.claude.model ?? "e.g. claude-opus-4-8 — required for Claude"
          }
          {...register("claudeModel")}
        />
        {errors.claudeModel && (
          <p className="text-destructive text-xs">
            {errors.claudeModel.message}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Must be a model your AgentRouter key actually has access to —
          availability varies per key/plan.
        </p>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
