"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDialogStore } from "@/store/dialogStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import {
  createNoteFromTemplate,
  deleteUserTemplate,
  saveNoteAsTemplate,
} from "@/services/templates/noteTemplates";
import { BUILT_IN_TEMPLATES } from "@/services/templates/templateText";

interface TemplateCardProps {
  name: string;
  detail: string;
  onPick: () => void;
  onDelete?: () => void;
}

function TemplateCard({ name, detail, onPick, onDelete }: TemplateCardProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onPick}
        className="border-border/70 hover:border-primary/50 hover:bg-accent/60 focus-visible:ring-ring flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <FileText className="text-primary mt-0.5 size-4 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
            {detail}
          </span>
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete template ${name}`}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </li>
  );
}

export function TemplatesDialog() {
  const open = useDialogStore((s) => s.open.templates);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);
  const userTemplates = useSettingsStore((s) => s.settings.userTemplates);
  const parentId = useNewNodeTargetParentId();
  const { file } = useActiveFile();
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const canSaveCurrent = file?.type === "file" && !file.locked;

  function close() {
    setDialogOpen("templates", false);
  }

  async function pick(template: { name: string; extension: string; content: string }) {
    close();
    await createNoteFromTemplate(template, parentId);
  }

  async function saveCurrent() {
    if (!file) return;
    setSaving(true);
    const saved = await saveNoteAsTemplate(file.id, templateName);
    setSaving(false);
    if (saved) setTemplateName("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("templates", v)}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New from template</DialogTitle>
          <DialogDescription>
            Start a note from a ready layout. Dates and times fill in for you.
          </DialogDescription>
        </DialogHeader>

        <ul className="grid gap-2 sm:grid-cols-2">
          {BUILT_IN_TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              name={t.name}
              detail={t.description}
              onPick={() => void pick(t)}
            />
          ))}
        </ul>

        {userTemplates.length > 0 && (
          <section>
            <h3 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.1em] uppercase">
              Your templates
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {userTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  name={t.name}
                  detail={t.content.trim().split("\n")[0] || `Empty .${t.extension} note`}
                  onPick={() => void pick(t)}
                  onDelete={() => deleteUserTemplate(t.id)}
                />
              ))}
            </ul>
          </section>
        )}

        {canSaveCurrent && (
          <form
            className="border-border/70 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              void saveCurrent();
            }}
          >
            <label htmlFor="template-name" className="text-sm font-medium sm:sr-only">
              Save current note as a template
            </label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={`Template name, e.g. "Weekly review"`}
              maxLength={60}
              className="sm:flex-1"
            />
            <Button type="submit" variant="secondary" disabled={!templateName.trim() || saving}>
              Save current note as template
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
