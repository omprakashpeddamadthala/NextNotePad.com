import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";

interface Entry {
  model: MonacoEditorNS.ITextModel;
  lastSavedValue: string;
}

const registry = new Map<string, Entry>();

export function getModel(fileId: string): MonacoEditorNS.ITextModel | undefined {
  return registry.get(fileId)?.model;
}

export function getOrCreateModel(
  monaco: Monaco,
  fileId: string,
  content: string,
  language: string,
): MonacoEditorNS.ITextModel {
  const existing = registry.get(fileId);
  if (existing) return existing.model;
  const uri = monaco.Uri.parse(`inmemory://notepad-web/${fileId}`);
  const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(content, language, uri);
  registry.set(fileId, { model, lastSavedValue: content });
  return model;
}

export function setModelLanguage(monaco: Monaco, fileId: string, language: string): void {
  const entry = registry.get(fileId);
  if (entry) monaco.editor.setModelLanguage(entry.model, language);
}

export function markSaved(fileId: string, value: string): void {
  const entry = registry.get(fileId);
  if (entry) entry.lastSavedValue = value;
}

export function isDirty(fileId: string): boolean {
  const entry = registry.get(fileId);
  if (!entry) return false;
  return entry.model.getValue() !== entry.lastSavedValue;
}

/** Disposes and forgets a file's model — used when locking a file, so the next time it's opened
 *  `getModel` correctly returns undefined instead of handing back a stale plaintext model. */
export function disposeModel(fileId: string): void {
  const entry = registry.get(fileId);
  if (!entry) return;
  entry.model.dispose();
  registry.delete(fileId);
}
