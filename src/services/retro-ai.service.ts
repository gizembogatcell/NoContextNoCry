import "server-only";
import crypto from "node:crypto";

import { callAiProxy } from "@/services/ai-chat.service";
import type { Card, AiGroup } from "@/types/retro";

const AI_TIMEOUT_MS = 10_000;

export async function groupCardsWithAi(cards: Card[]): Promise<AiGroup[]> {
  if (cards.length === 0) return [];

  const cardList = cards
    .map((c) => `- [${c._id}] (${c.column}) ${c.content}`)
    .join("\n");

  const prompt = `Sen bir Agile koçusun. Aşağıdaki retrospektif notlarını anlamsal benzerliğe göre Türkçe grupla. Her gruba kısa bir başlık ver.

JSON formatında döndür (başka bir şey yazma):
{ "groups": [{ "title": "Başlık", "cardIds": ["id1", "id2"] }] }

Notlar:
${cardList}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await Promise.race([
      callAiProxy([{ role: "user", content: prompt }]),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS);
      }),
    ]);

    clearTimeout(timeout);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned invalid JSON format");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      groups: Array<{ title: string; cardIds: string[] }>;
    };

    if (!Array.isArray(parsed.groups)) {
      throw new Error("AI response missing groups array");
    }

    return parsed.groups.map((g) => ({
      groupId: crypto.randomUUID(),
      title: g.title,
      cardIds: g.cardIds,
    }));
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.message === "AI_TIMEOUT") {
      throw new Error("AI_TIMEOUT");
    }
    throw err;
  }
}
