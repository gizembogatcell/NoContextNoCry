import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import type { Retro, Card, RetroPhase, NoteGroup, Vote } from "@/types/retro";
import { PHASE_ORDER } from "@/types/retro";
import type {
  CreateRetroInput,
  AddCardInput,
  UpdateGroupsInput,
} from "@/lib/validations/retro.schema";

// ── MongoDB document types ──────────────────────────────────────────

type RetroDoc = Omit<Retro, "id"> & { _id: string };
type CardDoc = Omit<Card, "id"> & { _id: string };
type VoteDoc = Omit<Vote, "id"> & { _id: string };

// ── Cached collections ──────────────────────────────────────────────

let cachedRetros: Collection<RetroDoc> | null = null;
let cachedCards: Collection<CardDoc> | null = null;
let cachedVotes: Collection<VoteDoc> | null = null;

async function retrosCollection(): Promise<Collection<RetroDoc>> {
  if (cachedRetros) return cachedRetros;
  const db = await getDb();
  cachedRetros = db.collection<RetroDoc>("retros");
  return cachedRetros;
}

async function cardsCollection(): Promise<Collection<CardDoc>> {
  if (cachedCards) return cachedCards;
  const db = await getDb();
  cachedCards = db.collection<CardDoc>("cards");
  return cachedCards;
}

async function votesCollection(): Promise<Collection<VoteDoc>> {
  if (cachedVotes) return cachedVotes;
  const db = await getDb();
  cachedVotes = db.collection<VoteDoc>("votes");
  return cachedVotes;
}

// ── Index setup ─────────────────────────────────────────────────────

export async function ensureRetroIndexes(): Promise<void> {
  const retros = await retrosCollection();
  const cards = await cardsCollection();
  const votes = await votesCollection();
  await Promise.all([
    retros.createIndex({ createdBy: 1, createdAt: -1 }),
    cards.createIndex({ retroId: 1, createdAt: 1 }),
    cards.createIndex({ retroId: 1, sessionId: 1 }),
    cards.createIndex({ retroId: 1, groupId: 1 }),
    votes.createIndex({ retroId: 1, sessionId: 1 }),
    votes.createIndex({ retroId: 1, groupId: 1 }),
    votes.createIndex(
      { retroId: 1, groupId: 1, sessionId: 1 },
      { unique: true },
    ),
  ]);
}

// ── Doc ↔ domain helpers ────────────────────────────────────────────

