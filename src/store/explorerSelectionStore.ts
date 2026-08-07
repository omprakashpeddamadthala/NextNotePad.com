import { create } from "zustand";

interface ExplorerSelectionState {
  selectedNodeId: string | null;
  renamingNodeId: string | null;
  draggedNodeId: string | null;
  dropTargetId: string | null | "root";
  setSelectedNodeId: (id: string | null) => void;
  setRenamingNodeId: (id: string | null) => void;
  setDraggedNodeId: (id: string | null) => void;
  setDropTargetId: (id: string | null | "root") => void;
}

export const useExplorerSelectionStore = create<ExplorerSelectionState>()((set) => ({
  selectedNodeId: null,
  renamingNodeId: null,
  draggedNodeId: null,
  dropTargetId: null,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setRenamingNodeId: (renamingNodeId) => set({ renamingNodeId }),
  setDraggedNodeId: (draggedNodeId) => set({ draggedNodeId }),
  setDropTargetId: (dropTargetId) => set({ dropTargetId }),
}));
