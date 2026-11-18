import { toast } from "sonner";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { getActiveRepository } from "@/services/storage/activeRepository";

/** Latest text of a note: the open editor model if there is one, otherwise the saved copy. */
export async function readNoteContent(fileId: string): Promise<string> {
  const model = modelRegistry.getModel(fileId);
  if (model) return model.getValue();
  return getActiveRepository().readFileContent(fileId);
}

export async function copyText(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Couldn't copy. Your browser blocked clipboard access.");
  }
}

export async function copyNote(fileId: string): Promise<void> {
  try {
    const content = await readNoteContent(fileId);
    await copyText(content, "Note copied");
  } catch {
    toast.error("Couldn't read this note to copy it.");
  }
}
