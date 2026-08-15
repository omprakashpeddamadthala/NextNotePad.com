"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { X, Plus, Trash2, Copy, Loader2, Webhook } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { useSettingsStore } from "@/store/settingsStore";
import { useHttpToolsViewStore } from "@/store/httpToolsViewStore";
import { generateId } from "@/lib/id";
import { sendHttpRequest, type HttpRequestResult } from "@/services/httpTools/httpClient";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
  ),
});

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

interface HeaderRow {
  id: string;
  key: string;
  value: string;
}

function newHeaderRow(): HeaderRow {
  return { id: generateId(), key: "", value: "" };
}

function statusColorClass(status: number): string {
  if (status >= 200 && status < 300) return "text-green-600 dark:text-green-400";
  if (status >= 300 && status < 400) return "text-blue-600 dark:text-blue-400";
  if (status >= 400 && status < 500) return "text-amber-600 dark:text-amber-400";
  if (status >= 500) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function languageForContentType(contentType: string | undefined): string {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("json")) return "json";
  if (ct.includes("html")) return "html";
  if (ct.includes("xml")) return "xml";
  if (ct.includes("javascript")) return "javascript";
  if (ct.includes("css")) return "css";
  return "plaintext";
}

function prettyPrint(body: string, language: string): string {
  if (language !== "json") return body;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

/** A single-request HTTP client: method + URL + headers + body, sent through the server-side
 *  proxy (avoids CORS), response shown right below — same on-tab convention as Diff Checker,
 *  no popup. */
export function HttpToolsView() {
  const theme = useSettingsStore((s) => s.theme);
  const closeHttpTools = useHttpToolsViewStore((s) => s.closeHttpTools);

  const [method, setMethod] = useState<(typeof HTTP_METHODS)[number]>("GET");
  const [url, setUrl] = useState("");
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([newHeaderRow()]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<HttpRequestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodyDisabled = method === "GET" || method === "HEAD";
  const themeModule = THEME_MODULES[theme];

  function updateHeaderRow(id: string, patch: Partial<HeaderRow>) {
    setHeaderRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeHeaderRow(id: string) {
    setHeaderRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  async function handleSend() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("Enter a URL first.");
      return;
    }
    const headers: Record<string, string> = {};
    for (const row of headerRows) {
      if (row.key.trim()) headers[row.key.trim()] = row.value;
    }

    setSending(true);
    setError(null);
    try {
      const res = await sendHttpRequest({
        method,
        url: trimmedUrl,
        headers,
        body: bodyDisabled ? "" : body,
      });
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSending(false);
    }
  }

  const responseLanguage = languageForContentType(result?.headers["content-type"]);
  const responseBody = result ? prettyPrint(result.body, responseLanguage) : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-2.5 text-sm">
        <Webhook className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">HTTP Tools</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={closeHttpTools}>
          <X className="size-3.5" /> Close
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b p-2">
        <Select value={method} onValueChange={(v) => setMethod(v as (typeof HTTP_METHODS)[number])}>
          <SelectTrigger size="sm" className="w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
          placeholder="https://api.example.com/endpoint"
          className="h-8 flex-1 font-mono text-xs"
        />
        <Button size="sm" onClick={() => void handleSend()} disabled={sending}>
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Send
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="40%" minSize="25%">
            <div className="np-scrollbar flex h-full flex-col gap-3 overflow-y-auto p-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Headers</p>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setHeaderRows((r) => [...r, newHeaderRow()])}>
                    <Plus className="size-3.5" /> Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {headerRows.map((row) => (
                    <div key={row.id} className="flex items-center gap-1.5">
                      <Input
                        value={row.key}
                        onChange={(e) => updateHeaderRow(row.id, { key: e.target.value })}
                        placeholder="Header name"
                        className="h-7 flex-1 font-mono text-xs"
                      />
                      <Input
                        value={row.value}
                        onChange={(e) => updateHeaderRow(row.id, { value: e.target.value })}
                        placeholder="Value"
                        className="h-7 flex-1 font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 px-0"
                        onClick={() => removeHeaderRow(row.id)}
                        disabled={headerRows.length === 1}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Body{bodyDisabled ? ` (not sent for ${method})` : ""}
                </p>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={bodyDisabled}
                  placeholder='{"key": "value"}'
                  className="min-h-32 flex-1 resize-none font-mono text-xs"
                />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="60%" minSize="30%">
            <div className="flex h-full flex-col">
              {error && (
                <div className="flex h-full items-center justify-center p-4 text-center text-sm text-destructive">
                  {error}
                </div>
              )}
              {!error && !result && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Send a request to see the response here.
                </div>
              )}
              {result && (
                <>
                  <div className="flex shrink-0 items-center gap-3 border-b px-3 py-2 text-sm">
                    <span className={cn("font-semibold", statusColorClass(result.status))}>
                      {result.status} {result.statusText}
                    </span>
                    <span className="text-xs text-muted-foreground">{result.durationMs}ms</span>
                    {result.truncated && <span className="text-xs text-amber-600 dark:text-amber-400">truncated</span>}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-2 text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(result.body);
                        toast.success("Response body copied.");
                      }}
                    >
                      <Copy className="size-3.5" /> Copy Body
                    </Button>
                  </div>
                  <div className="np-scrollbar shrink-0 max-h-32 overflow-y-auto border-b px-3 py-2 text-xs">
                    {Object.entries(result.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2 font-mono">
                        <span className="shrink-0 text-muted-foreground">{k}:</span>
                        <span className="min-w-0 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1">
                    {result.isBinary ? (
                      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                        {result.body}
                      </div>
                    ) : (
                      <MonacoEditor
                        language={responseLanguage}
                        theme={themeModule.monacoThemeId}
                        beforeMount={handleMonacoBeforeMount}
                        value={responseBody}
                        options={{ readOnly: true, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
