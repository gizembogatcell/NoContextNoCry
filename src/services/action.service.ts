import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import type { Action, ActionStatus } from "@/types/action";
import type { CreateActionInput } from "@/lib/validations/action.schema";

// ── MongoDB document type ────────────────────────────────────────────

type ActionDoc = Omit<Action, "id"> & { _id: string };

// ── Cached collection ────────────────────────────────────────────────

let cachedActions: Collection<ActionDoc> | null = null;

async function actionsCollection(): Promise<Collection<ActionDoc>> {
  if (cachedActions) return cachedActions;
  const db = await getDb();
  cachedActions = db.collection<ActionDoc>("actions");
  return cachedActions;
}

// ── Index setup ──────────────────────────────────────────────────────

export async function ensureActionIndexes(): Promise<void> {
  const col = await actionsCollection();
  await Promise.all([
    col.createIndex({ retroId: 1, createdAt: -1 }),
    col.createIndex({ magicToken: 1 }, { sparse: true }),
    col.createIndex({ assigneeEmail: 1, status: 1 }),
  ]);
}

// ── Doc ↔ domain helper ─────────────────────────────────────────────

function docToAction(doc: ActionDoc): Action {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

// ── Error classes ────────────────────────────────────────────────────

export class ActionCreateError extends Error {
  readonly code = "ACTION_CREATE_ERROR";
  constructor(message: string) {
    super(message);
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────

const MAGIC_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function createAction(
  retroId: string,
  input: CreateActionInput,
): Promise<Action> {
  const now = new Date().toISOString();
  const magicToken = crypto.randomUUID();
  const magicTokenExpiresAt = new Date(
    Date.now() + MAGIC_TOKEN_TTL_MS,
  ).toISOString();

  const col = await actionsCollection();

  const doc: ActionDoc = {
    _id: crypto.randomUUID(),
    retroId,
    groupId: input.groupId,
    title: input.text,
    assigneeEmail: input.assigneeEmail,
    assigneeName: input.assigneeName ?? null,
    deadline: input.deadline ?? null,
    type: input.type,
    status: "open",
    mailSentAt: null,
    magicToken,
    magicTokenExpiresAt,
    magicTokenUsed: false,
    failedReason: null,
    nextRetroCarryOver: false,
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  return docToAction(doc);
}

export async function listActionsByRetro(retroId: string): Promise<Action[]> {
  const col = await actionsCollection();
  const docs = await col
    .find({ retroId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(docToAction);
}

export async function getActionById(actionId: string): Promise<Action | null> {
  const col = await actionsCollection();
  const doc = await col.findOne({ _id: actionId });
  return doc ? docToAction(doc) : null;
}

export async function getActionByToken(
  token: string,
): Promise<Action | null> {
  const col = await actionsCollection();
  const doc = await col.findOne({ magicToken: token });
  return doc ? docToAction(doc) : null;
}

export async function updateActionMailSent(actionId: string): Promise<void> {
  const col = await actionsCollection();
  const now = new Date().toISOString();
  await col.updateOne(
    { _id: actionId },
    { $set: { mailSentAt: now, updatedAt: now } },
  );
}

export type ActionStats = {
  completedCount: number;
  openCount: number;
  failedCount: number;
  openActions: Action[];
};

export async function getActionStatsByRetro(
  retroId: string,
): Promise<ActionStats> {
  const actions = await listActionsByRetro(retroId);

  const openActions: Action[] = [];
  let completedCount = 0;
  let openCount = 0;
  let failedCount = 0;

  for (const action of actions) {
    if (action.status === "done") {
      completedCount++;
    } else if (action.status === "failed") {
      failedCount++;
    } else {
      openCount++;
      openActions.push(action);
    }
  }

  return { completedCount, openCount, failedCount, openActions };
}

export async function updateAction(
  actionId: string,
  fields: Partial<Pick<Action, "status" | "title" | "assigneeEmail" | "assigneeName" | "deadline">>,
): Promise<Action | null> {
  const col = await actionsCollection();
  const now = new Date().toISOString();
  const result = await col.findOneAndUpdate(
    { _id: actionId },
    { $set: { ...fields, updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? docToAction(result) : null;
}

// ── Deadline cron helpers ─────────────────────────────────────────────

export async function getActionsDueToday(): Promise<Action[]> {
  const col = await actionsCollection();
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const todayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );

  const docs = await col
    .find({
      status: "open",
      mailSentAt: null,
      deadline: {
        $gte: todayStart.toISOString(),
        $lte: todayEnd.toISOString(),
      },
    })
    .toArray();

  return docs.map(docToAction);
}

// ── Magic-link updates ────────────────────────────────────────────────

type MagicTokenUpdate = {
  status: Action["status"];
  magicTokenUsed: true;
  failedReason?: string;
  nextRetroCarryOver?: boolean;
  deadline?: string | null;
};

export async function updateActionByMagicToken(
  token: string,
  fields: MagicTokenUpdate,
): Promise<Action | null> {
  const col = await actionsCollection();
  const now = new Date().toISOString();
  const result = await col.findOneAndUpdate(
    { magicToken: token },
    { $set: { ...fields, updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? docToAction(result) : null;
}

// ── Summary / carry-over ──────────────────────────────────────────────

export async function getActionSummaryByRetro(retroId: string): Promise<{
  done: Action[];
  open: Action[];
  failed: Action[];
  inProgress: Action[];
}> {
  const col = await actionsCollection();
  const docs = await col
    .find({ retroId })
    .sort({ createdAt: -1 })
    .toArray();

  const grouped: { done: Action[]; open: Action[]; failed: Action[]; inProgress: Action[] } = {
    done: [],
    open: [],
    failed: [],
    inProgress: [],
  };

  for (const doc of docs) {
    const action = docToAction(doc);
    switch (action.status) {
      case "done":
        grouped.done.push(action);
        break;
      case "open":
        grouped.open.push(action);
        break;
      case "failed":
        grouped.failed.push(action);
        break;
      case "in_progress":
        grouped.inProgress.push(action);
        break;
    }
  }

  return grouped;
}

export async function getCarryOverActions(retroId: string): Promise<Action[]> {
  const col = await actionsCollection();
  const docs = await col
    .find({ retroId, status: { $in: ["open", "failed"] as ActionStatus[] } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(docToAction);
}

export async function markFailedAsCarryOver(retroId: string): Promise<number> {
  const col = await actionsCollection();
  const now = new Date().toISOString();
  const result = await col.updateMany(
    { retroId, status: "failed" as ActionStatus, nextRetroCarryOver: { $ne: true } },
    { $set: { nextRetroCarryOver: true, updatedAt: now } },
  );
  return result.modifiedCount;
}
