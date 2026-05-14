import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { fail, failFromUnknown, ok } from "@/lib/api/response";
import { upsertUserSchema } from "@/lib/validations/user.schema";
import {
  getUserByUid,
  upsertUserFromToken,
} from "@/services/user.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const profile = await getUserByUid(decoded.uid);
    if (!profile) {
      const created = await upsertUserFromToken({
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        photoURL: decoded.picture ?? null,
      });
      return ok(created);
    }
    return ok(profile);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const json = await request.json().catch(() => ({}));
    const parsed = upsertUserSchema.safeParse(json);
    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }
    const profile = await upsertUserFromToken({
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      patch: parsed.data,
    });
    return ok(profile);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
