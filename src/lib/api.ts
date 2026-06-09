import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/** Standard error handler for API route catch blocks. */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, { issues: error.flatten().fieldErrors });
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    // Prisma unique constraint
    if ("code" in error && (error as { code?: string }).code === "P2002") {
      return fail("A record with these unique fields already exists", 409);
    }
    console.error("[API error]", error);
    return fail(error.message || "Server error", 500);
  }
  console.error("[API error]", error);
  return fail("Server error", 500);
}

/**
 * Recursively converts Prisma Decimal/Date values into plain numbers/strings
 * so objects are safe to pass to client components and JSON responses.
 */
export function serialize<T>(value: T): T {
  return convert(value) as T;
}

/**
 * Recursively converts Prisma Decimal -> number and Date -> ISO string.
 * We do NOT use JSON.stringify here because Decimal.toJSON() runs before any
 * replacer and turns Decimals into strings (breaking `.toFixed()` and numeric
 * comparisons downstream).
 */
function convert(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(convert);
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") {
    const obj = val as Record<string, unknown> & {
      toNumber?: unknown;
      toFixed?: unknown;
    };
    // Prisma Decimal (decimal.js) exposes toNumber() + toFixed().
    if (typeof obj.toNumber === "function" && typeof obj.toFixed === "function") {
      return (obj.toNumber as () => number)();
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      out[key] = convert(obj[key]);
    }
    return out;
  }
  return val;
}
