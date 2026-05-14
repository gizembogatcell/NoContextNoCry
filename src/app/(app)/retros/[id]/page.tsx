"use client";

import { use, useCallback, useState } from "react";
import {
  Alert,
  Button,
  Flex,
  Spin,
  Typography,
  message,
  Space,
} from "antd";
import {
  CopyOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

import { useAuth } from "@/hooks/use-auth";
import { useSessionId } from "@/hooks/use-session-id";
import { useRetroPolling } from "@/hooks/use-retro-polling";
import { PhaseBar } from "@/components/retro/phase-bar";
import { TimerDisplay } from "@/components/retro/timer-display";
import { ColumnLayout } from "@/components/retro/column-layout";
import { AiGroupPanel } from "@/components/retro/ai-group-panel";
import { ActionSuggestionPanel } from "@/components/retro/action-suggestion-panel";
import type { Card, RetroPhase } from "@/types/retro";

const { Title, Text, Paragraph } = Typography;

function extractGroups(cards: Card[]) {
  const groupMap = new Map<string, { title: string; cardIds: string[]; voteCount: number }>();

  for (const card of cards) {
    if (!card.groupId || !card.groupTitle) continue;
    const existing = groupMap.get(card.groupId);
    if (existing) {
      existing.cardIds.push(card.id);
    } else {
      groupMap.set(card.groupId, {
        title: card.groupTitle,
        cardIds: [card.id],
        voteCount: 0,
      });
    }
  }

  return Array.from(groupMap.entries())
    .map(([groupId, g]) => ({ groupId, ...g }))
    .sort((a, b) => b.voteCount - a.voteCount);
}

export default function RetroBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, getIdToken } = useAuth();
  const sessionId = useSessionId();
  const { retro, cards, loading, error, refetchCards, refetchRetro } =
    useRetroPolling(id, sessionId);
  const [phaseLoading, setPhaseLoading] = useState(false);

  const isModerator = retro?.createdBy === user?.uid;

  const handleNextPhase = useCallback(
    async (nextPhase: RetroPhase) => {
      setPhaseLoading(true);
      try {
        const token = await getIdToken();
        if (!token) return;

        const res = await fetch(`/api/retros/${id}/phase`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phase: nextPhase }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(body?.error?.message ?? "Aşama güncellenemedi");
        }

        await refetchRetro();
        await refetchCards();
        message.success("Aşama güncellendi");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setPhaseLoading(false);
      }
    },
    [id, getIdToken, refetchRetro, refetchCards],
  );

  const handleStartTimer = useCallback(async () => {
    setPhaseLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/retros/${id}/phase`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phase: "write", startTimer: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Timer başlatılamadı");
      }

      await refetchRetro();
      message.success("Timer başlatıldı!");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setPhaseLoading(false);
    }
  }, [id, getIdToken, refetchRetro]);

  const handleEndPhase = useCallback(async () => {
    await handleNextPhase("vote");
  }, [handleNextPhase]);

  const handleCopyLink = useCallback(async () => {
    const link = `${window.location.origin}/retros/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      message.success("Link kopyalandı!");
    } catch {
      message.info(`Link: ${link}`);
    }
  }, [id]);

  if (!sessionId) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spin size="large" tip="Retro yükleniyor..." />
      </Flex>
    );
  }

  if (error || !retro) {
    return (
      <Flex justify="center" style={{ padding: 40 }}>
        <Alert
          type="error"
          message="Retro yüklenemedi"
          description={error ?? "Retro bulunamadı"}
          showIcon
        />
      </Flex>
    );
  }

  return (
    <div style={{ padding: "24px 24px 48px" }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Flex vertical>
          <Title level={3} style={{ margin: 0 }}>
            {retro.title}
          </Title>
          {isModerator && (
            <Text type="secondary">Moderatör olarak yönetiyorsunuz</Text>
          )}
        </Flex>
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyLink}
          >
            Linki Kopyala
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            onClick={handleCopyLink}
          >
            Paylaş
          </Button>
        </Space>
      </Flex>

      <PhaseBar
        phase={retro.phase}
        isModerator={isModerator}
        onNextPhase={handleNextPhase}
        loading={phaseLoading}
      />

      <TimerDisplay
        timerEndsAt={retro.timerEndsAt}
        timerMinutes={retro.timerMinutes}
        isModerator={isModerator}
        isWritePhase={retro.phase === "write"}
        onStartTimer={handleStartTimer}
        onEndPhase={handleEndPhase}
        loading={phaseLoading}
      />

      {retro.phase === "write" && !retro.timerEndsAt && (
        <Alert
          type="info"
          message="Timer henüz başlamadı"
          description={
            isModerator
              ? "Not yazımını başlatmak için yukarıdaki 'Timer Başlat' butonuna tıklayın."
              : "Moderatörün timer'ı başlatmasını bekleyin."
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <ColumnLayout
        retroId={id}
        cards={cards}
        phase={retro.phase}
        sessionId={sessionId}
        timerStarted={!!retro.timerEndsAt}
        getIdToken={getIdToken}
        onCardAdded={refetchCards}
        onVoteToggled={refetchCards}
      />

      {retro.phase === "vote" && (
        <AiGroupPanel
          retroId={id}
          cards={cards}
          isModerator={isModerator}
          getIdToken={getIdToken}
          onGroupsApplied={refetchCards}
        />
      )}

      {retro.phase === "actions" && (
        <div style={{ marginTop: 24 }}>
          <ActionSuggestionPanel
            retroId={id}
            groups={extractGroups(cards)}
          />
        </div>
      )}

      {retro.phase === "closed" && (
        <Flex justify="center" style={{ marginTop: 32 }}>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Bu retro kapatılmıştır.
          </Paragraph>
        </Flex>
      )}
    </div>
  );
}
