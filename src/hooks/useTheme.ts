import { useMemo } from 'react';
import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

export function useAppTheme(mode: 'light' | 'dark'): Theme {
    return useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'dark'
                        ? {
                            background: {
                                default: '#1e1e1e',
                                paper: '#2d2d2d',
                            },
                            primary: {
                                main: '#569cd6',
                            },
                            secondary: {
                                main: '#c586c0',
                            },
                            text: {
                                primary: '#d4d4d4',
                                secondary: '#808080',
                            },
                            divider: '#555',
                        }
                        : {
                            background: {
                                default: '#ffffff',
                                paper: '#f0f0f0',
                            },
                            primary: {
                                main: '#0078d4',
                            },
                            secondary: {
                                main: '#a626a4',
                            },
                            text: {
                                primary: '#1a1a1a',
                                secondary: '#666',
                            },
                            divider: '#bcbcbc',
                        }),
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
            }),
        [mode]
    );
}
