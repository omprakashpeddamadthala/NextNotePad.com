import { useRef } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import { correctText } from "@/services/ai/correctText";
import { generateMarkdown } from "@/services/ai/generateMarkdown";
import { generatePrompt } from "@/services/ai/generatePrompt";
import { ApiError } from "@/lib/api/fetchJson";
import type { AiProvider } from "@/types/settings";

interface UseMonacoAiActionsParams {
  registerGlobalActions: boolean | undefined;
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
}

function describeError(err: unknown, notConfiguredMessage: string): string {
  if (err instanceof ApiError) {
    if (err.status === 503) return notConfiguredMessage;
    if (err.status === 429)
      return "AI is rate-limited right now — try again shortly.";
    if (err.status === 403)
      return "The selected AI provider doesn't have access to its configured model.";
    return err.message;
  }
  return "Couldn't reach the AI service.";
}

type StreamCall = (
  text: string,
  onChunk: (delta: string) => void,
  providerOverride?: AiProvider,
) => Promise<string>;

interface StreamingAiActionConfig {
  isRunning: RefObject<boolean>;
  call: StreamCall;
  busyMessage: string;
  emptyMessage: string;
  loadingMessage: string;
  unchangedMessage: string;
  changedMessage: string;
  notConfiguredMessage: string;
  /** Whether streamed-but-unchanged output should snap back to the exact original text — makes
   *  sense for a proofreader (drift is never intentional) but not for a rewrite whose whole job
   *  is to change the text's shape (a genuinely no-op rewrite is rare and harmless either way). */
  snapBackIfUnchanged: boolean;
}

/** Shared engine behind every "select text, stream an AI rewrite over it" action: guards against
 *  overlapping runs, falls back to the whole document when nothing's selected (same convention as
 *  the other Tools-menu commands), streams the selection's replacement in incrementally as chunks
 *  arrive so long requests read as progressive rather than a multi-second blocking wait, and
 *  restores the original text if the stream fails partway through. `runFixGrammar` and
 *  `runGenerateMarkdown` each just supply their own network call and messaging. */
function runStreamingAiAction(
  editor: MonacoEditorNS.IStandaloneCodeEditor,
  config: StreamingAiActionConfig,
  providerOverride?: AiProvider,
): void {
  const { isRunning } = config;
  if (isRunning.current) {
    toast.info(config.busyMessage);
    return;
  }

  const model = editor.getModel();
  if (!model) return;

  const selection = editor.getSelection();
  const hasSelection = Boolean(selection && !selection.isEmpty());
  const range =
    hasSelection && selection ? selection : model.getFullModelRange();
  const original = model.getValueInRange(range);
  if (!original.trim()) {
    toast.error(config.emptyMessage);
    return;
  }

  isRunning.current = true;
  const toastId = toast.loading(config.loadingMessage);

  // The first chunk replaces the original selection; every chunk after that is a plain insert at
  // wherever streaming left off, so each edit only costs what's new — not the whole response
  // re-written on every chunk (which would get slower and slower as the response grows, the
  // opposite of the ChatGPT-style typewriter feel this is going for).
  const startOffset = model.getOffsetAt(range.getStartPosition());
  let endOffset = startOffset;
  let firstChunk = true;
  let streamed = false;

  function spanFromStart(): {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } {
    const endPos = model!.getPositionAt(endOffset);
    return {
      startLineNumber: range.startLineNumber,
      startColumn: range.startColumn,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
    };
  }

  void config
    .call(
      original,
      (delta) => {
        streamed = true;
        const insertPos = model.getPositionAt(endOffset);
        const editRange = firstChunk
          ? range
          : {
              startLineNumber: insertPos.lineNumber,
              startColumn: insertPos.column,
              endLineNumber: insertPos.lineNumber,
              endColumn: insertPos.column,
            };
        editor.executeEdits("tools.ai", [{ range: editRange, text: delta }]);
        firstChunk = false;
        endOffset += delta.length;
      },
      providerOverride,
    )
    .then((result) => {
      const currentRange = spanFromStart();
      if (
        config.snapBackIfUnchanged &&
        result.trim() === original.trim() &&
        result !== original
      ) {
        // Streaming can drift on trivial whitespace even when no real change was made — snap
        // back to the exact original text rather than leave that drift.
        editor.executeEdits("tools.ai", [{ range: currentRange, text: original }]);
      }
      editor.pushUndoStop();
      if (result.trim() === original.trim()) {
        toast.success(config.unchangedMessage, { id: toastId });
      } else {
        toast.success(config.changedMessage, { id: toastId });
      }
    })
    .catch((err: unknown) => {
      if (streamed) {
        // Restore whatever partial/garbled text the failed stream left behind.
        editor.executeEdits("tools.ai", [{ range: spanFromStart(), text: original }]);
        editor.pushUndoStop();
      }
      toast.error(describeError(err, config.notConfiguredMessage), { id: toastId });
    })
    .finally(() => {
      isRunning.current = false;
    });
}

