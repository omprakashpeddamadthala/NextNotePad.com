export function joinPath(parentPath: string, name: string): string {
  if (parentPath === "" || parentPath === "/") return `/${name}`;
  return `${parentPath}/${name}`;
}

const INVALID_NAME_CHARS = /[/\\:*?"<>|]/;

export function isValidNodeName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return false;
  if (trimmed === "." || trimmed === "..") return false;
  return !INVALID_NAME_CHARS.test(trimmed);
}
