import "server-only";
import crypto from "node:crypto";
import type { Collection } from "mongodb";

import { getServerEnv } from "@/lib/env";
import { getDb } from "@/lib/mongodb/client";
import type {
  Conversation,
  ConversationSummary,
} from "@/types/ai-chat";
import type { UpdateConversationInput } from "@/lib/validations/ai-chat.schema";

type ConversationDoc = Omit<Conversation, "id"> & { _id: string };

let cachedCollection: Collection<ConversationDoc> | null = null;

async function conversationsCollection(): Promise<
  Collection<ConversationDoc>
> {
  if (cachedCollection) return cachedCollection;
  const db = await getDb();
  cachedCollection = db.collection<ConversationDoc>("conversations");
  return cachedCollection;
}

export async function ensureConversationIndexes(): Promise<void> {
  const col = await conversationsCollection();
  await col.createIndex({ uid: 1, updatedAt: -1 });
}

function docToConversation(doc: ConversationDoc): Conversation {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

// ── AI proxy ────────────────────────────────────────────────────────

type AnthropicMessage = { role: "user" | "assistant"; content: string };

export async function callAiProxy(
  messages: AnthropicMessage[],
): Promise<string> {
  const env = getServerEnv();
  const url = `${env.AI_PROXY_BASE_URL}/v1/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": env.AI_PROXY_API_KEY,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.AI_MODEL_NAME,
      max_tokens: 4096,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI proxy error (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = json.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("AI proxy returned no text content");
  }

  return textBlock.text;
}

// ── Conversation CRUD ───────────────────────────────────────────────

function generateTitle(userMessage: string): string {
  const trimmed = userMessage.trim().slice(0, 80);
  return trimmed.length < userMessage.trim().length
    ? `${trimmed}…`
    : trimmed;
}

export async function createConversation(
  uid: string,
  userMessage: string,
  assistantResponse: string,
): Promise<Conversation> {
  const now = new Date().toISOString();
  const col = await conversationsCollection();

  const doc: ConversationDoc = {
    _id: crypto.randomUUID(),
    uid,
    title: generateTitle(userMessage),
    messages: [
      { role: "user", content: userMessage, createdAt: now },
      { role: "assistant", content: assistantResponse, createdAt: now },
    ],
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  return docToConversation(doc);
}

export async function appendMessages(
  conversationId: string,
  uid: string,
  userMessage: string,
  assistantResponse: string,
): Promise<Conversation> {
  const now = new Date().toISOString();
  const col = await conversationsCollection();

  const result = await col.findOneAndUpdate(
    { _id: conversationId, uid },
    {
      $push: {
        messages: {
          $each: [
            { role: "user" as const, content: userMessage, createdAt: now },
            {
              role: "assistant" as const,
              content: assistantResponse,
              createdAt: now,
            },
          ],
        },
      },
      $set: { updatedAt: now },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Conversation not found or access denied");
  }

  return docToConversation(result);
}

export async function getConversationsByUser(
  uid: string,
): Promise<ConversationSummary[]> {
  const col = await conversationsCollection();
  const docs = await col
    .find({ uid }, { projection: { title: 1, createdAt: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return docs.map((d) => ({
    id: d._id,
    title: d.title,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function getConversationById(
  id: string,
  uid: string,
): Promise<Conversation | null> {
  const col = await conversationsCollection();
  const doc = await col.findOne({ _id: id, uid });
  return doc ? docToConversation(doc) : null;
}

export async function deleteConversation(
  id: string,
  uid: string,
): Promise<boolean> {
  const col = await conversationsCollection();
  const result = await col.deleteOne({ _id: id, uid });
  return result.deletedCount === 1;
}

export async function updateConversation(
  id: string,
  uid: string,
  patch: UpdateConversationInput,
): Promise<Conversation | null> {
  const col = await conversationsCollection();
  const result = await col.findOneAndUpdate(
    { _id: id, uid },
    { $set: { title: patch.title, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  return result ? docToConversation(result) : null;
}
