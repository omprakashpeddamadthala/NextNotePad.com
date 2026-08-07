"use client";

import { TopMenu } from "./TopMenu";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useActiveFile } from "@/hooks/useActiveFile";
import { LANGUAGES } from "@/lib/constants/languages";
import { setFileLanguage } from "@/services/fileOperations";

export function LanguageMenu() {
  const { file } = useActiveFile();

  return (
    <TopMenu label="Language">
      {!file && (
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Open a file to change its language
        </DropdownMenuLabel>
      )}
      {file && (
        <DropdownMenuRadioGroup
          value={file.language}
          onValueChange={(v) => setFileLanguage(file.id, v)}
        >
          <div className="max-h-80 overflow-y-auto np-scrollbar">
            {LANGUAGES.map((lang) => (
              <DropdownMenuRadioItem key={lang.id} value={lang.id}>
                {lang.label}
              </DropdownMenuRadioItem>
            ))}
          </div>
        </DropdownMenuRadioGroup>
      )}
    </TopMenu>
  );
}
