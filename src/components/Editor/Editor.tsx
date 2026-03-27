import React, { useCallback, useRef } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import type { Note } from '../../types/Note';
import type * as monaco from 'monaco-editor';
import { getPalette } from '../../theme/colors';



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
                    color: '#c0c0c0',
                }}
            >
                <div style={{ fontSize: 28, fontWeight: 300, marginBottom: 8, color: p.text }}>
                    NextNotePad.com
                </div>
                <div style={{ fontSize: 14, color: p.textDim, marginBottom: 32 }}>
                    A modern, cloud-synced code and text editor
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(260px, 1fr)', gap: 24, maxWidth: 640 }}>
                    <div style={{ background: p.panel, padding: 20, borderRadius: 8, border: `1px solid ${p.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: p.accent, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Core Features</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: p.textMute, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <li><span style={{color: p.text, fontWeight: 500}}>Cloud Sync:</span> Google Drive auto-save</li>
                            <li><span style={{color: p.text, fontWeight: 500}}>Workspaces:</span> Organize files visually</li>
                            <li><span style={{color: p.text, fontWeight: 500}}>Smart Formatter:</span> JSON, XML, CSS, SQL</li>
                            <li><span style={{color: p.text, fontWeight: 500}}>Text Tools:</span> Sort lines, dedup, change case</li>
                            <li><span style={{color: p.text, fontWeight: 500}}>Diff Viewer:</span> Side-by-side comparison</li>
                        </ul>
                    </div>

                    <div style={{ background: p.panel, padding: 20, borderRadius: 8, border: `1px solid ${p.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: p.accent, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Keyboard Shortcuts</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: p.textMute }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>New File</span> <kbd style={{ background: p.active, padding: '2px 6px', borderRadius: 4, color: p.text, border: `1px solid ${p.border}`, fontFamily: 'monospace' }}>Ctrl+N</kbd></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Open File</span> <kbd style={{ background: p.active, padding: '2px 6px', borderRadius: 4, color: p.text, border: `1px solid ${p.border}`, fontFamily: 'monospace' }}>Ctrl+O</kbd></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Save File</span> <kbd style={{ background: p.active, padding: '2px 6px', borderRadius: 4, color: p.text, border: `1px solid ${p.border}`, fontFamily: 'monospace' }}>Ctrl+S</kbd></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Find / Replace</span> <kbd style={{ background: p.active, padding: '2px 6px', borderRadius: 4, color: p.text, border: `1px solid ${p.border}`, fontFamily: 'monospace' }}>Ctrl+F / H</kbd></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Command Palette</span> <kbd style={{ background: p.active, padding: '2px 6px', borderRadius: 4, color: p.text, border: `1px solid ${p.border}`, fontFamily: 'monospace' }}>F1</kbd></div>
                        </div>
                    </div>
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
