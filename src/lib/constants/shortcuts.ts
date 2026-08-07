export type ActionId =
  | "file.new"
  | "file.newFolder"
  | "file.open"
  | "file.save"
  | "file.saveAs"
  | "file.closeTab"
  | "file.closeAllTabs"
  | "edit.undo"
  | "edit.redo"
  | "edit.deleteLine"
  | "edit.duplicateLine"
  | "edit.selectAll"
  | "edit.formatDocument"
  | "search.find"
  | "search.replace"
  | "search.goToLine"
  | "search.findInFiles"
  | "search.quickOpen"
  | "view.commandPalette"
  | "view.toggleWordWrap"
  | "view.toggleMinimap"
  | "view.toggleSidebar"
  | "view.zoomIn"
  | "view.zoomOut"
  | "view.resetZoom"
  | "tabs.next"
  | "tabs.previous"
  | "tabs.reopenClosed";

export interface ShortcutDef {
  action: ActionId;
  label: string;
  /** Human-readable combo, e.g. "Ctrl+Shift+S". Matched case-insensitively against key names. */
  keys: string;
  category: "File" | "Edit" | "Search" | "View" | "Window";
}

/** The Notepad++ shortcut set from the spec, mapped to app actions. */
export const SHORTCUTS: ShortcutDef[] = [
  { action: "file.new", label: "New File", keys: "Ctrl+N", category: "File" },
  { action: "file.newFolder", label: "New Folder", keys: "Ctrl+Shift+N", category: "File" },
  { action: "file.open", label: "Open / Import", keys: "Ctrl+O", category: "File" },
  { action: "file.save", label: "Save", keys: "Ctrl+S", category: "File" },
  { action: "file.saveAs", label: "Save As", keys: "Ctrl+Shift+S", category: "File" },
  { action: "file.closeTab", label: "Close Tab", keys: "Ctrl+W", category: "File" },
  { action: "file.closeAllTabs", label: "Close All Tabs", keys: "Ctrl+Shift+W", category: "File" },
  { action: "edit.undo", label: "Undo", keys: "Ctrl+Z", category: "Edit" },
  { action: "edit.redo", label: "Redo", keys: "Ctrl+Y", category: "Edit" },
  { action: "edit.deleteLine", label: "Delete Line", keys: "Ctrl+L", category: "Edit" },
  { action: "edit.duplicateLine", label: "Duplicate Line", keys: "Ctrl+D", category: "Edit" },
  { action: "edit.selectAll", label: "Select All", keys: "Ctrl+A", category: "Edit" },
  { action: "edit.formatDocument", label: "Format Document / Selection", keys: "Shift+Alt+F", category: "Edit" },
  { action: "search.find", label: "Find", keys: "Ctrl+F", category: "Search" },
  { action: "search.replace", label: "Replace", keys: "Ctrl+H", category: "Search" },
  { action: "search.goToLine", label: "Go To Line", keys: "Ctrl+G", category: "Search" },
  { action: "search.findInFiles", label: "Find in Files", keys: "Ctrl+Shift+F", category: "Search" },
  { action: "search.quickOpen", label: "Quick Open", keys: "Ctrl+P", category: "Search" },
  { action: "view.commandPalette", label: "Command Palette", keys: "Ctrl+Shift+P", category: "View" },
  { action: "view.toggleWordWrap", label: "Toggle Word Wrap", keys: "Alt+Z", category: "View" },
  { action: "view.toggleMinimap", label: "Toggle Minimap", keys: "Alt+M", category: "View" },
  { action: "view.toggleSidebar", label: "Toggle Sidebar", keys: "Ctrl+B", category: "View" },
  { action: "view.zoomIn", label: "Zoom In", keys: "Ctrl+=", category: "View" },
  { action: "view.zoomOut", label: "Zoom Out", keys: "Ctrl+-", category: "View" },
  { action: "view.resetZoom", label: "Reset Zoom", keys: "Ctrl+0", category: "View" },
  { action: "tabs.next", label: "Next Tab", keys: "Ctrl+Tab", category: "Window" },
  { action: "tabs.previous", label: "Previous Tab", keys: "Ctrl+Shift+Tab", category: "Window" },
  { action: "tabs.reopenClosed", label: "Reopen Closed Tab", keys: "Ctrl+Shift+T", category: "Window" },
];

export const SHORTCUT_BY_ACTION: Record<ActionId, ShortcutDef> = SHORTCUTS.reduce(
  (acc, s) => {
    acc[s.action] = s;
    return acc;
  },
  {} as Record<ActionId, ShortcutDef>,
);
