import { useMemo } from 'react';
import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { getPalette } from '../theme/colors';

export function useAppTheme(mode: 'light' | 'dark'): Theme {
    return useMemo(() => {
        const p = getPalette(mode);
        return createTheme({
            palette: {
                mode,
                background: {
                    default: p.bg,
                    paper: p.panel,
                },
                primary: {
                    main: p.accent,
                },
                secondary: {
                    main: p.accentHover,
                },
                text: {
                    primary: p.text,
                    secondary: p.textDim,
                },
                divider: p.border,
            },
                typography: {
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    fontSize: 13,
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                fontWeight: 400,
                                borderRadius: 2,
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                boxShadow: 'none',
                            },
                        },
                    },
                    MuiMenu: {
                        styleOverrides: {
                            paper: {
                                borderRadius: '2px !important',
                                marginTop: 0,
                            },
                        },
                    },
                    MuiMenuItem: {
                        styleOverrides: {
                            root: {
                                fontSize: '13px',
                                minHeight: 28,
                                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                            },
                        },
                    },
                    MuiDialog: {
                        styleOverrides: {
                            paper: {
                                borderRadius: 4,
                            },
                        },
                    },
                },
            });
    }, [mode]);
}
