import React, { useCallback, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { Note } from '../../types/Note';
import type * as monaco from 'monaco-editor';

const FeatureCard: React.FC<{ isDark: boolean; icon: string; title: string; children: React.ReactNode }> = ({
    isDark, icon, title, children,
}) => (
    <div style={{
        background: isDark ? '#252526' : '#f8f8f8',
        border: `1px solid ${isDark ? '#3c3c3c' : '#e0e0e0'}`,
        borderRadius: 6,
        padding: '16px 18px',
    }}>
        <div style={{
            fontSize: 15, fontWeight: 600, marginBottom: 10,
            color: isDark ? '#e0e0e0' : '#333',
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            <span>{icon}</span> {title}
        </div>
        <ul style={{
            margin: 0, paddingLeft: 18,
            fontSize: 12, lineHeight: 1.8,
            color: isDark ? '#aaa' : '#666',
            listStyleType: '•',
        }}>
            {children}
        </ul>
    </div>
);

interface EditorProps {
    note: Note | null;
    theme: 'light' | 'dark';
    wordWrap: boolean;
    fontSize: number;
    showAllChars: boolean;
    onChange: (id: string, content: string) => void;
    onCursorChange: (line: number, col: number, selChars: number, selLines: number) => void;
    editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}

const EditorComponent: React.FC<EditorProps> = ({
    note, theme, wordWrap, fontSize, showAllChars, onChange, onCursorChange, editorRef,
}) => {
    const isDark = theme === 'dark';
    const monacoRef = useRef<typeof monaco | null>(null);

    const handleChange = useCallback(
        (value: string | undefined) => {
            if (note && value !== undefined) {
                onChange(note.id, value);
            }
        },
        [note, onChange]
    );

    const handleEditorDidMount = useCallback(
        (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
            editorRef.current = editor;
            monacoRef.current = monacoInstance;

            editor.onDidChangeCursorPosition(() => {
                const pos = editor.getPosition();
                const sel = editor.getSelection();
                if (pos) {
                    let selChars = 0;
                    let selLines = 0;
                    if (sel && !sel.isEmpty()) {
                        const model = editor.getModel();
                        if (model) {
                            selChars = model.getValueInRange(sel).length;
                            selLines = sel.endLineNumber - sel.startLineNumber + 1;
                        }
                    }
                    onCursorChange(pos.lineNumber, pos.column, selChars, selLines);
                }
            });

            editor.onDidChangeCursorSelection(() => {
                const pos = editor.getPosition();
                const sel = editor.getSelection();
                if (pos) {
                    let selChars = 0;
                    let selLines = 0;
                    if (sel && !sel.isEmpty()) {
                        const model = editor.getModel();
                        if (model) {
                            selChars = model.getValueInRange(sel).length;
                            selLines = sel.endLineNumber - sel.startLineNumber + 1;
                        }
                    }
                    onCursorChange(pos.lineNumber, pos.column, selChars, selLines);
                }
            });
        },
        [editorRef, onCursorChange]
    );

    if (!note) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? '#1e1e1e' : '#ffffff',
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    overflowY: 'auto',
                    padding: '40px 20px',
                }}
            >
                <div style={{
                    fontSize: 32, fontWeight: 300, marginBottom: 4,
                    color: isDark ? '#d4d4d4' : '#333',
                }}>
                    NextNotePad.com
                </div>
                <div style={{
                    fontSize: 13, color: isDark ? '#888' : '#888',
                    marginBottom: 32,
                }}>
                    Write. Code. Create — Anywhere.
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                    maxWidth: 800,
                    width: '100%',
                }}>
                    {/* Editor Features */}
                    <FeatureCard isDark={isDark} icon="✏️" title="Code Editor">
                        <li>Syntax highlighting for 50+ languages</li>
                        <li>Line numbers &amp; code folding</li>
                        <li>Bracket matching &amp; auto-indent</li>
                        <li>Find &amp; Replace (Ctrl+F / Ctrl+H)</li>
                        <li>Go to Line (Ctrl+G)</li>
                        <li>Word wrap toggle</li>
                        <li>Show all characters (whitespace)</li>
                        <li>Zoom in/out (Ctrl+Plus/Minus)</li>
                    </FeatureCard>

                    {/* File Management */}
                    <FeatureCard isDark={isDark} icon="📁" title="File Management">
                        <li>Create, rename &amp; delete files</li>
                        <li>Open files from your computer</li>
                        <li>Multi-tab editing with drag reorder</li>
                        <li>File explorer sidebar with search</li>
                        <li>Right-click context menus</li>
                        <li>Auto-save to browser storage</li>
                        <li>Files persist across sessions</li>
                    </FeatureCard>

                    {/* Cloud & Sync */}
                    <FeatureCard isDark={isDark} icon="☁️" title="Cloud Sync">
                        <li>Google Sign-In authentication</li>
                        <li>Sync files to Google Drive</li>
                        <li>Backup &amp; restore from cloud</li>
                        <li>Access your files anywhere</li>
                    </FeatureCard>

                    {/* Customization */}
                    <FeatureCard isDark={isDark} icon="🎨" title="Customization">
                        <li>Dark &amp; Light themes</li>
                        <li>Multiple encoding support (UTF-8, ANSI...)</li>
                        <li>Line ending options (CR LF, LF, CR)</li>
                        <li>Language selection for any file</li>
                        <li>Toggle sidebar visibility</li>
                        <li>Adjustable font size</li>
                    </FeatureCard>
                </div>

                <div style={{
                    marginTop: 32, fontSize: 12,
                    color: isDark ? '#555' : '#bbb',
                    textAlign: 'center',
                }}>
                    Click <strong>+</strong> in the sidebar or press <strong>Ctrl+N</strong> to get started
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonacoEditor
                key={note.id}
                height="100%"
                language={note.language}
                value={note.content}
                theme={isDark ? 'vs-dark' : 'vs'}
                onChange={handleChange}
                onMount={handleEditorDidMount}
                loading={
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: isDark ? '#888' : '#666',
                    }}>
                        Loading editor...
                    </div>
                }
                options={{
                    fontSize,
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    wordWrap: wordWrap ? 'on' : 'off',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    renderWhitespace: showAllChars ? 'all' : 'none',
                    renderControlCharacters: showAllChars,
                    bracketPairColorization: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: 'blink',
                    padding: { top: 0 },
                    lineNumbersMinChars: 4,
                    glyphMargin: false,
                    folding: true,
                    matchBrackets: 'always',
                    suggest: { showWords: true },
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    scrollbar: {
                        verticalScrollbarSize: 14,
                        horizontalScrollbarSize: 14,
                    },
                }}
            />
        </div>
    );
};

export default React.memo(EditorComponent);
