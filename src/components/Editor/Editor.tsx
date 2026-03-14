import React, { useCallback, useRef } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import type { Note } from '../../types/Note';
import type * as monaco from 'monaco-editor';
import { getPalette } from '../../theme/colors';

const FeatureCard: React.FC<{ theme: 'light' | 'dark'; icon: string; title: string; children: React.ReactNode }> = ({
    theme, icon, title, children,
}) => {
    const p = getPalette(theme);
    return (
        <div style={{
            background: p.panelAlt,
            border: `1px solid ${p.border}`,
            borderRadius: 6,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
        }}>
            <div style={{
                fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                color: p.text,
            }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                {title}
            </div>
            <div style={{
                fontSize: 12, lineHeight: 1.5,
                color: p.textDim,
            }}>
                {children}
            </div>
        </div>
    );
};

interface EditorProps {
    note: Note | null;
    theme: 'light' | 'dark';
    wordWrap: boolean;
    fontSize: number;
    showAllChars: boolean;
    showMinimap?: boolean;
    onChange: (id: string, content: string) => void;
    onCursorChange: (line: number, col: number, selChars: number, selLines: number) => void;
    editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}

const EditorComponent: React.FC<EditorProps> = ({
    note, theme, wordWrap, fontSize, showAllChars, showMinimap = false, onChange, onCursorChange, editorRef,
}) => {
    const monaco = useMonaco();
    const p = getPalette(theme);
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
                    background: p.bg,
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    overflowY: 'auto',
                    padding: '40px 20px',
                }}
            >
                <div style={{
                    fontSize: 32, fontWeight: 300, marginBottom: 4,
                    color: p.text,
                }}>
                    NextNotePad.com
                </div>
                <div style={{
                    fontSize: 13, color: p.textMute,
                    marginBottom: 32,
                }}>
                    Write. Code. Create — Anywhere.
                </div>

                {/* Features grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16, width: '100%', maxWidth: 1000, marginBottom: 60,
                    textAlign: 'left',
                }}>
                    <FeatureCard theme={theme} icon="✏️" title="Code Editor">
                        Powered by Monaco Editor (the same engine as VS Code). Includes syntax highlighting for 50+ languages, auto-completion, and multiple cursors.
                    </FeatureCard>

                    <FeatureCard theme={theme} icon="📁" title="File Management">
                        Work with multiple files at once. Files are auto-saved locally in your browser's storage, ensuring you never lose your work.
                    </FeatureCard>

                    <FeatureCard theme={theme} icon="☁️" title="Cloud Sync">
                        Sign in with Google to seamlessly sync your files to Google Drive. Keep your workspaces synchronized across all your devices.
                    </FeatureCard>

                    <FeatureCard theme={theme} icon="🎨" title="Customization">
                        Toggle between Light and Dark mode. Customize word wrap, indent settings, and more to perfectly suit your coding style.
                    </FeatureCard>
                </div>

                {/* Quick start footer */}
                <div style={{
                    display: 'flex', gap: 16, alignItems: 'center',
                    fontSize: 13, color: p.textMute,
                }}>
                    <span><strong>Ctrl+N</strong> New File</span>
                    <span><strong>Ctrl+O</strong> Open File</span>
                    <span><strong>Ctrl+S</strong> Save File</span>
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
                beforeMount={(monaco) => {
                    // Define light mode custom theme
                    monaco.editor.defineTheme('npp-light', {
                        base: 'vs',
                        inherit: true,
                        rules: [],
                        colors: {
                            'editor.background': p.bg,
                            'editor.foreground': p.text,
                            'editor.lineHighlightBackground': p.lineHighlightBackground,
                            'editorLineNumber.foreground': p.lineNumberForeground,
                            'editorIndentGuide.background': p.indentGuideBackground,
                            'editorGutter.background': p.bg,
                        }
                    });
                }}
                theme={theme === 'dark' ? 'vs-dark' : 'npp-light'}
                onChange={handleChange}
                onMount={handleEditorDidMount}
                loading={
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: p.textMute,
                    }}>
                        Loading editor...
                    </div>
                }
                options={{
                    fontSize,
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    lineNumbers: 'on',
                    minimap: { enabled: showMinimap },
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
