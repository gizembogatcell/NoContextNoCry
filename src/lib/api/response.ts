import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiError = {
  message: string;
  code: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: { status?: number }): NextResponse {
  return NextResponse.json({ data }, { status: init?.status ?? 200 });
}

export function fail(
  error: ApiError,
  init: { status: number },
): NextResponse {
  return NextResponse.json({ error }, { status: init.status });
}

export function failFromZod(error: ZodError): NextResponse {
  return fail(
    {
      message: "Invalid request payload",
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    },
    { status: 400 },
  );
}

export function failFromUnknown(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return failFromZod(err);
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  if (process.env.NODE_ENV !== "production") {
    console.error("[api]", err);
  }
  return fail(
    { message, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
