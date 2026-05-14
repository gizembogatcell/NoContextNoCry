"use client";

import { useState } from "react";
import { Button, Input, Flex, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import type { CardColumn } from "@/types/retro";

const { TextArea } = Input;

type AddCardFormProps = {
  retroId: string;
  column: CardColumn;
  sessionId: string;
  disabled?: boolean;
  getIdToken: () => Promise<string | null>;
  onCardAdded: () => void;
};

export function AddCardForm({
  retroId,
  column,
  sessionId,
  disabled = false,
  getIdToken,
  onCardAdded,
}: AddCardFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/retros/${retroId}/cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ column, content: trimmed, sessionId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Not eklenemedi");
      }

      setContent("");
      onCardAdded();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex vertical gap="small" style={{ marginTop: 8 }}>
      <TextArea
        placeholder="Not ekle..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled}
        autoSize={{ minRows: 2, maxRows: 4 }}
        maxLength={1000}
        onPressEnter={(e) => {
          if (e.shiftKey) return;
          e.preventDefault();
          handleSubmit();
        }}
      />
      <Button
        type="primary"
        size="small"
        icon={<PlusOutlined />}
        onClick={handleSubmit}
        loading={submitting}
        disabled={disabled || !content.trim()}
      >
        Ekle
      </Button>
    </Flex>
  );
}
