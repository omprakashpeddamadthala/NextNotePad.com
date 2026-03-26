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
                <div style={{ fontSize: 28, fontWeight: 300, marginBottom: 8, whiteSpace: 'nowrap' }}>
                    No file is open
                </div>
                <div style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
                    Ctrl+N to create a new file, or click the Document List
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
