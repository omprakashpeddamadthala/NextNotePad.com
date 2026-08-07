import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(error: ZodError) {
  return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
}
