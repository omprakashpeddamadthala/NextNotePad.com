// Google Authentication Service
// Uses @react-oauth/google for sign-in flow.
// The access token is stored in memory and used for Drive API calls.

export interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

let currentAccessToken: string | null = null;

export function setAccessToken(token: string): void {
    currentAccessToken = token;
}

export function getAccessToken(): string | null {
    return currentAccessToken;
}

export function clearAccessToken(): void {
    currentAccessToken = null;
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
