import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { collectSubtree } from "@/lib/utils/treeUtils";
import { getActiveRepository, isCloudMode } from "@/services/storage/activeRepository";
import * as localRepo from "@/services/storage/workspaceRepository";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { encryptContent, decryptContent, IncorrectPassphraseError } from "@/services/encryption/fileEncryption";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import type { FileNode } from "@/types/file";

function closeTabAndDisposeModel(fileId: string): void {
  const tab = useTabsStore.getState().tabForFile(fileId);
  if (tab) useTabsStore.getState().closeTab(tab.id);
  modelRegistry.disposeModel(fileId);
}

/** Locks a single already-unlocked file with `passphrase`. Reads from its live Monaco model if
 *  open (so unsaved edits are included), else from storage. Returns false (no-op) if the file is
 *  already locked — callers should skip it rather than double-encrypt an already-encrypted file. */
async function lockSingleFile(id: string, passphrase: string): Promise<boolean> {
  const node = useWorkspaceStore.getState().nodes[id];
  if (!node || node.type !== "file" || node.locked) return false;

  const model = modelRegistry.getModel(id);
  const plaintext = model ? model.getValue() : await getActiveRepository().readFileContent(id);
  const { ciphertext, salt, iv } = await encryptContent(plaintext, passphrase);

  if (isCloudMode()) {
    await cloudRepo.patchCloudFile(id, {
      content: ciphertext,
      locked: true,
      encryptionSalt: salt,
      encryptionIv: iv,
    });
  } else {
    await localRepo.writeFileContent(id, ciphertext);
  }
  useWorkspaceStore.getState().updateNode(id, {
    locked: true,
    encryptionSalt: salt,
    encryptionIv: iv,
    size: ciphertext.length,
  });
  closeTabAndDisposeModel(id);
  return true;
}

export type UnlockResult =
  | { status: "unlocked"; plaintext: string }
  | { status: "wrong-passphrase" }
  | { status: "not-locked" };

/** Unlocks a single file if `passphrase` is correct. Doesn't touch tabs/models — callers decide
 *  what to do with the returned plaintext (MonacoEditorWrapper loads it straight into a model;
 *  the explorer's Unlock action just discards it and lets the user reopen the file normally). */
export async function unlockSingleFile(id: string, passphrase: string): Promise<UnlockResult> {
  const node = useWorkspaceStore.getState().nodes[id];
  if (!node || node.type !== "file" || !node.locked || !node.encryptionSalt || !node.encryptionIv) {
    return { status: "not-locked" };
  }

  const ciphertext = await getActiveRepository().readFileContent(id);
  let plaintext: string;
  try {
    plaintext = await decryptContent(ciphertext, passphrase, node.encryptionSalt, node.encryptionIv);
  } catch (err) {
    if (err instanceof IncorrectPassphraseError) return { status: "wrong-passphrase" };
    throw err;
  }

  if (isCloudMode()) {
    await cloudRepo.patchCloudFile(id, {
      content: plaintext,
      locked: false,
      encryptionSalt: null,
      encryptionIv: null,
    });
  } else {
    await localRepo.writeFileContent(id, plaintext);
  }
  useWorkspaceStore.getState().updateNode(id, {
    locked: false,
    encryptionSalt: null,
    encryptionIv: null,
    size: plaintext.length,
  });
  return { status: "unlocked", plaintext };
}

/** Locks a file, or every not-yet-locked file under a folder (recursively), with one passphrase.
 *  A folder itself has no lock state of its own — "locked" is purely a property of its files.
 *  Returns whether at least one file actually got locked (callers use this to decide whether to
 *  close a "Lock" prompt or leave it open). */
export async function lockNode(id: string, passphrase: string): Promise<boolean> {
  const node = useWorkspaceStore.getState().nodes[id];
  if (!node) return false;

  if (node.type === "file") {
    const ok = await lockSingleFile(id, passphrase);
    if (ok) toast.success(`Locked "${node.name}".`);
    else toast.error(`"${node.name}" is already locked.`);
    return ok;
  }

  const fileDescendants = collectSubtree(useWorkspaceStore.getState().nodes, id).filter(
    (d): d is FileNode => d.type === "file",
  );
  let locked = 0;
  let alreadyLocked = 0;
  for (const file of fileDescendants) {
    if (await lockSingleFile(file.id, passphrase)) locked++;
    else alreadyLocked++;
  }
  if (locked === 0) {
    toast.error(
      alreadyLocked > 0 ? `Every file in "${node.name}" is already locked.` : `"${node.name}" has no files to lock.`,
    );
    return false;
  }
  toast.success(
    `Locked ${locked} file${locked === 1 ? "" : "s"} in "${node.name}"` +
      (alreadyLocked > 0 ? ` (${alreadyLocked} already locked, skipped).` : "."),
  );
  return true;
}

/** Unlocks a file, or every locked file under a folder (recursively) that opens with the same
 *  passphrase — a descendant locked with a different passphrase is left locked and counted.
 *  Returns whether at least one file actually got unlocked. */
export async function unlockNode(id: string, passphrase: string): Promise<boolean> {
  const node = useWorkspaceStore.getState().nodes[id];
  if (!node) return false;

  if (node.type === "file") {
    const result = await unlockSingleFile(id, passphrase);
    if (result.status === "wrong-passphrase") toast.error("Incorrect passphrase.");
    else if (result.status === "unlocked") toast.success(`Unlocked "${node.name}".`);
    else toast.error(`"${node.name}" isn't locked.`);
    return result.status === "unlocked";
  }

  const lockedDescendants = collectSubtree(useWorkspaceStore.getState().nodes, id).filter(
    (d): d is FileNode => d.type === "file" && d.locked,
  );
  if (lockedDescendants.length === 0) {
    toast.error(`"${node.name}" has no locked files.`);
    return false;
  }
  let unlocked = 0;
  let wrongPassphrase = 0;
  for (const file of lockedDescendants) {
    const result = await unlockSingleFile(file.id, passphrase);
    if (result.status === "unlocked") unlocked++;
    else if (result.status === "wrong-passphrase") wrongPassphrase++;
  }
  if (unlocked === 0) {
    toast.error(`Incorrect passphrase — no files in "${node.name}" were unlocked.`);
    return false;
  }
  toast.success(
    `Unlocked ${unlocked} file${unlocked === 1 ? "" : "s"} in "${node.name}"` +
      (wrongPassphrase > 0 ? ` (${wrongPassphrase} use a different passphrase, still locked).` : "."),
  );
  return true;
}
