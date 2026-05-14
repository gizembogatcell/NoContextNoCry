import "server-only";
import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase/admin";

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED";
  constructor(message = "Missing or invalid authorization token") {
    super(message);
  }
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireUser(
  request: NextRequest,
): Promise<DecodedIdToken> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new UnauthorizedError();
  }
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new UnauthorizedError();
  }
}
