"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  message,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";

import { useAuthContext } from "@/contexts/auth-context";
import type { ActionSuggestion } from "@/types/action";

const { Text, Title } = Typography;
const { TextArea } = Input;

type ActionDraft = ActionSuggestion & {
  assigneeEmail: string;
  assigneeName: string;
  deadline: string | null;
  type: "mail";
  isApproved: boolean;
  isDeleted: boolean;
  isSaving: boolean;
};

type ActionSuggestionPanelProps = {
  retroId: string;
  groups: Array<{
    groupId: string;
    title: string;
    cardIds: string[];
    voteCount: number;
  }>;
};

export function ActionSuggestionPanel({
  retroId,
  groups,
}: ActionSuggestionPanelProps) {
  const { getIdToken } = useAuthContext();
  const [drafts, setDrafts] = useState<ActionDraft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    try {
      const token = await getIdToken();
      if (!token) {
        message.error("Oturum bulunamadı");
        return;
      }

      const res = await fetch(`/api/retros/${retroId}/ai/actions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groups: groups.map((g) => ({
            groupId: g.groupId,
            title: g.title,
            cardIds: g.cardIds,
          })),
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(errBody?.error?.message ?? "AI önerileri alınamadı");
      }

      const json = (await res.json()) as { data: ActionSuggestion[] };

      const newDrafts: ActionDraft[] = json.data.map((s) => ({
        ...s,
        assigneeEmail: "",
        assigneeName: "",
        deadline: null,
        type: "mail" as const,
        isApproved: false,
        isDeleted: false,
        isSaving: false,
      }));

      setDrafts(newDrafts);
      setHasGenerated(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      message.error(msg);
      const emptyDrafts: ActionDraft[] = groups.map((g) => ({
        groupId: g.groupId,
        groupTitle: g.title,
        votes: g.voteCount,
        suggestedText: "",
        assigneeEmail: "",
        assigneeName: "",
        deadline: null,
        type: "mail" as const,
        isApproved: false,
        isDeleted: false,
        isSaving: false,
      }));
      setDrafts(emptyDrafts);
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  }, [retroId, groups, getIdToken]);

  const updateDraft = useCallback(
    (groupId: string, updates: Partial<ActionDraft>) => {
      setDrafts((prev) =>
        prev.map((d) => (d.groupId === groupId ? { ...d, ...updates } : d)),
      );
    },
    [],
  );

  const approveDraft = useCallback(
    async (draft: ActionDraft) => {
      if (!draft.assigneeEmail) {
        message.warning("Lütfen bir sahip e-postası girin");
        return;
      }
      if (!draft.suggestedText.trim()) {
        message.warning("Lütfen aksiyon metnini doldurun");
        return;
      }

      updateDraft(draft.groupId, { isSaving: true });

      try {
        const token = await getIdToken();
        if (!token) {
          message.error("Oturum bulunamadı");
          return;
        }

        const res = await fetch(`/api/retros/${retroId}/actions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId: draft.groupId,
            text: draft.suggestedText,
            assigneeEmail: draft.assigneeEmail,
            assigneeName: draft.assigneeName || null,
            deadline: draft.deadline,
            type: draft.type,
          }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(errBody?.error?.message ?? "Aksiyon kaydedilemedi");
        }

        updateDraft(draft.groupId, { isApproved: true, isSaving: false });
        message.success(`"${draft.groupTitle}" aksiyonu onaylandı ✅`);
      } catch (err) {
        updateDraft(draft.groupId, { isSaving: false });
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        message.error(msg);
      }
    },
    [retroId, getIdToken, updateDraft],
  );

  const deleteDraft = useCallback(
    (groupId: string) => {
      updateDraft(groupId, { isDeleted: true });
      message.info("Aksiyon silindi");
    },
    [updateDraft],
  );

  const visibleDrafts = drafts.filter((d) => !d.isDeleted);

  if (!hasGenerated) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <Button
          type="primary"
          size="large"
          icon={<RobotOutlined />}
          loading={isGenerating}
          onClick={generateSuggestions}
          disabled={groups.length === 0}
        >
          Aksiyonları Oluştur
        </Button>
        {groups.length === 0 && (
          <Text
            type="secondary"
            style={{ display: "block", marginTop: 8 }}
          >
            Henüz küme bulunmuyor
          </Text>
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <Spin size="large" />
        <Text
          style={{ display: "block", marginTop: 16 }}
          type="secondary"
        >
          AI aksiyon önerileri oluşturuluyor...
        </Text>
      </div>
    );
  }

  if (visibleDrafts.length === 0) {
    return <Empty description="Tüm aksiyon taslakları silindi veya onaylandı" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Title level={4} style={{ margin: 0 }}>
        🎯 Aksiyon Önerileri
      </Title>

      {visibleDrafts.map((draft) => (
        <Card
          key={draft.groupId}
          size="small"
          title={
            <Space>
              <Tag color="blue">{draft.groupTitle}</Tag>
              <Tag>{draft.votes} oy</Tag>
              {draft.isApproved && <Tag color="success">Onaylandı</Tag>}
            </Space>
          }
          style={{
            opacity: draft.isApproved ? 0.7 : 1,
            borderLeft: draft.isApproved
              ? "4px solid #52c41a"
              : "4px solid #034EA2",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <TextArea
              value={draft.suggestedText}
              onChange={(e) =>
                updateDraft(draft.groupId, {
                  suggestedText: e.target.value,
                })
              }
              placeholder="Aksiyon metnini girin..."
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={draft.isApproved}
              aria-label={`${draft.groupTitle} aksiyon metni`}
            />

            <Space wrap>
              <Input
                placeholder="Sahip e-postası"
                value={draft.assigneeEmail}
                onChange={(e) =>
                  updateDraft(draft.groupId, {
                    assigneeEmail: e.target.value,
                  })
                }
                style={{ width: 220 }}
                disabled={draft.isApproved}
                aria-label="Sahip e-postası"
              />
              <Input
                placeholder="Sahip adı (opsiyonel)"
                value={draft.assigneeName}
                onChange={(e) =>
                  updateDraft(draft.groupId, {
                    assigneeName: e.target.value,
                  })
                }
                style={{ width: 180 }}
                disabled={draft.isApproved}
                aria-label="Sahip adı"
              />
              <DatePicker
                placeholder="Deadline"
                onChange={(_date, dateString) => {
                  const value = Array.isArray(dateString)
                    ? dateString[0]
                    : dateString;
                  updateDraft(draft.groupId, {
                    deadline: value || null,
                  });
                }}
                disabled={draft.isApproved}
                style={{ width: 150 }}
              />
            </Space>

            {!draft.isApproved && (
              <Space>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={draft.isSaving}
                  onClick={() => approveDraft(draft)}
                >
                  Onayla
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteDraft(draft.groupId)}
                >
                  Sil
                </Button>
              </Space>
            )}

            {draft.isApproved && (
              <Text type="success">
                <SendOutlined /> Mail gönderimi tetiklendi
              </Text>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
