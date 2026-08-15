/**
 * Shared metadata shape. `lastSynced`, `version`, `checksum` are unused in
 * guest mode (Phase 1) but typed now so Phase 2 (Drive sync) doesn't need a
 * data migration.
 */
interface BaseNode {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  lastSynced: number | null;
  version: number;
  checksum: string | null;
  deleted: boolean;
  hidden: boolean;
}

export interface FileNode extends BaseNode {
  type: "file";
  language: string;
  encoding: string;
  size: number;
  pinnedFavorite: boolean;
  /** Lock feature — see prisma/schema.prisma's File model comment. Salt/iv are only meaningful
   *  (non-null) while `locked` is true; the passphrase itself is never stored. */
  locked: boolean;
  encryptionSalt: string | null;
  encryptionIv: string | null;
}

export interface FolderNode extends BaseNode {
  type: "folder";
  collapsed: boolean;
}

export type WorkspaceNode = FileNode | FolderNode;

interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorViewState {
  cursor: CursorPosition;
  scrollTop: number;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface Tab {
  id: string;
  fileId: string;
  pinned: boolean;
  readOnly: boolean;
  viewState: EditorViewState | null;
}

export interface RecentEntry {
  fileId: string;
  openedAt: number;
}

export interface TrashEntry {
  node: WorkspaceNode;
  deletedAt: number;
  /** Serialized subtree so folders can be restored with their children intact. */
  descendants: WorkspaceNode[];
}

export interface SearchHistoryEntry {
  query: string;
  isRegex: boolean;
  wholeWord: boolean;
  caseSensitive: boolean;
  timestamp: number;
}
