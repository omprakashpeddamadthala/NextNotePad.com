import { useAuthStore } from "@/store/authStore";
import * as localRepo from "./workspaceRepository";
import * as cloudRepo from "./cloudWorkspaceRepository";

export function isCloudMode(): boolean {
  return useAuthStore.getState().status === "authenticated";
}

export function getActiveRepository() {
  return isCloudMode() ? cloudRepo : localRepo;
}
