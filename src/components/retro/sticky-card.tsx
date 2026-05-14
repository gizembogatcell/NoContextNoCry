"use client";

import { Card as AntCard, Typography } from "antd";

import type { Card, CardColumn, RetroPhase } from "@/types/retro";
import { VoteButton } from "./vote-button";

const { Paragraph } = Typography;

const COLUMN_COLORS: Record<CardColumn, string> = {
  mad: "#ff4d4f",
  sad: "#1677ff",
  glad: "#52c41a",
};

type StickyCardProps = {
  card: Card;
  phase: RetroPhase;
  sessionId: string;
  retroId: string;
  getIdToken: () => Promise<string | null>;
  onVoteToggled: () => void;
};

export function StickyCard({
  card,
  phase,
  sessionId,
  retroId,
  getIdToken,
  onVoteToggled,
}: StickyCardProps) {
  const borderColor = COLUMN_COLORS[card.column];
  const isVotePhase = phase === "vote";
  const hasVoted = card.votedBy.includes(sessionId);

  return (
    <AntCard
      size="small"
      style={{
        borderLeft: `4px solid ${borderColor}`,
        marginBottom: 8,
      }}
      styles={{ body: { padding: "8px 12px" } }}
    >
      <Paragraph style={{ margin: 0 }}>{card.content}</Paragraph>
      {card.groupTitle && (
        <Paragraph
          type="secondary"
          style={{ margin: "4px 0 0", fontSize: 12 }}
        >
          Grup: {card.groupTitle}
        </Paragraph>
      )}
      {isVotePhase && (
        <div style={{ marginTop: 8 }}>
          <VoteButton
            retroId={retroId}
            cardId={card._id}
            sessionId={sessionId}
            votes={card.votes}
            hasVoted={hasVoted}
            getIdToken={getIdToken}
            onVoteToggled={onVoteToggled}
          />
        </div>
      )}
    </AntCard>
  );
}
