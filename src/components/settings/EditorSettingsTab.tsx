"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";
import type { CursorStyle } from "@/types/settings";

const numericFieldsSchema = z.object({
  fontFamily: z.string().min(1, "Required"),
  fontSize: z.number().int().min(8, "Min 8").max(40, "Max 40"),
  tabWidth: z.number().int().min(1, "Min 1").max(8, "Max 8"),
});

type NumericFields = z.infer<typeof numericFieldsSchema>;

const CURSOR_STYLES: { value: CursorStyle; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "line-thin", label: "Line (thin)" },
  { value: "block", label: "Block" },
  { value: "block-outline", label: "Block (outline)" },
  { value: "underline", label: "Underline" },
  { value: "underline-thin", label: "Underline (thin)" },
];

export function EditorSettingsTab() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<NumericFields>({
    resolver: zodResolver(numericFieldsSchema),
    mode: "onChange",
    defaultValues: {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      tabWidth: settings.tabWidth,
    },
  });

  const watched = watch();

  useEffect(() => {
    const parsed = numericFieldsSchema.safeParse(watched);
    if (parsed.success) updateSettings(parsed.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.fontFamily, watched.fontSize, watched.tabWidth]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fontFamily">Font Family</Label>
          <Input id="fontFamily" {...register("fontFamily")} />
          {errors.fontFamily && <p className="text-xs text-destructive">{errors.fontFamily.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fontSize">Font Size</Label>
          <Input id="fontSize" type="number" {...register("fontSize", { valueAsNumber: true })} />
          {errors.fontSize && <p className="text-xs text-destructive">{errors.fontSize.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tabWidth">Tab Width</Label>
          <Input id="tabWidth" type="number" {...register("tabWidth", { valueAsNumber: true })} />
          {errors.tabWidth && <p className="text-xs text-destructive">{errors.tabWidth.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Cursor Style</Label>
          <Select
            value={settings.cursorStyle}
            onValueChange={(v) => updateSettings({ cursorStyle: v as CursorStyle })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURSOR_STYLES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {(
          [
            ["insertSpaces", "Insert Spaces (not tabs)"],
            ["wordWrap", "Word Wrap"],
            ["showLineNumbers", "Line Numbers"],
            ["showMinimap", "Minimap"],
            ["renderWhitespace", "Show Whitespace"],
            ["autoClosingBrackets", "Auto-Close Brackets"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <Label htmlFor={key} className="font-normal">
              {label}
            </Label>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={(v) => updateSettings({ [key]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
