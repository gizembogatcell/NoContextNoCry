"use client";

import { useState } from "react";
import { Button, Badge, message } from "antd";
import { LikeOutlined, LikeFilled } from "@ant-design/icons";

type VoteButtonProps = {
  retroId: string;
  cardId: string;
  sessionId: string;
  votes: number;
  hasVoted: boolean;
  disabled?: boolean;
  getIdToken: () => Promise<string | null>;
  onVoteToggled: () => void;
};

export function VoteButton({
  retroId,
  cardId,
  sessionId,
  votes,
  hasVoted,
  disabled = false,
  getIdToken,
  onVoteToggled,
}: VoteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/retros/${retroId}/cards/${cardId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Oy verilemedi");
      }

      onVoteToggled();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Badge count={votes} size="small" offset={[8, 0]}>
      <Button
        type={hasVoted ? "primary" : "default"}
        size="small"
        icon={hasVoted ? <LikeFilled /> : <LikeOutlined />}
        onClick={handleVote}
        loading={loading}
        disabled={disabled}
        aria-label={`Oy ver (${votes} oy)`}
      />
    </Badge>
  );
}
