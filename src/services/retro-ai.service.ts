import "server-only";
import crypto from "node:crypto";

import { callAiProxy } from "@/services/ai-chat.service";
import { getDb } from "@/lib/mongodb/client";
import { listCards } from "@/services/retro.service";
import type { NoteGroup } from "@/types/retro";
import type { ActionSuggestion } from "@/types/action";

// ── Error classes ────────────────────────────────────────────────────

export class AiGroupingError extends Error {
  readonly code = "AI_GROUPING_ERROR";
  constructor(message: string) {
    super(message);
  }
}

export class AiTimeoutError extends Error {
  readonly code = "AI_TIMEOUT_ERROR";
  constructor() {
    super("AI grouping timed out after 10 seconds");
  }
}

// ── AI card grouping ─────────────────────────────────────────────────

type AiGroupResponse = {
  groups: Array<{ title: string; cardIds: string[] }>;
};

function buildGroupingPrompt(
  cards: Array<{ id: string; content: string }>,
): string {
  const noteList = cards
    .map((c) => `- id: "${c.id}" | içerik: "${c.content}"`)
    .join("\n");

  return [
    "Sen bir Agile koçusun. Aşağıdaki retrospektif notlarını anlamsal",
    "benzerliğe göre Türkçe grupla. Her gruba kısa bir başlık ver.",
    'JSON döndür: { "groups": [{ "title": "...", "cardIds": [...] }] }',
    "",
    "Notlar:",
    noteList,
  ].join("\n");
}

function parseAiResponse(raw: string): AiGroupResponse {
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(cleaned) as unknown;

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("groups" in parsed) ||
    !Array.isArray((parsed as AiGroupResponse).groups)
  ) {
    throw new Error("Invalid AI response structure");
  }

  const response = parsed as AiGroupResponse;

  for (const group of response.groups) {
    if (typeof group.title !== "string" || !Array.isArray(group.cardIds)) {
      throw new Error("Invalid group structure in AI response");
    }
  }

  return response;
}

export async function groupCardsWithAi(
  retroId: string,
): Promise<NoteGroup[]> {
  const cards = await listCards(retroId);

  if (cards.length === 0) {
    throw new AiGroupingError("No cards to group");
  }

  const prompt = buildGroupingPrompt(
    cards.map((c) => ({ id: c.id, content: c.content })),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let rawResponse: string;
  try {
    rawResponse = await Promise.race([
      callAiProxy([{ role: "user", content: prompt }], { signal: controller.signal }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new AiTimeoutError());
        });
      }),
    ]);
  } catch (err) {
    if (err instanceof AiTimeoutError) throw err;
    throw new AiGroupingError(
      err instanceof Error ? err.message : "AI grouping failed",
    );
  } finally {
    clearTimeout(timeout);
  }

  let parsed: AiGroupResponse;
  try {
    parsed = parseAiResponse(rawResponse);
  } catch {
    throw new AiGroupingError("Failed to parse AI response as valid JSON");
  }

  const validCardIds = new Set(cards.map((c) => c.id));
  const groups: NoteGroup[] = parsed.groups.map((g) => ({
    id: crypto.randomUUID(),
    retroId,
    title: g.title,
    cardIds: g.cardIds.filter((cid) => validCardIds.has(cid)),
    voteCount: 0,
  }));

  return groups;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Card group aggregation (for action suggestions) ──────────────────

type CardGroup = {
  groupId: string;
  groupTitle: string;
  votes: number;
};

async function getRepeatCount(
  currentRetroId: string,
  groupTitle: string,
  createdBy: string,
): Promise<number> {
  const db = await getDb();
  const retros = db.collection("retros");

  const previousRetros = await retros
    .find({ createdBy, _id: { $ne: currentRetroId } as unknown as Record<string, unknown> })
    .project({ _id: 1 })
    .toArray();

  if (previousRetros.length === 0) return 0;

  const previousRetroIds = previousRetros.map((r) => r._id as string);

  const cards = db.collection("cards");
  const matchingRetroIds: string[] = await cards.distinct("retroId", {
    retroId: { $in: previousRetroIds },
    groupTitle: { $regex: escapeRegex(groupTitle), $options: "i" },
  });

  return matchingRetroIds.length;
}

function buildActionPrompt(
  title: string,
  votes: number,
  repeatCount: number,
): string {
  return [
    "Bu retro kümesi için Türkçe, aksiyon odaklı bir görev cümlesi yaz.",
    `Bağlam: küme="${title}", oy=${votes}, bu konunun retroda tekrar sayısı=${repeatCount}.`,
    "Motive edici ve kişisel tonu koru. Sadece aksiyon cümlesini döndür.",
  ].join("\n");
}

export async function getCardGroups(retroId: string): Promise<CardGroup[]> {
  const db = await getDb();
  const cards = db.collection("cards");
  const votesCol = db.collection("votes");

  const groups = await cards
    .aggregate<{ _id: string; groupTitle: string }>([
      { $match: { retroId, groupId: { $ne: null } } },
      {
        $group: {
          _id: "$groupId",
          groupTitle: { $first: "$groupTitle" },
        },
      },
    ])
    .toArray();

  const voteCounts = await votesCol
    .aggregate<{ _id: string; count: number }>([
      { $match: { retroId } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ])
    .toArray();

  const voteMap = new Map(voteCounts.map((v) => [v._id, v.count]));

  const result: CardGroup[] = groups.map((g) => ({
    groupId: g._id,
    groupTitle: g.groupTitle ?? "Untitled",
    votes: voteMap.get(g._id) ?? 0,
  }));

  result.sort((a, b) => b.votes - a.votes);
  return result;
}

export async function generateActionSuggestions(
  retroId: string,
  createdBy: string,
): Promise<ActionSuggestion[]> {
  const groups = await getCardGroups(retroId);

  if (groups.length === 0) return [];

  const results = await Promise.allSettled(
    groups.map(async (group) => {
      const repeatCount = await getRepeatCount(
        retroId,
        group.groupTitle,
        createdBy,
      );

      const prompt = buildActionPrompt(
        group.groupTitle,
        group.votes,
        repeatCount,
      );

      const suggestedText = await callAiProxy([
        { role: "user", content: prompt },
      ]);

      return {
        groupId: group.groupId,
        groupTitle: group.groupTitle,
        votes: group.votes,
        suggestedText: suggestedText.trim(),
      };
    }),
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") return result.value;

    return {
      groupId: groups[idx].groupId,
      groupTitle: groups[idx].groupTitle,
      votes: groups[idx].votes,
      suggestedText: "",
    };
  });
}
