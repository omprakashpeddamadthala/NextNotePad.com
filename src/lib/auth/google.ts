import { decodeJwt } from "jose";

export const OAUTH_STATE_COOKIE_NAME = "np_oauth_state";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

const SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file"];

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env.local.`);
  return value;
}

/**
 * Origin to build post-login redirect URLs against. Deriving it from `request.url` breaks behind
 * a reverse proxy like Railway's — the app only sees the proxy's internal connection (e.g.
 * `http://localhost:8080`), not the public HTTPS domain, so `NextResponse.redirect(new URL(path,
 * request.url))` sends the browser to that internal address instead. `GOOGLE_REDIRECT_URI` is
 * already the one piece of config that must be the true public URL (Google itself redirects here),
 * so reuse its origin rather than adding another env var or trusting client-controlled headers.
 */
export function getAppOrigin(request?: { headers: Headers; url: string }): string {
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
    if (host) {
      return `${proto}://${host}`;
    }
  }
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) {
    try {
      return new URL(envUri).origin;
    } catch {}
  }
  return "http://localhost:3000";
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getEnv("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getEnv("GOOGLE_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getEnv("GOOGLE_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Decodes the profile claims straight out of the token response's `id_token` — no network call.
 * Requesting the `openid` scope (already done in `SCOPES`) means Google's token response always
 * includes this JWT with `sub`/`email`/`name`/`picture` already in it, making the separate
 * userinfo-endpoint round trip `fetchGoogleProfile` used to require entirely redundant. No
 * signature verification needed: it arrived directly from Google's token endpoint in the same
 * response as the access token, over our own server-to-server request — same trust level we
 * already place in the access token itself.
 */
export function decodeIdTokenProfile(idToken: string): GoogleProfile {
  const claims = decodeJwt(idToken);
  if (typeof claims.sub !== "string" || typeof claims.email !== "string") {
    throw new Error("Google id_token missing required claims");
  }
  return {
    sub: claims.sub,
    email: claims.email,
    name: typeof claims.name === "string" ? claims.name : undefined,
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
  };
}

/** Fallback for the rare case `id_token` isn't present — normally unused since `openid` is always requested. */
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo fetch failed: ${res.status}`);
  return res.json();
}
