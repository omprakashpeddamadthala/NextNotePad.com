// Google Drive Service
// Requires the user to be signed in via Google Identity Services.
// Uses the Google Drive REST API v3 via fetch.

export const ROOT_FOLDER_NAME = 'NextNotePad.com';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

interface DriveFile {
    id: string;
    name: string;
    modifiedTime: string;
}

async function getHeaders(accessToken: string) {
    return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
}

export async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
    const headers = await getHeaders(accessToken);

    // Search for existing folder
    const query = `name='${ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    }

    // Create folder
    const createRes = await fetch(`${DRIVE_API}/files`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: ROOT_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        }),
    });
    const createData = await createRes.json();
    return createData.id;
}

export async function listDriveNotes(
    accessToken: string,
    folderId: string
): Promise<DriveFile[]> {
    const headers = await getHeaders(accessToken);
    const query = `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
    const res = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
        { headers }
    );
    const data = await res.json();
    return data.files || [];
}

export async function uploadNoteToDrive(
    accessToken: string,
    folderId: string,
    fileName: string,
    content: string,
    existingFileId?: string
): Promise<string> {
    const headers = await getHeaders(accessToken);

    if (existingFileId) {
        // Update existing file
        await fetch(`${UPLOAD_API}/files/${existingFileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                ...headers,
                'Content-Type': 'text/plain',
            },
            body: content,
        });
        return existingFileId;
    }

    // Create new file with multipart upload
    const metadata = {
        name: fileName,
        parents: [folderId],
    };

    const boundary = 'notepad_web_boundary';
    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: text/plain\r\n\r\n` +
        `${content}\r\n` +
        `--${boundary}--`;

    const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    });
    const data = await res.json();
    return data.id;
}

export async function downloadNoteFromDrive(
    accessToken: string,
    fileId: string
): Promise<string> {
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.text();
}

export async function deleteNoteFromDrive(
    accessToken: string,
    fileId: string
): Promise<void> {
    await fetch(`${DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

/** List all workspace subfolders inside the root NextNotePad.com folder */
export async function listWorkspaceFolders(
    accessToken: string,
    rootFolderId: string
): Promise<DriveFile[]> {
    const headers = await getHeaders(accessToken);
    const query = `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const res = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers }
    );
    const data = await res.json();
    return data.files || [];
}

/** Create a subfolder inside the root NextNotePad.com folder for a new workspace */
export async function createWorkspaceFolder(
    accessToken: string,
    rootFolderId: string,
    workspaceName: string
): Promise<string> {
    const headers = await getHeaders(accessToken);
    const res = await fetch(`${DRIVE_API}/files`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: workspaceName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
        }),
    });
    const data = await res.json();
    return data.id;
}

/** Rename an existing workspace folder in Google Drive */
export async function renameWorkspaceFolder(
    accessToken: string,
    folderId: string,
    newName: string
): Promise<void> {
    await fetch(`${DRIVE_API}/files/${folderId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
    });
}

/** Delete (trash) a workspace folder in Google Drive */
export async function deleteWorkspaceFolder(
    accessToken: string,
    folderId: string
): Promise<void> {
    // Note: To permanently delete, use DELETE method.
    // Changing trashed to true is safer. Let's use the DELETE method as requested,
    // or just call deleteNoteFromDrive which already does DELETE method.
    // Actually, we'll use DELETE method to be consistent with deleteNoteFromDrive.
    await fetch(`${DRIVE_API}/files/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

// ── SETTINGS SYNC ──────────────────────────────────────────────────────────
const SETTINGS_FILENAME = '.settings';

export interface DriveSettings {
    theme: 'light' | 'dark';
    wordWrap: boolean;
    fontSize: number;
    sidebarOpen: boolean;
}

/** Upload (create or overwrite) .settings JSON in the root folder */
export async function uploadSettings(
    accessToken: string,
    rootFolderId: string,
    settings: DriveSettings
): Promise<void> {
    const headers = await getHeaders(accessToken);
    const content = JSON.stringify(settings, null, 2);

    // Check if file already exists
    const query = `name='${SETTINGS_FILENAME}' and '${rootFolderId}' in parents and trashed=false`;
    const searchRes = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers }
    );
    const searchData = await searchRes.json();
    const existingId: string | undefined = searchData.files?.[0]?.id;

    if (existingId) {
        // Update content
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: content,
        });
    } else {
        // Create new file with multipart
        const boundary = 'settings_boundary';
        const metadata = JSON.stringify({ name: SETTINGS_FILENAME, parents: [rootFolderId] });
        const body =
            `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
            `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n` +
            `--${boundary}--`;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
            body,
        });
    }
}

/** Download .settings from root folder. Returns null if not found. */
export async function downloadSettings(
    accessToken: string,
    rootFolderId: string
): Promise<DriveSettings | null> {
    const headers = await getHeaders(accessToken);
    const query = `name='${SETTINGS_FILENAME}' and '${rootFolderId}' in parents and trashed=false`;
    const searchRes = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers }
    );
    const searchData = await searchRes.json();
    const fileId: string | undefined = searchData.files?.[0]?.id;
    if (!fileId) return null;

    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    try {
        return await res.json() as DriveSettings;
    } catch {
        return null;
    }
}
