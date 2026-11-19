import { toast } from "sonner";
import { generateId } from "@/lib/id";
import { readNoteContent } from "@/services/copyNote";
import { createFile } from "@/services/fileOperations";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  MAX_TEMPLATE_LENGTH,
  MAX_USER_TEMPLATES,
  extensionOf,
  fillPlaceholders,
  templateFileName,
  type NoteTemplate,
} from "./templateText";

function takenNames(parentId: string | null): Set<string> {
  return new Set(
    Object.values(useWorkspaceStore.getState().nodes)
      .filter((n) => n.parentId === parentId && !n.deleted)
      .map((n) => n.name.toLowerCase()),
  );
}

/** Creates a note from a template in the given folder and opens it. */
export async function createNoteFromTemplate(
  template: Pick<NoteTemplate, "name" | "extension" | "content">,
  parentId: string | null,
): Promise<void> {
  const now = new Date();
  const name = templateFileName(template.name, template.extension, now, takenNames(parentId));
  try {
    const id = await createFile(parentId, name, fillPlaceholders(template.content, now));
    useTabsStore.getState().openTab(id);
  } catch (err) {
    if (err instanceof Error && err.message === "duplicate-name") return;
    toast.error("Couldn't create a note from this template.");
  }
}

/** Saves the note's current text as one of your templates. Returns false if it wasn't saved. */
export async function saveNoteAsTemplate(fileId: string, templateName: string): Promise<boolean> {
  const node = useWorkspaceStore.getState().nodes[fileId];
  const name = templateName.trim();
  if (!node || node.type !== "file" || !name) return false;
  if (node.locked) {
    toast.error("Unlock this note before saving it as a template.");
    return false;
  }

  const { settings, updateSettings } = useSettingsStore.getState();
  if (settings.userTemplates.length >= MAX_USER_TEMPLATES) {
    toast.error(`You can keep up to ${MAX_USER_TEMPLATES} templates. Delete one in Settings first.`);
    return false;
  }

  let content: string;
  try {
    content = await readNoteContent(fileId);
  } catch {
    toast.error("Couldn't read this note.");
    return false;
  }
  if (content.length > MAX_TEMPLATE_LENGTH) {
    toast.error(`Templates can be up to ${MAX_TEMPLATE_LENGTH.toLocaleString()} characters.`);
    return false;
  }

  updateSettings({
    userTemplates: [
      ...settings.userTemplates,
      { id: generateId(), name, extension: extensionOf(node.name), content },
    ],
  });
  toast.success(`Saved "${name}" as a template`);
  return true;
}

export function deleteUserTemplate(id: string): void {
  const { settings, updateSettings } = useSettingsStore.getState();
  updateSettings({ userTemplates: settings.userTemplates.filter((t) => t.id !== id) });
}
