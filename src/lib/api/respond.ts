import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function unauthorized(message = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Pass a Zod error for schema failures, or a plain message for hand-written checks. */
export function badRequest(error: ZodError | string) {
  if (typeof error === "string") {
    return NextResponse.json({ error }, { status: 400 });
  }
  return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
