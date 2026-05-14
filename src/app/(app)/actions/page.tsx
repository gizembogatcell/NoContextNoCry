"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Flex,
  message,
  Select,
  Spin,
  Table,
  Tabs,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { useAuth } from "@/hooks/use-auth";
import type { Action, ActionStatus } from "@/types/action";

const { Title } = Typography;

type TabKey = "all" | "open" | "done" | "failed";

const STATUS_OPTIONS = [
  { value: "open", label: "⏳ Açık" },
  { value: "done", label: "✅ Tamamlandı" },
  { value: "in_progress", label: "🔄 Devam Ediyor" },
  { value: "failed", label: "❌ Başarısız" },
];

export default function ActionsPage() {
  const { getIdToken } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchActions() {
      try {
        const token = await getIdToken();
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }

        const res = await fetch("/api/actions/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body: unknown = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          const err = body as { error?: { message?: string } };
          setError(err?.error?.message ?? "Aksiyonlar alınamadı");
          return;
        }

        const data = (body as {
          data: { done: Action[]; open: Action[]; failed: Action[] };
        }).data;
        setActions([...data.open, ...data.failed, ...data.done]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Bağlantı hatası");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchActions();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  const handleStatusChange = useCallback(
    async (actionId: string, newStatus: ActionStatus) => {
      try {
        const token = await getIdToken();
        if (!token) {
          message.error("Oturum bulunamadı");
          return;
        }

        const res = await fetch(`/api/actions/${actionId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(errBody?.error?.message ?? "Güncelleme başarısız");
        }

        setActions((prev) =>
          prev.map((a) =>
            a.id === actionId ? { ...a, status: newStatus } : a,
          ),
        );
        message.success("Durum güncellendi");
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Güncelleme başarısız",
        );
      }
    },
    [getIdToken],
  );

  const filteredActions =
    activeTab === "all"
      ? actions
      : actions.filter((a) => {
          if (activeTab === "open") return a.status === "open" || a.status === "in_progress";
          return a.status === activeTab;
        });

  const columns: ColumnsType<Action> = [
    {
      title: "Aksiyon",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Sahip",
      key: "assignee",
      width: 180,
      render: (_, record) => record.assigneeName ?? record.assigneeEmail,
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: 130,
      render: (val: string | null) => val ?? "—",
    },
    {
      title: "Durum",
      key: "status",
      width: 180,
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(val) => handleStatusChange(record.id, val)}
          options={STATUS_OPTIONS}
          style={{ width: 160 }}
          size="small"
          aria-label="Durum değiştir"
        />
      ),
    },
  ];

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex style={{ padding: 24 }}>
        <Alert type="error" message={error} showIcon />
      </Flex>
    );
  }

  return (
    <Flex vertical gap="middle" style={{ padding: 24 }}>
      <Title level={3} style={{ margin: 0 }}>
        📋 Aksiyonlar
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={[
          {
            key: "all",
            label: `Tümü (${actions.length})`,
          },
          {
            key: "open",
            label: `Açık (${actions.filter((a) => a.status === "open" || a.status === "in_progress").length})`,
          },
          {
            key: "done",
            label: `Tamamlandı (${actions.filter((a) => a.status === "done").length})`,
          },
          {
            key: "failed",
            label: `Başarısız (${actions.filter((a) => a.status === "failed").length})`,
          },
        ]}
      />

      <Table
        dataSource={filteredActions}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: "Henüz aksiyon yok" }}
      />
    </Flex>
  );
}
