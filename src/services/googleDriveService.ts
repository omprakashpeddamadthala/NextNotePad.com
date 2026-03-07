// Google Drive Service
// Requires the user to be signed in via Google Identity Services.
// Uses the Google Drive REST API v3 via fetch.

const FOLDER_NAME = 'NextNotePad Backup';
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
    const query = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
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
            name: FOLDER_NAME,
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
    const query = `'${folderId}' in parents and trashed=false`;
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
