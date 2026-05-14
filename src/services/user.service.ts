import "server-only";
import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb/client";
import type { UpsertUserInput } from "@/lib/validations/user.schema";
import type { UserProfile } from "@/types/user";

type UserDoc = UserProfile;

let cachedCollection: Collection<UserDoc> | null = null;

async function usersCollection(): Promise<Collection<UserDoc>> {
  if (cachedCollection) {
    return cachedCollection;
  }
  const db = await getDb();
  cachedCollection = db.collection<UserDoc>("users");
  return cachedCollection;
}

export async function ensureIndexes(): Promise<void> {
  const col = await usersCollection();
  await col.createIndex({ uid: 1 }, { unique: true });
}

export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  const col = await usersCollection();
  const doc = await col.findOne({ uid }, { projection: { _id: 0 } });
  return doc ?? null;
}

export async function upsertUserFromToken(args: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  patch?: UpsertUserInput;
}): Promise<UserProfile> {
  const now = new Date().toISOString();
  const col = await usersCollection();

  const update = {
    $set: {
      email: args.email,
      displayName: args.patch?.displayName ?? args.displayName,
      photoURL: args.patch?.photoURL ?? args.photoURL,
      updatedAt: now,
    },
    $setOnInsert: {
      uid: args.uid,
      createdAt: now,
    },
  };

  await col.updateOne({ uid: args.uid }, update, { upsert: true });
  const doc = await col.findOne(
    { uid: args.uid },
    { projection: { _id: 0 } },
  );
  if (!doc) {
    throw new Error("Failed to upsert user");
  }
  return doc;
}
