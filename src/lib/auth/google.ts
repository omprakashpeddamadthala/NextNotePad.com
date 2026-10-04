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

export function getAppOrigin(request?: { headers: Headers; url: string }): string {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) {
    try {
      return new URL(envUri).origin;
    } catch {}
  }
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const rawProto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
    const proto = rawProto.split(",")[0].trim();
    if (host) {
      const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const safeProto = isLocal ? proto : "https";
      return `${safeProto}://${host}`;
    }
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

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Google id_token is not a valid JWT format");
  }
  if (typeof Buffer !== "undefined") {
    const jsonStr = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as Record<string, unknown>;
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const jsonStr = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export function decodeIdTokenProfile(idToken: string): GoogleProfile {
  const claims = decodeJwtPayload(idToken);
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

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo fetch failed: ${res.status}`);
  return res.json();
}
