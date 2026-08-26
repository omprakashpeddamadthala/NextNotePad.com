"use client";

import { useEffect, useState } from "react";
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

/** Shared across every visitor to this deployment (not a per-browser setting like the rest of
 *  Settings), so it's gated to whoever's signed in as ADMIN_EMAIL — see src/lib/auth/admin.ts.
 *  Never pre-fills an input with a real key: the server only ever reports whether one is set, so
 *  a field left blank on save means "no change", not "clear". */
export function AiConfigSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [status, setStatus] = useState<AiConfigStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("");
  const [agentRouterApiKey, setAgentRouterApiKey] = useState("");
  const [claudeModel, setClaudeModel] = useState("");

  function loadStatus() {
    fetchJson<AiConfigStatus>("/api/admin/ai-config", { action: "Load AI config" })
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

  async function save(extra?: Patch) {
    const patch: Patch = {
      ...(geminiApiKey && { geminiApiKey }),
      ...(geminiModel && { geminiModel }),
      ...(agentRouterApiKey && { agentRouterApiKey }),
      ...(claudeModel && { claudeModel }),
      ...extra,
    };
    if (Object.keys(patch).length === 0) {
      toast.info("Nothing to save — enter a value first.");
      return;
    }
    setSaving(true);
    try {
      const s = await fetchJson<AiConfigStatus>("/api/admin/ai-config", {
        ...jsonBody("PUT", patch),
        action: "Save AI config",
      });
      setStatus(s);
      setGeminiApiKey("");
      setGeminiModel("");
      setAgentRouterApiKey("");
      setClaudeModel("");
      toast.success("AI config saved.");
    } catch {
      toast.error("Couldn't save AI config.");
    } finally {
      setSaving(false);
    }
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
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sign in as the deployment admin to view or change this.
      </p>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Shared across everyone using this deployment — not a per-browser setting like the rest of
        Settings. Leave a field blank and save to keep its current value.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="gemini-api-key">
          Gemini API Key {status.gemini.apiKeyConfigured ? "(set)" : "(not set)"}
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="gemini-api-key"
            type="password"
            autoComplete="off"
            placeholder={status.gemini.apiKeyConfigured ? "•••• (leave blank to keep)" : "Not set"}
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
          />
          {status.gemini.apiKeyConfigured && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Clear (fall back to GEMINI_API_KEY env var)"
              onClick={() => void save({ geminiApiKey: null })}
              disabled={saving}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gemini-model">Gemini Model</Label>
        <Input
          id="gemini-model"
          autoComplete="off"
          placeholder={status.gemini.model ?? "gemini-3.6-flash (default)"}
          value={geminiModel}
          onChange={(e) => setGeminiModel(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="agentrouter-api-key">
          AgentRouter API Key {status.claude.apiKeyConfigured ? "(set)" : "(not set)"}
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="agentrouter-api-key"
            type="password"
            autoComplete="off"
            placeholder={status.claude.apiKeyConfigured ? "•••• (leave blank to keep)" : "Not set"}
            value={agentRouterApiKey}
            onChange={(e) => setAgentRouterApiKey(e.target.value)}
          />
          {status.claude.apiKeyConfigured && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Clear (fall back to AGENTROUTER_API_KEY env var)"
              onClick={() => void save({ agentRouterApiKey: null })}
              disabled={saving}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="claude-model">Claude Model</Label>
        <Input
          id="claude-model"
          autoComplete="off"
          placeholder={status.claude.model ?? "e.g. claude-opus-4-8 — required for Claude"}
          value={claudeModel}
          onChange={(e) => setClaudeModel(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Must be a model your AgentRouter key actually has access to — availability varies per key/plan.
        </p>
      </div>

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
