import "server-only";

import { callAiProxy } from "@/services/ai-chat.service";
import { getDb } from "@/lib/mongodb/client";
import type { ActionSuggestion } from "@/types/action";

type GroupInput = {
  groupId: string;
  title: string;
  cardIds: string[];
};

async function getGroupVoteCount(
  retroId: string,
  cardIds: string[],
): Promise<number> {
  const db = await getDb();
  const cards = await db
    .collection("cards")
    .find({ retroId, _id: { $in: cardIds } })
    .project({ votes: 1 })
    .toArray();

  return cards.reduce((sum, c) => sum + ((c.votes as number) ?? 0), 0);
}

async function getRepeatCount(
  retroId: string,
  groupTitle: string,
): Promise<number> {
  const db = await getDb();
  const count = await db
    .collection("actions")
    .countDocuments({
      retroId: { $ne: retroId },
      title: { $regex: groupTitle, $options: "i" },
    });
  return count;
}

async function suggestSingleAction(
  groupTitle: string,
  voteCount: number,
  repeatCount: number,
): Promise<string> {
  const prompt = `Bu retro kümesi için Türkçe, aksiyon odaklı bir görev cümlesi yaz.
Bağlam: küme="${groupTitle}", oy=${voteCount}, bu konunun retroda tekrar sayısı=${repeatCount}.
Motive edici ve kişisel tonu koru. Sadece aksiyon cümlesini döndür.`;

  try {
    return await callAiProxy([{ role: "user", content: prompt }]);
  } catch {
    return "";
  }
}

export async function suggestActions(
  retroId: string,
  groups: GroupInput[],
): Promise<ActionSuggestion[]> {
  const suggestions: ActionSuggestion[] = [];

  for (const group of groups) {
    const voteCount = await getGroupVoteCount(retroId, group.cardIds);
    const repeatCount = await getRepeatCount(retroId, group.title);
    const suggestedAction = await suggestSingleAction(
      group.title,
      voteCount,
      repeatCount,
    );

    suggestions.push({
      groupId: group.groupId,
      groupTitle: group.title,
      voteCount,
      suggestedAction,
    });
  }

  return suggestions;
}
