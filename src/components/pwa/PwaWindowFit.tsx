"use client";

import { useEffect } from "react";

const FITTED_KEY = "nnp.pwaWindowFitted";

/**
 * When running as the installed desktop app, open the window filling the screen.
 * screen.avail* excludes the OS taskbar, so the taskbar stays visible.
 * Runs once per launch so a later manual resize survives page reloads.
 */
export function PwaWindowFit() {
  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    const desktop = window.matchMedia("(pointer: fine)").matches;
    if (!installed || !desktop) return;
    if (sessionStorage.getItem(FITTED_KEY)) return;
    sessionStorage.setItem(FITTED_KEY, "1");

    const { availWidth, availHeight } = window.screen;
    const { availLeft = 0, availTop = 0 } = window.screen as Screen & {
      availLeft?: number;
      availTop?: number;
    };
    window.moveTo(availLeft, availTop);
    window.resizeTo(availWidth, availHeight);
  }, []);

  return null;
}
