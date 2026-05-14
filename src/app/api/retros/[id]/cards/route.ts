import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { addCardSchema } from "@/lib/validations/retro.schema";
import { addCard, getCards, getRetroById } from "@/services/retro.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = addCardSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const { column, content, sessionId } = parsed.data;
    const card = await addCard(id, column, content, sessionId);

    return ok(card, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof Error) {
      return fail(
        { message: err.message, code: "BAD_REQUEST" },
        { status: 400 },
      );
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
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") ?? undefined;

    const retro = await getRetroById(id);
    if (!retro) {
      return fail(
        { message: "Retro not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const cards = await getCards(id, retro.phase, sessionId);
    return ok(cards);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
