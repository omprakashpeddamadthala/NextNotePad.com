import type { DriveRevision, DriveService } from "./driveService";
import { AppError, getNoteFile } from "./workspaceService";

/** Drive revision ids are short opaque tokens; reject anything else early. */
const REVISION_ID = /^[A-Za-z0-9_-]{1,200}$/;

export async function listNoteRevisions(
  ds: DriveService,
  fileId: string,
): Promise<DriveRevision[]> {
  await getNoteFile(ds, fileId);
  return ds.listRevisions(fileId);
}

export async function readNoteRevision(
  ds: DriveService,
  fileId: string,
  revisionId: string,
): Promise<string> {
  if (!REVISION_ID.test(revisionId)) throw new AppError("Not found", 404);
  await getNoteFile(ds, fileId);
  return ds.readRevisionText(fileId, revisionId);
}
