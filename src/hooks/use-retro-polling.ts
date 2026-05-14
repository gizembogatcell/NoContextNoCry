"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Retro, Card } from "@/types/retro";
import { useAuth } from "@/hooks/use-auth";

const POLL_INTERVAL_MS = 5_000;

type UseRetroPollingResult = {
  retro: Retro | null;
  cards: Card[];
  loading: boolean;
  error: string | null;
  refetchCards: () => Promise<void>;
  refetchRetro: () => Promise<void>;
};

export function useRetroPolling(
  retroId: string,
  sessionId: string,
): UseRetroPollingResult {
  const { getIdToken } = useAuth();
  const [retro, setRetro] = useState<Retro | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRetro = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/retros/${retroId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Failed to fetch retro");
      }

      const body = await res.json() as { data: Retro };
      setRetro(body.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [retroId, getIdToken]);

  const fetchCards = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const url = new URL(`/api/retros/${retroId}/cards`, window.location.origin);
      if (sessionId) url.searchParams.set("sessionId", sessionId);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Failed to fetch cards");
      }

      const body = await res.json() as { data: Card[] };
      setCards(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [retroId, sessionId, getIdToken]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchRetro(), fetchCards()]);
    setLoading(false);
  }, [fetchRetro, fetchCards]);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();

    const startPolling = () => {
      fetchAll();
      intervalRef.current = setInterval(fetchAll, POLL_INTERVAL_MS);
    };

    const timerId = setTimeout(startPolling, 0);

    return () => {
      clearTimeout(timerId);
      controller.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAll, sessionId]);

  return {
    retro,
    cards,
    loading,
    error,
    refetchCards: fetchCards,
    refetchRetro: fetchRetro,
  };
}
