import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { castVoteSchema } from "@/lib/validations/retro.schema";
import { castVote, getVotesBySession, VoteError } from "@/services/retro.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = castVoteSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const vote = await castVote(id, parsed.data.groupId, parsed.data.sessionId);
    return ok(vote, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof VoteError) {
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
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return fail(
        { message: "sessionId query parameter is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const result = await getVotesBySession(id, sessionId);
    return ok(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof VoteError) {
      return fail({ message: err.message, code: err.code }, { status: 400 });
    }
    return failFromUnknown(err);
  }
}
