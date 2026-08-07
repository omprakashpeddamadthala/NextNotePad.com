import { create } from "zustand";

interface PendingGoto {
  fileId: string;
  line: number;
  column: number;
}

interface PendingGotoState {
  pending: PendingGoto | null;
  requestGoto: (fileId: string, line: number, column?: number) => void;
  clear: () => void;
}

export const usePendingGotoStore = create<PendingGotoState>()((set) => ({
  pending: null,
  requestGoto: (fileId, line, column = 1) => set({ pending: { fileId, line, column } }),
  clear: () => set({ pending: null }),
}));
