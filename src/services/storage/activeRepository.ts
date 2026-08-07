import { useAuthStore } from "@/store/authStore";
import * as localRepo from "./workspaceRepository";
import * as cloudRepo from "./cloudWorkspaceRepository";

export function isCloudMode(): boolean {
  return useAuthStore.getState().status === "authenticated";
}

/** Content-persistence functions shared by both repositories — same shape, different backend. */
export function getActiveRepository() {
  return isCloudMode() ? cloudRepo : localRepo;
}
