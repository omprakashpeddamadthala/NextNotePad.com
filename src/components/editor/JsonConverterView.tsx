"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { X, FileJson, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { useSettingsStore } from "@/store/settingsStore";
import { useJsonConverterViewStore } from "@/store/jsonConverterViewStore";
import { jsonToCsv, jsonToYaml } from "@/services/textTools/dataConverters";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
  ),
});

type OutputFormat = "csv" | "yaml";

const SAMPLE = '[\n  { "id": 1, "name": "Ada Lovelace" },\n  { "id": 2, "name": "Grace Hopper" }\n]';

/** Paste JSON, get CSV or YAML back — same on-tab convention as Diff Checker. Converts live as
 *  you type, no separate "convert" step. */
export function JsonConverterView() {
  const theme = useSettingsStore((s) => s.theme);
  const closeJsonConverter = useJsonConverterViewStore((s) => s.closeJsonConverter);

  const [input, setInput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("csv");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null as string | null };
    try {
      const converted = format === "csv" ? jsonToCsv(input) : jsonToYaml(input);
      return { output: converted, error: null };
    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : "Couldn't parse this as JSON." };
    }
  }, [input, format]);

  const themeModule = THEME_MODULES[theme];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-2.5 text-sm">
        <FileJson className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">JSON Converter</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={closeJsonConverter}>
          <X className="size-3.5" /> Close
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col border-r p-3">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">JSON Input</p>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={SAMPLE}
            className="min-h-32 flex-1 resize-none font-mono text-xs"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b p-2">
            <Button
              size="sm"
              variant={format === "csv" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFormat("csv")}
            >
              CSV
            </Button>
            <Button
              size="sm"
              variant={format === "yaml" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFormat("yaml")}
            >
              YAML
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 px-2 text-xs"
              disabled={!output}
              onClick={() => {
                void navigator.clipboard.writeText(output);
                toast.success("Copied.");
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
          </div>
          <div className={cn("min-h-0 flex-1", error && "flex items-center justify-center p-4")}>
            {error ? (
              <p className="text-center text-sm text-destructive">{error}</p>
            ) : (
              <MonacoEditor
                language={format === "yaml" ? "yaml" : "plaintext"}
                theme={themeModule.monacoThemeId}
                beforeMount={handleMonacoBeforeMount}
                value={output}
                options={{ readOnly: true, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
