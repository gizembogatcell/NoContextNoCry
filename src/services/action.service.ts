import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import type { Action } from "@/types/action";
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
    jiraTicketUrl: null,
    jiraTicketId: null,
    jiraError: null,
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
