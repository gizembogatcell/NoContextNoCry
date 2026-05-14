import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api/auth";
import { ok, fail, failFromZod, failFromUnknown } from "@/lib/api/response";
import { updateActionSchema } from "@/lib/validations/action.schema";
import { updateAction } from "@/services/action.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;

    const body: unknown = await request.json();
    const parsed = updateActionSchema.safeParse(body);
    if (!parsed.success) return failFromZod(parsed.error);

    const updated = await updateAction(id, parsed.data);
    if (!updated) {
      return fail(
        { message: "Action not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
