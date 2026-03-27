import { useCallback } from 'react';
import type * as monaco from 'monaco-editor';
import type { Note } from '../types/Note';

interface UseEditorFormattingProps {
    editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
    activeNote: Note | null | undefined;
    handleUpdateContent: (id: string, content: string) => void;
    showSnackbar: (msg: string, sev: 'success' | 'error' | 'info') => void;
}

export function useEditorFormatting({
    editorRef,
    activeNote,
    handleUpdateContent,
    showSnackbar,
}: UseEditorFormattingProps) {

    const handleSortLines = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const selection = editor.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        const text = hasSelection ? model.getValueInRange(selection) : model.getValue();
        const sorted = text.split('\n').sort().join('\n');

        const range = hasSelection ? selection : model.getFullModelRange();
        editor.executeEdits('sort', [{ range, text: sorted }]);
        if (!hasSelection) handleUpdateContent(activeNote.id, sorted);
        showSnackbar('Lines sorted', 'success');
    }, [activeNote, handleUpdateContent, editorRef, showSnackbar]);

    const handleRemoveDuplicateLines = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const text = model.getValue();
        const unique = [...new Set(text.split('\n'))].join('\n');
        const range = model.getFullModelRange();
        editor.executeEdits('dedup', [{ range, text: unique }]);
        handleUpdateContent(activeNote.id, unique);
        showSnackbar('Duplicate lines removed', 'success');
    }, [activeNote, handleUpdateContent, editorRef, showSnackbar]);

    const handleTrimWhitespace = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const text = model.getValue();
        const trimmed = text.split('\n').map(line => line.trimEnd()).join('\n');
        const range = model.getFullModelRange();
        editor.executeEdits('trim', [{ range, text: trimmed }]);
        handleUpdateContent(activeNote.id, trimmed);
        showSnackbar('Trailing whitespace removed', 'success');
    }, [activeNote, handleUpdateContent, editorRef, showSnackbar]);

    const handleUpperCase = useCallback(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection || selection.isEmpty()) {
            showSnackbar('Select text first', 'info');
            return;
        }
        const text = model.getValueInRange(selection);
        editor.executeEdits('upper', [{ range: selection, text: text.toUpperCase() }]);
        showSnackbar('Converted to UPPERCASE', 'success');
    }, [editorRef, showSnackbar]);

    const handleLowerCase = useCallback(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection || selection.isEmpty()) {
            showSnackbar('Select text first', 'info');
            return;
        }
        const text = model.getValueInRange(selection);
        editor.executeEdits('lower', [{ range: selection, text: text.toLowerCase() }]);
        showSnackbar('Converted to lowercase', 'success');
    }, [editorRef, showSnackbar]);

    const handleFormatText = useCallback(() => {
        if (!editorRef.current) {
            showSnackbar('No editor available', 'info');
            return;
        }
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const selection = editor.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        const textToFormat = hasSelection ? model.getValueInRange(selection) : model.getValue();

        if (!textToFormat.trim()) {
            showSnackbar('Nothing to format', 'info');
            return;
        }

        const detectType = (text: string): string => {
            const trimmed = text.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try { JSON.parse(trimmed); return 'json'; } catch { /* not json */ }
            }
            if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml';
            if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(trimmed)) return 'sql';
            if (/\{[^}]*;[^}]*\}/.test(trimmed)) return 'css';
            return 'unknown';
        };

        const detectedType = detectType(textToFormat);
        let formatted = textToFormat;

        try {
            if (detectedType === 'json') {
                formatted = JSON.stringify(JSON.parse(textToFormat.trim()), null, 2);
            } else if (detectedType === 'xml') {
                let indent = 0;
                const lines: string[] = [];
                const tags = textToFormat.replace(/>\s*</g, '>\n<').split('\n');
                for (const rawTag of tags) {
                    const tag = rawTag.trim();
                    if (!tag) continue;
                    if (tag.startsWith('</')) {
                        indent = Math.max(0, indent - 1);
                        lines.push('  '.repeat(indent) + tag);
                    } else if (tag.startsWith('<') && !tag.startsWith('<!') && !tag.endsWith('/>') && tag.endsWith('>') && !tag.includes('</')) {
                        lines.push('  '.repeat(indent) + tag);
                        indent++;
                    } else {
                        lines.push('  '.repeat(indent) + tag);
                    }
                }
                formatted = lines.join('\n');
            } else if (detectedType === 'css') {
                formatted = textToFormat
                    .replace(/\s*\{\s*/g, ' {\n  ')
                    .replace(/\s*\}\s*/g, '\n}\n')
                    .replace(/;\s*/g, ';\n  ')
                    .replace(/\n\s*\n/g, '\n')
                    .replace(/ {2}\}/g, '}')
                    .trim();
            } else if (detectedType === 'sql') {
                const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'AS', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'UNION', 'ALL', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
                formatted = textToFormat;
                for (const kw of keywords) {
                    formatted = formatted.replace(new RegExp('\\b' + kw + '\\b', 'gi'), kw);
                }
                formatted = formatted
                    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE|CREATE TABLE|DROP|ALTER|UNION)\b/g, '\n$1')
                    .replace(/^\n/, '')
                    .trim();
            } else {
                if (hasSelection) {
                    editor.trigger('format', 'editor.action.formatSelection', null);
                } else {
                    editor.trigger('format', 'editor.action.formatDocument', null);
                }
                showSnackbar('Formatted with editor', 'success');
                return;
            }

            if (formatted !== textToFormat) {
                const range = hasSelection ? selection : model.getFullModelRange();
                editor.executeEdits('format', [{
                    range: range,
                    text: formatted,
                }]);
                if (!hasSelection && activeNote) {
                    handleUpdateContent(activeNote.id, formatted);
                }
                const typeLabels: Record<string, string> = {
                    json: 'JSON', xml: 'XML/HTML', css: 'CSS', sql: 'SQL',
                };
                showSnackbar(`Formatted as ${typeLabels[detectedType]}${hasSelection ? ' (selection)' : ''}`, 'success');
            } else {
                showSnackbar('Already formatted', 'info');
            }
        } catch (err) {
            showSnackbar(`Format error: ${(err as Error).message}`, 'error');
        }
    }, [activeNote, handleUpdateContent, editorRef, showSnackbar]);

    return {
        handleSortLines,
        handleRemoveDuplicateLines,
        handleTrimWhitespace,
        handleUpperCase,
        handleLowerCase,
        handleFormatText,
    };
}
