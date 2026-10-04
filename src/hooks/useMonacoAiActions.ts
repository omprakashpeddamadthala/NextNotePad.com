import { useRef } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import {
  correctText,
  generateMarkdown,
  generatePrompt,
} from "@/services/ai/aiText";
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
  snapBackIfUnchanged: boolean;
}

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
        editor.executeEdits("tools.ai", [{ range: spanFromStart(), text: original }]);
        editor.pushUndoStop();
      }
      toast.error(describeError(err, config.notConfiguredMessage), { id: toastId });
    })
    .finally(() => {
      isRunning.current = false;
    });
}

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
