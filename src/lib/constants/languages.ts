export interface LanguageDef {
  id: string;
  label: string;
  extensions: string[];
}

/**
 * Monaco's bundled `basic-languages` set already covers nearly everything
 * in the spec. Extensions map to Monaco language ids; anything unmapped
 * falls back to "plaintext".
 */
export const LANGUAGES: LanguageDef[] = [
  { id: "plaintext", label: "Plain Text", extensions: ["txt", "log"] },
  { id: "java", label: "Java", extensions: ["java"] },
  { id: "javascript", label: "JavaScript", extensions: ["js", "mjs", "cjs", "jsx"] },
  { id: "typescript", label: "TypeScript", extensions: ["ts", "mts", "cts", "tsx"] },
  { id: "python", label: "Python", extensions: ["py", "pyw"] },
  { id: "go", label: "Go", extensions: ["go"] },
  { id: "rust", label: "Rust", extensions: ["rs"] },
  { id: "c", label: "C", extensions: ["c", "h"] },
  { id: "cpp", label: "C++", extensions: ["cpp", "cc", "cxx", "hpp", "hh"] },
  { id: "csharp", label: "C#", extensions: ["cs"] },
  { id: "php", label: "PHP", extensions: ["php"] },
  { id: "ruby", label: "Ruby", extensions: ["rb"] },
  { id: "swift", label: "Swift", extensions: ["swift"] },
  { id: "kotlin", label: "Kotlin", extensions: ["kt", "kts"] },
  { id: "json", label: "JSON", extensions: ["json", "jsonc"] },
  { id: "xml", label: "XML", extensions: ["xml"] },
  { id: "yaml", label: "YAML", extensions: ["yaml", "yml"] },
  { id: "sql", label: "SQL", extensions: ["sql"] },
  { id: "html", label: "HTML", extensions: ["html", "htm"] },
  { id: "css", label: "CSS", extensions: ["css"] },
  { id: "scss", label: "SCSS", extensions: ["scss"] },
  { id: "markdown", label: "Markdown", extensions: ["md", "markdown"] },
  { id: "dockerfile", label: "Dockerfile", extensions: ["dockerfile"] },
  { id: "shell", label: "Shell", extensions: ["sh", "bash", "zsh"] },
  { id: "powershell", label: "PowerShell", extensions: ["ps1", "psm1"] },
  { id: "ini", label: "Properties", extensions: ["ini", "properties", "cfg"] },
  { id: "hcl", label: "Terraform", extensions: ["tf", "tfvars", "hcl"] },
  { id: "graphql", label: "GraphQL", extensions: ["graphql", "gql"] },
  { id: "vue", label: "Vue", extensions: ["vue"] },
  { id: "razor", label: "Razor", extensions: ["razor", "cshtml"] },
];

const EXTENSION_TO_LANGUAGE: Record<string, string> = LANGUAGES.reduce(
  (acc, lang) => {
    for (const ext of lang.extensions) acc[ext] = lang.id;
    return acc;
  },
  {} as Record<string, string>,
);

/** Filenames without a "normal" extension that still map to a language. */
const FILENAME_TO_LANGUAGE: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "shell",
  "build.gradle": "ini",
  "pom.xml": "xml",
};

export function detectLanguageFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (FILENAME_TO_LANGUAGE[lower]) return FILENAME_TO_LANGUAGE[lower];
  const dotIndex = lower.lastIndexOf(".");
  if (dotIndex === -1) return "plaintext";
  const ext = lower.slice(dotIndex + 1);
  return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
}
