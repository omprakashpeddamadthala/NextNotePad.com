/**
 * Application color palette
 * Dark:  Tokyo Night — warm dark blue, easy on the eyes, attractive
 * Light: Warm parchment — soft off-white, never harsh pure white
 */

export interface ThemePalette {
    // Backgrounds
    bg: string;          // main editor / page background
    panel: string;       // sidebar, toolbar, dialog panels
    panelAlt: string;    // slightly raised panels (tab bar, menu bar)
    hover: string;       // hover state background
    active: string;      // active/selected item background

    // Borders
    border: string;
    borderFocus: string;

    // Text
    text: string;        // primary text
    textDim: string;     // secondary / muted
    textMute: string;    // very muted (line numbers, captions)

    // Accent
    accent: string;      // primary brand accent (blue)
    accentHover: string; // hovered accent

    // Semantic
    success: string;
    warning: string;
    danger: string;

    // Misc
    tabActiveBorder: string;
    scrollbar: string;
}

export const darkPalette: ThemePalette = {
    bg:             '#1a1b26',
    panel:          '#16161e',
    panelAlt:       '#13131a',
    hover:          '#252638',
    active:         '#2d2f45',

    border:         '#2e3147',
    borderFocus:    '#7aa2f7',

    text:           '#c0caf5',
    textDim:        '#6b7db3',
    textMute:       '#3b4261',

    accent:         '#7aa2f7',
    accentHover:    '#89b3ff',

    success:        '#9ece6a',
    warning:        '#e0af68',
    danger:         '#f7768e',

    tabActiveBorder:'#7aa2f7',
    scrollbar:      '#3b4261',
};

export const lightPalette: ThemePalette = {
    bg:             '#f7f6f3',
    panel:          '#eeeae4',
    panelAlt:       '#e5e1da',
    hover:          '#ddd9d1',
    active:         '#d0c9be',

    border:         '#cbc5bb',
    borderFocus:    '#2563eb',

    text:           '#1e1c1a',
    textDim:        '#6b6560',
    textMute:       '#a09890',

    accent:         '#2563eb',
    accentHover:    '#1d4ed8',

    success:        '#16803c',
    warning:        '#b45309',
    danger:         '#b91c1c',

    tabActiveBorder:'#2563eb',
    scrollbar:      '#cbc5bb',
};

export function getPalette(theme: 'light' | 'dark'): ThemePalette {
    return theme === 'dark' ? darkPalette : lightPalette;
}
