"use client";

import { TopMenu } from "./TopMenu";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import type { EncodingName } from "@/types/settings";

const ENCODINGS: EncodingName[] = ["UTF-8", "UTF-8 BOM", "UTF-16 LE", "UTF-16 BE", "ASCII", "ISO-8859-1"];

export function EncodingMenu() {
  const { file } = useActiveFile();
  const updateNode = useWorkspaceStore((s) => s.updateNode);

  return (
    <TopMenu label="Encoding">
      {!file && (
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Open a file to change its encoding
        </DropdownMenuLabel>
      )}
      {file && (
        <DropdownMenuRadioGroup
          value={file.encoding}
          onValueChange={(v) => updateNode(file.id, { encoding: v })}
        >
          {ENCODINGS.map((enc) => (
            <DropdownMenuRadioItem key={enc} value={enc}>
              {enc}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      )}
    </TopMenu>
  );
}
