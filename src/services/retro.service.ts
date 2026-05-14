import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import type { Retro, Card, RetroPhase, CardColumn } from "@/types/retro";

type RetroDoc = Retro;
type CardDoc = Card;

let retroCol: Collection<RetroDoc> | null = null;
let cardCol: Collection<CardDoc> | null = null;

async function retrosCollection(): Promise<Collection<RetroDoc>> {
  if (retroCol) return retroCol;
  const db = await getDb();
  retroCol = db.collection<RetroDoc>("retros");
  return retroCol;
}

async function cardsCollection(): Promise<Collection<CardDoc>> {
  if (cardCol) return cardCol;
  const db = await getDb();
  cardCol = db.collection<CardDoc>("cards");
  return cardCol;
}

export async function ensureRetroIndexes(): Promise<void> {
  const retros = await retrosCollection();
  const cards = await cardsCollection();
  await retros.createIndex({ createdBy: 1, createdAt: -1 });
  await cards.createIndex({ retroId: 1, column: 1 });
  await cards.createIndex({ retroId: 1, groupId: 1 });
}

// ── Retro CRUD ────────────────────────────────────────────────────

export async function createRetro(
  uid: string,
  title: string,
  timerMinutes: number,
  votesPerUser: number,
): Promise<Retro> {
  const now = new Date().toISOString();
  const col = await retrosCollection();

  const doc: RetroDoc = {
    _id: crypto.randomUUID(),
    title,
    phase: "write",
    votesPerUser,
    timerMinutes,
    timerEndsAt: null,
    createdBy: uid,
    teamId: null,
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  return doc;
}

export async function getRetroById(id: string): Promise<Retro | null> {
  const col = await retrosCollection();
  return col.findOne({ _id: id });
}

export async function getRetrosByUser(uid: string): Promise<Retro[]> {
  const col = await retrosCollection();
  return col.find({ createdBy: uid }).sort({ createdAt: -1 }).limit(50).toArray();
}

// ── Phase Management ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<RetroPhase, RetroPhase[]> = {
  write: ["vote"],
  vote: ["actions"],
  actions: ["closed"],
  closed: [],
};

export async function updatePhase(
  retroId: string,
  uid: string,
  newPhase: RetroPhase,
  startTimer = false,
): Promise<Retro> {
  const col = await retrosCollection();
  const retro = await col.findOne({ _id: retroId });

  if (!retro) {
    throw new Error("Retro not found");
  }

  if (retro.createdBy !== uid) {
    throw new Error("Only the moderator can change phases");
  }

  const allowed = VALID_TRANSITIONS[retro.phase];
  if (!allowed.includes(newPhase)) {
    throw new Error(
      `Invalid phase transition: ${retro.phase} → ${newPhase}`,
    );
  }

  const update: Record<string, unknown> = {
    phase: newPhase,
    updatedAt: new Date().toISOString(),
  };

  if (startTimer && newPhase === "write") {
    const endsAt = new Date(Date.now() + retro.timerMinutes * 60_000);
    update.timerEndsAt = endsAt.toISOString();
  }

  if (newPhase === "vote") {
    update.timerEndsAt = null;
  }

  const result = await col.findOneAndUpdate(
    { _id: retroId },
    { $set: update },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Failed to update retro phase");
  }

  return result;
}

export async function startTimer(
  retroId: string,
  uid: string,
): Promise<Retro> {
  const col = await retrosCollection();
  const retro = await col.findOne({ _id: retroId });

  if (!retro) throw new Error("Retro not found");
  if (retro.createdBy !== uid) throw new Error("Only the moderator can start the timer");
  if (retro.phase !== "write") throw new Error("Timer can only start in write phase");

  const endsAt = new Date(Date.now() + retro.timerMinutes * 60_000);
  const result = await col.findOneAndUpdate(
    { _id: retroId },
    { $set: { timerEndsAt: endsAt.toISOString(), updatedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );

  if (!result) throw new Error("Failed to start timer");
  return result;
}

// ── Card CRUD ─────────────────────────────────────────────────────

export async function addCard(
  retroId: string,
  column: CardColumn,
  content: string,
  sessionId: string,
): Promise<Card> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new Error("Retro not found");
  if (retro.phase !== "write") throw new Error("Cards can only be added during write phase");

  const col = await cardsCollection();
  const now = new Date().toISOString();

  const doc: CardDoc = {
    _id: crypto.randomUUID(),
    retroId,
    column,
    content,
    sessionId,
    votes: 0,
    votedBy: [],
    groupId: null,
    groupTitle: null,
    createdAt: now,
  };

  await col.insertOne(doc);
  return doc;
}

export async function getCards(
  retroId: string,
  phase: RetroPhase,
  sessionId?: string,
): Promise<Card[]> {
  const col = await cardsCollection();

  if (phase === "write" && sessionId) {
    return col.find({ retroId, sessionId }).toArray();
  }

  return col.find({ retroId }).sort({ votes: -1 }).toArray();
}

// ── Voting ────────────────────────────────────────────────────────

export async function toggleVote(
  retroId: string,
  cardId: string,
  sessionId: string,
): Promise<Card> {
  const retro = await getRetroById(retroId);
  if (!retro) throw new Error("Retro not found");
  if (retro.phase !== "vote") throw new Error("Voting is only allowed during vote phase");

  const col = await cardsCollection();
  const card = await col.findOne({ _id: cardId, retroId });
  if (!card) throw new Error("Card not found");

  const hasVoted = card.votedBy.includes(sessionId);

  if (hasVoted) {
    const result = await col.findOneAndUpdate(
      { _id: cardId },
      {
        $pull: { votedBy: sessionId },
        $inc: { votes: -1 },
      },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Failed to remove vote");
    return result;
  }

  const totalVotes = await col.countDocuments({
    retroId,
    votedBy: sessionId,
  });

  if (totalVotes >= retro.votesPerUser) {
    throw new Error(`Maximum ${retro.votesPerUser} votes allowed`);
  }

  const result = await col.findOneAndUpdate(
    { _id: cardId },
    {
      $addToSet: { votedBy: sessionId },
      $inc: { votes: 1 },
    },
    { returnDocument: "after" },
  );

  if (!result) throw new Error("Failed to add vote");
  return result;
}

// ── AI Grouping Helpers ───────────────────────────────────────────

export async function getAllCards(retroId: string): Promise<Card[]> {
  const col = await cardsCollection();
  return col.find({ retroId }).toArray();
}

export async function applyAiGroups(
  retroId: string,
  groups: Array<{ groupId: string; title: string; cardIds: string[] }>,
): Promise<void> {
  const col = await cardsCollection();

  const ops = groups.flatMap((group) =>
    group.cardIds.map((cardId) => ({
      updateOne: {
        filter: { _id: cardId, retroId },
        update: {
          $set: { groupId: group.groupId, groupTitle: group.title },
        },
      },
    })),
  );

  if (ops.length > 0) {
    await col.bulkWrite(ops);
  }
}

export async function updateGroupTitle(
  retroId: string,
  groupId: string,
  newTitle: string,
): Promise<void> {
  const col = await cardsCollection();
  await col.updateMany(
    { retroId, groupId },
    { $set: { groupTitle: newTitle } },
  );
}

export async function moveCardToGroup(
  retroId: string,
  cardId: string,
  targetGroupId: string,
  targetGroupTitle: string,
): Promise<void> {
  const col = await cardsCollection();
  await col.updateOne(
    { _id: cardId, retroId },
    { $set: { groupId: targetGroupId, groupTitle: targetGroupTitle } },
  );
}
