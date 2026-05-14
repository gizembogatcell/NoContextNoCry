"use client";

import { useState } from "react";
import { Button, Card as AntCard, Flex, Input, Typography, Spin, Alert, message, Tag } from "antd";
import { RobotOutlined, EditOutlined, CheckOutlined } from "@ant-design/icons";

import type { Card, AiGroup } from "@/types/retro";

const { Title, Paragraph, Text } = Typography;

type AiGroupPanelProps = {
  retroId: string;
  cards: Card[];
  isModerator: boolean;
  getIdToken: () => Promise<string | null>;
  onGroupsApplied: () => void;
};

export function AiGroupPanel({
  retroId,
  cards,
  isModerator,
  getIdToken,
  onGroupsApplied,
}: AiGroupPanelProps) {
  const [groups, setGroups] = useState<AiGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hasGrouped, setHasGrouped] = useState(false);

  const existingGroups = extractGroupsFromCards(cards);
  const displayGroups = hasGrouped ? groups : existingGroups;

  const handleAiGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/retros/${retroId}/ai/group`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
        if (body?.error?.code === "AI_TIMEOUT") {
          setError("AI yanıt süresini aştı. Manuel gruplama yapabilirsiniz.");
          return;
        }
        throw new Error(body?.error?.message ?? "AI gruplama başarısız oldu");
      }

      const body = await res.json() as { data: AiGroup[] };
      setGroups(body.data);
      setHasGrouped(true);
      onGroupsApplied();
      message.success("Notlar AI ile gruplandı!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTitle = (groupId: string, currentTitle: string) => {
    setEditingGroupId(groupId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.groupId === groupId ? { ...g, title: editTitle } : g,
      ),
    );
    setEditingGroupId(null);
  };

  if (!isModerator && displayGroups.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RobotOutlined /> AI Gruplama
        </Title>
        {isModerator && !hasGrouped && existingGroups.length === 0 && (
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleAiGroup}
            loading={loading}
          >
            AI ile Grupla
          </Button>
        )}
      </Flex>

      {loading && (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin tip="AI notları grupluyor..." />
        </Flex>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {displayGroups.map((group) => (
        <AntCard
          key={group.groupId}
          size="small"
          style={{ marginBottom: 12 }}
          title={
            editingGroupId === group.groupId ? (
              <Flex gap="small" align="center">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  size="small"
                  style={{ maxWidth: 300 }}
                  onPressEnter={() => handleSaveTitle(group.groupId)}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleSaveTitle(group.groupId)}
                />
              </Flex>
            ) : (
              <Flex gap="small" align="center">
                <Text strong>{group.title}</Text>
                <Tag>{group.cardIds.length} not</Tag>
                {isModerator && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditTitle(group.groupId, group.title)}
                    aria-label="Başlığı düzenle"
                  />
                )}
              </Flex>
            )
          }
        >
          {group.cardIds.map((cardId) => {
            const card = cards.find((c) => c._id === cardId);
            if (!card) return null;
            return (
              <Paragraph key={cardId} style={{ margin: "4px 0" }}>
                <Text type="secondary">[{card.column}]</Text> {card.content}
              </Paragraph>
            );
          })}
        </AntCard>
      ))}
    </div>
  );
}

function extractGroupsFromCards(cards: Card[]): AiGroup[] {
  const groupMap = new Map<string, AiGroup>();

  for (const card of cards) {
    if (!card.groupId || !card.groupTitle) continue;

    const existing = groupMap.get(card.groupId);
    if (existing) {
      existing.cardIds.push(card._id);
    } else {
      groupMap.set(card.groupId, {
        groupId: card.groupId,
        title: card.groupTitle,
        cardIds: [card._id],
      });
    }
  }

  return Array.from(groupMap.values());
}