/** Wires the AI-powered Monaco actions ("Fix Grammar & Spelling", "Generate MD Syntax", and
 *  "Generate Prompt") into the shared action registry.
 *
 *  Each feature shares one in-flight guard across its own three ids (so you can't kick off two
 *  runs of the *same* feature on the same selection at once, whichever id triggered them), but
 *  the features guard independently of each other: "tools.ai.fixGrammar" /
 *  "tools.ai.generateMdSyntax" / "tools.ai.generatePrompt" run whatever provider is set in
 *  Settings > General (used by their right-click context-menu action and Command Palette entry),
 *  while ".gemini"/".claude" suffixes force a specific provider for that one call (the Tools
 *  menu's submenus). */
export function useMonacoAiActions({
  registerGlobalActions,
  editorRef,
}: UseMonacoAiActionsParams): void {
  const isFixingGrammar = useRef(false);
  const isGeneratingMarkdown = useRef(false);
  const isGeneratingPrompt = useRef(false);

  function runFixGrammar(providerOverride?: AiProvider) {
    if (!registerGlobalActions || !editorRef.current) return;
    runStreamingAiAction(
      editorRef.current,
      {
        isRunning: isFixingGrammar,
        call: correctText,
        busyMessage: "Already correcting text — hang tight.",
        emptyMessage:
          "Nothing to correct — select some text or open a file with content.",
        loadingMessage: "Asking AI to correct this text…",
        unchangedMessage: "No corrections needed.",
        changedMessage: "Text corrected.",
        notConfiguredMessage: "AI correction isn't configured on this server yet.",
        snapBackIfUnchanged: true,
      },
      providerOverride,
    );
  }

  function runGenerateMarkdown(providerOverride?: AiProvider) {
    if (!registerGlobalActions || !editorRef.current) return;
    runStreamingAiAction(
      editorRef.current,
      {
        isRunning: isGeneratingMarkdown,
        call: generateMarkdown,
        busyMessage: "Already generating Markdown — hang tight.",
        emptyMessage:
          "Nothing to format — select some text or open a file with content.",
        loadingMessage: "Asking AI to generate Markdown…",
        unchangedMessage: "Already good Markdown — nothing to change.",
        changedMessage: "Markdown generated.",
        notConfiguredMessage: "AI Markdown generation isn't configured on this server yet.",
        snapBackIfUnchanged: false,
      },
      providerOverride,
    );
  }

  function runGeneratePrompt(providerOverride?: AiProvider) {
    if (!registerGlobalActions || !editorRef.current) return;
    runStreamingAiAction(
      editorRef.current,
      {
        isRunning: isGeneratingPrompt,
        call: generatePrompt,
        busyMessage: "Already generating a prompt — hang tight.",
        emptyMessage:
          "Nothing to work from — select some text or open a file with content.",
        loadingMessage: "Asking AI to generate a prompt…",
        unchangedMessage: "Already a prompt — nothing to change.",
        changedMessage: "Prompt generated.",
        notConfiguredMessage: "AI prompt generation isn't configured on this server yet.",
        snapBackIfUnchanged: false,
      },
      providerOverride,
    );
  }

  useRegisterAction("tools.ai.fixGrammar", () => runFixGrammar(), [registerGlobalActions]);
  useRegisterAction("tools.ai.fixGrammar.gemini", () => runFixGrammar("gemini"), [registerGlobalActions]);
  useRegisterAction("tools.ai.fixGrammar.claude", () => runFixGrammar("claude"), [registerGlobalActions]);

  useRegisterAction("tools.ai.generateMdSyntax", () => runGenerateMarkdown(), [registerGlobalActions]);
  useRegisterAction("tools.ai.generateMdSyntax.gemini", () => runGenerateMarkdown("gemini"), [registerGlobalActions]);
  useRegisterAction("tools.ai.generateMdSyntax.claude", () => runGenerateMarkdown("claude"), [registerGlobalActions]);

  useRegisterAction("tools.ai.generatePrompt", () => runGeneratePrompt(), [registerGlobalActions]);
  useRegisterAction("tools.ai.generatePrompt.gemini", () => runGeneratePrompt("gemini"), [registerGlobalActions]);
  useRegisterAction("tools.ai.generatePrompt.claude", () => runGeneratePrompt("claude"), [registerGlobalActions]);
}
