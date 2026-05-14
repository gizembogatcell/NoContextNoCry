import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { addCardSchema } from "@/lib/validations/retro.schema";
import { addCard, listCards, CardWriteError } from "@/services/retro.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return fail({ message: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 });
    }
    const parsed = addCardSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const card = await addCard(id, parsed.data);
    return ok(card, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof CardWriteError) {
      return fail({ message: err.message, code: err.code }, { status: 400 });
    }
    return failFromUnknown(err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const sessionId =
      request.nextUrl.searchParams.get("sessionId") ?? undefined;
    const cards = await listCards(id, sessionId);
    return ok(cards);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
