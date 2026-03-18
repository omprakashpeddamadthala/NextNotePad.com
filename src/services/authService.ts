// Google Authentication Service
// Uses @react-oauth/google for sign-in flow.
// The access token is persisted to sessionStorage so it survives page refreshes.

export interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

const TOKEN_KEY = 'notepad_access_token';
const USER_KEY = 'notepad_user_profile';

let currentAccessToken: string | null = null;

/** Store access token in memory + sessionStorage */
export function setAccessToken(token: string): void {
    currentAccessToken = token;
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

export function getAccessToken(): string | null {
    if (currentAccessToken) return currentAccessToken;
    // Restore from sessionStorage on first call (e.g. after page refresh)
    try {
        const stored = sessionStorage.getItem(TOKEN_KEY);
        if (stored) { currentAccessToken = stored; return stored; }
    } catch { /* ignore */ }
    return null;
}

export function clearAccessToken(): void {
    currentAccessToken = null;
    try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
}

/** Persist user profile to sessionStorage */
export function saveUserProfile(user: GoogleUser): void {
    try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

/** Restore user profile from sessionStorage (returns null if not found) */
export function getSavedUserProfile(): GoogleUser | null {
    try {
        const raw = sessionStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as GoogleUser;
    } catch { return null; }
}

export async function fetchUserProfile(accessToken: string): Promise<GoogleUser> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    return {
        name: data.name,
        email: data.email,
        picture: data.picture,
    };
}

/** Check if a stored access token is still valid */
export async function validateToken(accessToken: string): Promise<boolean> {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.ok;
    } catch {
        return false;
    }
}
