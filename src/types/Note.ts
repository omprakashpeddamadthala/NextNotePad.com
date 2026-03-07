export interface Note {
    id: string;
    name: string;
    content: string;
    language: string;
    lastModified: number;
    driveFileId?: string;
}

export interface AppSettings {
    theme: 'light' | 'dark';
    openTabIds: string[];
    activeTabId: string | null;
    sidebarOpen: boolean;
    wordWrap: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    openTabIds: [],
    activeTabId: null,
    sidebarOpen: true,
    wordWrap: true,
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
