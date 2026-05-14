import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import { generateMagicToken } from "@/lib/magic-token";
import type { Action } from "@/types/action";
import type { CreateActionInput, UpdateActionInput } from "@/lib/validations/action.schema";

type ActionDoc = Omit<Action, "_id"> & { _id: string };

let cachedCollection: Collection<ActionDoc> | null = null;

async function actionsCollection(): Promise<Collection<ActionDoc>> {
  if (cachedCollection) return cachedCollection;
  const db = await getDb();
  cachedCollection = db.collection<ActionDoc>("actions");
  return cachedCollection;
}

export async function ensureActionIndexes(): Promise<void> {
  const col = await actionsCollection();
  await col.createIndex({ retroId: 1, createdAt: -1 });
  await col.createIndex({ magicToken: 1 }, { sparse: true });
}

export async function createAction(
  input: CreateActionInput,
): Promise<Action> {
  const now = new Date().toISOString();
  const magic = input.type === "mail" ? generateMagicToken() : null;

  const doc: ActionDoc = {
    _id: crypto.randomUUID(),
    retroId: input.retroId,
    cardId: input.cardId,
    title: input.title,
    assigneeEmail: input.assigneeEmail,
    assigneeName: input.assigneeName,
    deadline: input.deadline,
    type: input.type,
    status: "open",
    mailSentAt: null,
    magicToken: magic?.token ?? null,
    magicTokenExpiresAt: magic?.expiresAt ?? null,
    magicTokenUsed: false,
    failedReason: null,
    nextRetroCarryOver: false,
    jiraTicketUrl: null,
    jiraTicketId: null,
    jiraError: null,
    createdAt: now,
    updatedAt: now,
  };

  const col = await actionsCollection();
  await col.insertOne(doc);
  return doc as Action;
}

export async function getActionsByRetro(retroId: string): Promise<Action[]> {
  const col = await actionsCollection();
  const docs = await col
    .find({ retroId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as Action[];
}

export async function getActionById(id: string): Promise<Action | null> {
  const col = await actionsCollection();
  const doc = await col.findOne({ _id: id });
  return doc ? (doc as Action) : null;
}

export async function updateAction(
  id: string,
  patch: UpdateActionInput,
): Promise<Action | null> {
  const col = await actionsCollection();
  const updateFields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.status !== undefined) updateFields.status = patch.status;
  if (patch.deadline !== undefined) updateFields.deadline = patch.deadline;
  if (patch.title !== undefined) updateFields.title = patch.title;
  if (patch.failedReason !== undefined) updateFields.failedReason = patch.failedReason;

  const result = await col.findOneAndUpdate(
    { _id: id },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  return result ? (result as Action) : null;
}

export async function markMailSent(id: string): Promise<void> {
  const col = await actionsCollection();
  await col.updateOne(
    { _id: id },
    { $set: { mailSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
  );
}

export async function markMailFailed(
  id: string,
  reason: string,
): Promise<void> {
  const col = await actionsCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        failedReason: reason,
        updatedAt: new Date().toISOString(),
      },
    },
  );
}
