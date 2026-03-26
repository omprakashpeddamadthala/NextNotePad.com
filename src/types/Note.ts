export interface Workspace {
    id: string;
    name: string;
    driveId?: string; // Drive subfolder ID
}

export interface Note {
    id: string;
    name: string;
    content: string;
    language: string;
    lastModified: number;
    driveFileId?: string;
    workspaceId: string; // which workspace this file belongs to
}

export interface AppSettings {
    theme: 'light' | 'dark';
    openTabIds: string[];
    activeTabId: string | null;
    sidebarOpen: boolean;
    wordWrap: boolean;
    activeWorkspaceId: string | null;
    fontSize: number;
    showMinimap: boolean;
    encoding: string;
    language: string;
}

export const DEFAULT_WORKSPACE_ID = 'default';
export const DEFAULT_FONT_SIZE = 14;

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    openTabIds: [],
    activeTabId: null,
    sidebarOpen: true,
    wordWrap: true,
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    fontSize: DEFAULT_FONT_SIZE,
    showMinimap: false,
    encoding: 'UTF-8',
    language: 'plaintext',
};


export const LANGUAGE_MAP: Record<string, string> = {
    txt: 'plaintext',
    md: 'markdown',
    json: 'json',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    htm: 'html',
    css: 'css',
    java: 'java',
    py: 'python',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
};

export function getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return LANGUAGE_MAP[ext] || 'plaintext';
}
