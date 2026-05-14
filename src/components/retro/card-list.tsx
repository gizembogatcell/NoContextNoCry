"use client";

import { Empty } from "antd";

import type { Card, CardColumn, RetroPhase } from "@/types/retro";
import { StickyCard } from "./sticky-card";

type CardListProps = {
  cards: Card[];
  column: CardColumn;
  phase: RetroPhase;
  sessionId: string;
  retroId: string;
  getIdToken: () => Promise<string | null>;
  onVoteToggled: () => void;
};

export function CardList({
  cards,
  column,
  phase,
  sessionId,
  retroId,
  getIdToken,
  onVoteToggled,
}: CardListProps) {
  const filtered = cards
    .filter((c) => c.column === column)
    .sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  if (filtered.length === 0) {
    return <Empty description="Henüz not yok" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div>
      {filtered.map((card) => (
        <StickyCard
          key={card.id}
          card={card}
          phase={phase}
          sessionId={sessionId}
          retroId={retroId}
          getIdToken={getIdToken}
          onVoteToggled={onVoteToggled}
        />
      ))}
    </div>
  );
}
