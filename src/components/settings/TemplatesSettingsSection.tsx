"use client";

import { LayoutTemplate, Trash2 } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useDialogStore } from "@/store/dialogStore";
import { deleteUserTemplate } from "@/services/templates/noteTemplates";
import { MAX_USER_TEMPLATES } from "@/services/templates/templateText";

export function TemplatesSettingsSection() {
  const templates = useSettingsStore((s) => s.settings.userTemplates);
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
      <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutTemplate className="size-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Your Templates</h4>
          <p className="text-xs text-muted-foreground">
            Save any note as a template from File → New from Template. Up to {MAX_USER_TEMPLATES}.
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No templates yet.{" "}
          <button
            type="button"
            onClick={() => openDialog("templates")}
            className="text-primary underline-offset-4 hover:underline"
          >
            Open templates
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-border/50 rounded-lg border border-border/50 bg-background/50">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  .{t.extension} · {t.content.length.toLocaleString()} characters
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteUserTemplate(t.id)}
                aria-label={`Delete template ${t.name}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
