import {
  FileCode2,
  FileJson2,
  FileText,
  FileType2,
  Braces,
  Palette,
  Terminal,
  Database,
  Globe,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { detectLanguageFromFilename } from "@/lib/constants/languages";

const LANGUAGE_ICON: Record<string, LucideIcon> = {
  json: FileJson2,
  xml: FileType2,
  yaml: Braces,
  html: Globe,
  css: Palette,
  scss: Palette,
  sql: Database,
  shell: Terminal,
  powershell: Terminal,
  markdown: Hash,
  plaintext: FileText,
};

export function getFileIcon(filename: string): LucideIcon {
  const language = detectLanguageFromFilename(filename);
  return LANGUAGE_ICON[language] ?? FileCode2;
}
