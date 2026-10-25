import type { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { badRequest } from "./respond";

type ParsedBody<T> =
  { success: true; data: T } | { success: false; response: NextResponse };

/** Parses a JSON object body; returns `null` when the body is missing or malformed. */
export async function readJsonBody<T extends object>(
  request: NextRequest,
): Promise<Partial<T> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Partial<T>) : {};
  } catch {
    return null;
  }
}

/**
 * Reads and validates a JSON body. Malformed JSON and schema failures both become a 400, so they
 * never fall through to a route's generic (5xx) error handler.
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
): Promise<ParsedBody<z.infer<S>>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { success: false, response: badRequest("Invalid JSON body") };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { success: false, response: badRequest(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
