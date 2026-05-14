import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { createRetroSchema } from "@/lib/validations/retro.schema";
import { createRetro, getRetrosByUser } from "@/services/retro.service";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = createRetroSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const { title, timerMinutes, votesPerUser } = parsed.data;
    const retro = await createRetro(decoded.uid, title, timerMinutes, votesPerUser);

    return ok(retro, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const retros = await getRetrosByUser(decoded.uid);

    return ok(retros);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
