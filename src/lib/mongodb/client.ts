import "server-only";
import { MongoClient, type Db } from "mongodb";

import { getServerEnv } from "@/lib/env";

type MongoCache = {
  client: MongoClient | null;
  clientPromise: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as unknown as {
  __mongo: MongoCache | undefined;
};

const cache: MongoCache =
  globalForMongo.__mongo ?? (globalForMongo.__mongo = {
    client: null,
    clientPromise: null,
  });

export function getMongoClient(): Promise<MongoClient> {
  if (cache.clientPromise) {
    return cache.clientPromise;
  }

  const { MONGODB_URI } = getServerEnv();
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  cache.clientPromise = client.connect().then((connected) => {
    cache.client = connected;
    return connected;
  });

  return cache.clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const { MONGODB_DB_NAME } = getServerEnv();
  return client.db(MONGODB_DB_NAME);
}
