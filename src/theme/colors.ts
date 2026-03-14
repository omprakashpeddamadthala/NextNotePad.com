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
    // Editor specific
    lineHighlightBackground: string;
    lineNumberForeground: string;
    indentGuideBackground: string;
}

export const darkPalette: ThemePalette = {
    bg:             '#1e1e1e', // Npp Editor Background dark
    panel:          '#202020', // Npp toolbar/sidebar dark
    panelAlt:       '#333333', // Npp Menu bar dark
    hover:          '#555555',
    active:         '#404040', // Selected item

    border:         '#555555',
    borderFocus:    '#ff9900', // Npp often uses orange for active tab top border

    text:           '#e0e0e0',
    textDim:        '#a0a0a0',
    textMute:       '#808080',

    accent:         '#ff9900', // Orange accent
    accentHover:    '#e68a00',

    success:        '#89d185',
    warning:        '#cca700',
    danger:         '#f48771',

    tabActiveBorder:'#ff9900',
    scrollbar:      '#424242',

    lineHighlightBackground: '#333333',
    lineNumberForeground: '#858585',
    indentGuideBackground: '#404040',
};

export const lightPalette: ThemePalette = {
    bg:             '#ffffff', // Editor Background
    panel:          '#f0f0f0', // Npp toolbar/sidebar standard Windows grey
    panelAlt:       '#f5f5f5', // Menu bar
    hover:          '#e5f1fb', // Windows 10 standard hover light blue
    active:         '#cce8ff', // Windows 10 standard selected light blue

    border:         '#d3d3d3',
    borderFocus:    '#ff9900',

    text:           '#000000',
    textDim:        '#444444',
    textMute:       '#888888',

    accent:         '#ff9900',
    accentHover:    '#e68a00',

    success:        '#16803c',
    warning:        '#b45309',
    danger:         '#b91c1c',

    tabActiveBorder:'#ff9900',
    scrollbar:      '#f0f0f0',

    lineHighlightBackground: '#e8e8e8',
    lineNumberForeground: '#2b91af',
    indentGuideBackground: '#d3d3d3',
};

export function getPalette(theme: 'light' | 'dark'): ThemePalette {
    return theme === 'dark' ? darkPalette : lightPalette;
}
