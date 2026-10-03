import { NextRequest, NextResponse } from "next/server";
import { getDriveSession, driveErrorResponse } from "@/lib/drive/session";
import { AppConfigService, type AppConfig } from "@/lib/drive/appConfigService";
import { updateSettingsSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

function toResponse(config: AppConfig) {
  const { theme, editor } = config.settings;
  return NextResponse.json({
    theme,
    json: editor ? JSON.stringify(editor) : null,
    recentFiles: config.recentFiles,
    favorites: config.favorites,
    revision: config.revision,
    updatedAt: config.updatedAt,
  });
}

/** Settings, recents and favorites all live in `NextNotePad.com/.appConfig.json`. */
export async function GET() {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    return toResponse(
      await new AppConfigService(session.ds).load({ fresh: true }),
    );
  } catch (err) {
    return driveErrorResponse(err, "Load settings");
  }
}

/** Partial update: only the fields present are changed, merged into a fresh read of the file so
 *  concurrent writes from another device to *other* fields are preserved. */
export async function PUT(request: NextRequest) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const parsed = updateSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { theme, json, recentFiles, favorites } = parsed.data;
    const config = await new AppConfigService(session.ds).update((c) => {
      if (theme !== undefined) c.settings.theme = theme;
      if (json !== undefined)
        c.settings.editor = JSON.parse(json) as Record<string, unknown>;
      if (recentFiles !== undefined) c.recentFiles = recentFiles;
      if (favorites !== undefined) c.favorites = favorites;
    });
    return toResponse(config);
  } catch (err) {
    return driveErrorResponse(err, "Save settings");
  }
}