function docToRetro(doc: RetroDoc): Retro {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function docToCard(doc: CardDoc): Card {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function docToVote(doc: VoteDoc): Vote {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

// ── Retro CRUD ──────────────────────────────────────────────────────

export async function createRetro(
  uid: string,
  input: CreateRetroInput,
): Promise<Retro> {
  const now = new Date().toISOString();
  const col = await retrosCollection();

  const doc: RetroDoc = {
    _id: crypto.randomUUID(),
    title: input.title,
    phase: "write",
    votesPerUser: input.votesPerUser ?? 3,
    timerMinutes: input.timerMinutes,
    timerEndsAt: null,
    createdBy: uid,
    teamId: null,
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  return docToRetro(doc);
}

export async function listRetrosByUser(uid: string): Promise<Retro[]> {
  const col = await retrosCollection();
  const docs = await col
    .find({ createdBy: uid })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return docs.map(docToRetro);
}

export async function getRetroById(id: string): Promise<Retro | null> {
  const col = await retrosCollection();
  const doc = await col.findOne({ _id: id });
  return doc ? docToRetro(doc) : null;
}

export async function getPreviousRetro(
  uid: string,
  currentRetroId: string,
): Promise<Retro | null> {
  const col = await retrosCollection();
  const current = await col.findOne({ _id: currentRetroId });
  if (!current) return null;

  const doc = await col.findOne(
    {
      createdBy: uid,
      _id: { $ne: currentRetroId },
      createdAt: { $lt: current.createdAt },
    },
    { sort: { createdAt: -1 } },
  );

  return doc ? docToRetro(doc) : null;
}

// ── Phase transitions ───────────────────────────────────────────────

export class PhaseTransitionError extends Error {
  readonly code = "PHASE_TRANSITION_ERROR";
  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";
  constructor(message = "You are not allowed to perform this action") {
    super(message);
  }
}

function isValidTransition(current: RetroPhase, next: RetroPhase): boolean {
  const currentIdx = PHASE_ORDER.indexOf(current);
  const nextIdx = PHASE_ORDER.indexOf(next);
  return nextIdx === currentIdx + 1;
}

export async function updatePhase(
  retroId: string,
  uid: string,
  nextPhase: RetroPhase,
): Promise<Retro> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new PhaseTransitionError("Retro not found");
  if (retro.createdBy !== uid) throw new ForbiddenError();

  if (!isValidTransition(retro.phase, nextPhase)) {
    throw new PhaseTransitionError(
      `Cannot transition from "${retro.phase}" to "${nextPhase}"`,
    );
  }

  const now = new Date().toISOString();
  const col = await retrosCollection();

  const updateFields: Record<string, unknown> = {
    phase: nextPhase,
    updatedAt: now,
  };

  if (nextPhase === "vote") {
    updateFields.timerEndsAt = null;
  }

  const result = await col.findOneAndUpdate(
    { _id: retroId },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  if (!result) throw new PhaseTransitionError("Retro not found");
  return docToRetro(result);
}

export async function startTimer(
  retroId: string,
  uid: string,
): Promise<Retro> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new PhaseTransitionError("Retro not found");
  if (retro.createdBy !== uid) throw new ForbiddenError();
  if (retro.phase !== "write") {
    throw new PhaseTransitionError("Timer can only start in write phase");
  }

  const now = new Date();
  const timerEndsAt = new Date(
    now.getTime() + retro.timerMinutes * 60_000,
  ).toISOString();

  const col = await retrosCollection();
  const result = await col.findOneAndUpdate(
    { _id: retroId },
    { $set: { timerEndsAt, updatedAt: now.toISOString() } },
    { returnDocument: "after" },
  );

  if (!result) throw new PhaseTransitionError("Retro not found");
  return docToRetro(result);
}

/**
 * Server-side check: if timer has expired, auto-transition to vote.
 * Called on GET /api/retros/[id] to ensure clients see the correct phase.
 */
export async function checkTimerExpiry(retroId: string): Promise<Retro | null> {
  const retro = await getRetroById(retroId);
  if (!retro) return null;

  if (
    retro.phase === "write" &&
    retro.timerEndsAt &&
    new Date(retro.timerEndsAt) <= new Date()
  ) {
    const col = await retrosCollection();
    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      { _id: retroId, phase: "write" },
      { $set: { phase: "vote", timerEndsAt: null, updatedAt: now } },
      { returnDocument: "after" },
    );
    return result ? docToRetro(result) : retro;
  }

  return retro;
}

// ── Card CRUD ───────────────────────────────────────────────────────

export class CardWriteError extends Error {
  readonly code = "CARD_WRITE_ERROR";
  constructor(message: string) {
    super(message);
  }
}

export async function addCard(
  retroId: string,
  input: AddCardInput,
): Promise<Card> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new CardWriteError("Retro not found");
  if (retro.phase !== "write") {
    throw new CardWriteError("Cards can only be added during write phase");
  }

  const col = await cardsCollection();
  const doc: CardDoc = {
    _id: crypto.randomUUID(),
    retroId,
    column: input.column,
    content: input.content,
    sessionId: input.sessionId,
    groupId: null,
    groupTitle: null,
    createdAt: new Date().toISOString(),
  };

  await col.insertOne(doc);
  return docToCard(doc);
}

export async function listCards(
  retroId: string,
  sessionId?: string,
): Promise<Card[]> {
  const retro = await getRetroById(retroId);
  if (!retro) return [];

  const col = await cardsCollection();

  if (retro.phase === "write" && sessionId) {
    const docs = await col
      .find({ retroId, sessionId })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(docToCard);
  }

  if (retro.phase === "write") {
    return [];
  }

  const docs = await col
    .find({ retroId })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(docToCard);
}

export async function getCardById(
  retroId: string,
  cardId: string,
): Promise<Card | null> {
  const col = await cardsCollection();
  const doc = await col.findOne({ _id: cardId, retroId });
  return doc ? docToCard(doc) : null;
}

// ── Group operations ─────────────────────────────────────────────────

export class VoteError extends Error {
  readonly code = "VOTE_ERROR";
  constructor(message: string) {
    super(message);
  }
}

export async function saveGroups(
  retroId: string,
  groups: Array<{ id: string; title: string; cardIds: string[] }>,
): Promise<void> {
  const col = await cardsCollection();

  await col.updateMany({ retroId }, { $set: { groupId: null, groupTitle: null } });

  const ops = groups.flatMap((g) =>
    g.cardIds.map((cardId) => ({
      updateOne: {
        filter: { _id: cardId, retroId },
        update: { $set: { groupId: g.id, groupTitle: g.title } },
      },
    })),
  );

  if (ops.length > 0) {
    await col.bulkWrite(ops);
  }
}

export async function getGroups(retroId: string): Promise<NoteGroup[]> {
  const col = await cardsCollection();
  const votes = await votesCollection();

  const cards = await col
    .find({ retroId, groupId: { $ne: null } })
    .toArray();

  const groupMap = new Map<string, { title: string; cardIds: string[] }>();
  for (const card of cards) {
    if (!card.groupId || !card.groupTitle) continue;
    const existing = groupMap.get(card.groupId);
    if (existing) {
      existing.cardIds.push(card._id);
    } else {
      groupMap.set(card.groupId, { title: card.groupTitle, cardIds: [card._id] });
    }
  }

  const voteCounts = await votes
    .aggregate<{ _id: string; count: number }>([
      { $match: { retroId } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ])
    .toArray();

  const voteMap = new Map(voteCounts.map((v) => [v._id, v.count]));

  const groups: NoteGroup[] = [];
  for (const [id, { title, cardIds }] of groupMap) {
    groups.push({
      id,
      retroId,
      title,
      cardIds,
      voteCount: voteMap.get(id) ?? 0,
    });
  }

  groups.sort((a, b) => b.voteCount - a.voteCount);
  return groups;
}

export async function updateGroups(
  retroId: string,
  uid: string,
  input: UpdateGroupsInput,
): Promise<NoteGroup[]> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new ForbiddenError("Retro not found");
  if (retro.createdBy !== uid) throw new ForbiddenError();

  await saveGroups(
    retroId,
    input.groups.map((g) => ({ id: g.id, title: g.title, cardIds: g.cardIds })),
  );

  return getGroups(retroId);
}

// ── Voting ───────────────────────────────────────────────────────────

export async function castVote(
  retroId: string,
  groupId: string,
  sessionId: string,
): Promise<Vote> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new VoteError("Retro not found");

  if (retro.phase !== "vote") {
    throw new VoteError("Voting is only allowed during the vote phase");
  }

  const votes = await votesCollection();

  const alreadyVoted = await votes.findOne({ retroId, groupId, sessionId });
  if (alreadyVoted) {
    throw new VoteError("You have already voted for this group");
  }

  const existingCount = await votes.countDocuments({ retroId, sessionId });

  if (existingCount >= retro.votesPerUser) {
    throw new VoteError(
      `Maximum ${retro.votesPerUser} votes per user exceeded`,
    );
  }

  const col = await cardsCollection();
  const groupExists = await col.findOne({ retroId, groupId });
  if (!groupExists) {
    throw new VoteError("Group does not exist");
  }

  const doc: VoteDoc = {
    _id: crypto.randomUUID(),
    retroId,
    groupId,
    sessionId,
    createdAt: new Date().toISOString(),
  };

  await votes.insertOne(doc);

  return docToVote(doc);
}

export async function getLatestRetroByUser(uid: string): Promise<Retro | null> {
  const col = await retrosCollection();
  const doc = await col.findOne(
    { createdBy: uid },
    { sort: { createdAt: -1 } },
  );
  return doc ? docToRetro(doc) : null;
}

export async function getVotesBySession(
  retroId: string,
  sessionId: string,
): Promise<{ votesUsed: number; votesRemaining: number }> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new VoteError("Retro not found");

  const votes = await votesCollection();
  const count = await votes.countDocuments({ retroId, sessionId });

  return {
    votesUsed: count,
    votesRemaining: Math.max(0, retro.votesPerUser - count),
  };
}
