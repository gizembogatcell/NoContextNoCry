import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api/auth";
import { ok, failFromZod, failFromUnknown } from "@/lib/api/response";
import { suggestActionsSchema } from "@/lib/validations/action.schema";
import { suggestActions } from "@/services/retro-ai-actions.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: retroId } = await params;

    const body: unknown = await request.json();
    const parsed = suggestActionsSchema.safeParse(body);
    if (!parsed.success) return failFromZod(parsed.error);

    const suggestions = await suggestActions(retroId, parsed.data.groups);
    return ok(suggestions);
  } catch (err) {
    return failFromUnknown(err);
  }
}
