import { google, drive_v3 } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import type { UserModel } from "@/generated/prisma/models";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env.local.`);
  return value;
}

/**
 * Builds an authenticated Drive client for a user. Persists any access-token refresh the
 * underlying OAuth2 client performs automatically, so future requests don't need to re-prompt.
 */
export function getDriveClientForUser(user: UserModel): drive_v3.Drive {
  const oauth2Client = new google.auth.OAuth2(
    getEnv("GOOGLE_CLIENT_ID"),
    getEnv("GOOGLE_CLIENT_SECRET"),
    getEnv("GOOGLE_REDIRECT_URI"),
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken ?? undefined,
    refresh_token: user.googleRefreshToken ?? undefined,
    expiry_date: user.googleTokenExpiresAt?.getTime(),
  });

  oauth2Client.on("tokens", (tokens) => {
    const data: { googleAccessToken?: string; googleRefreshToken?: string; googleTokenExpiresAt?: Date } = {};
    if (tokens.access_token) data.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) data.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date) data.googleTokenExpiresAt = new Date(tokens.expiry_date);
    if (Object.keys(data).length > 0) {
      void prisma.user.update({ where: { id: user.id }, data }).catch((err) => {
        console.error(`Failed to persist refreshed Google tokens for user ${user.id}:`, err);
      });
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}
