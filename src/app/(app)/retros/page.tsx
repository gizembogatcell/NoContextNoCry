"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Empty,
  Flex,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ClockCircleOutlined } from "@ant-design/icons";

import { useAuth } from "@/hooks/use-auth";
import type { Retro, RetroPhase } from "@/types/retro";

const { Title, Text } = Typography;

const PHASE_LABELS: Record<RetroPhase, { label: string; color: string }> = {
  write: { label: "Yazma", color: "processing" },
  vote: { label: "Oylama", color: "warning" },
  actions: { label: "Aksiyonlar", color: "success" },
  closed: { label: "Kapandı", color: "default" },
};

export default function RetrosListPage() {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [retros, setRetros] = useState<Retro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRetros = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch("/api/retros", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Retrolar yüklenemedi");

      const body = await res.json() as { data: Retro[] };
      setRetros(body.data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    const timerId = setTimeout(fetchRetros, 0);
    return () => clearTimeout(timerId);
  }, [fetchRetros]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div style={{ padding: "24px 24px 48px" }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Retrolarım
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/retros/new")}
        >
          Yeni Retro
        </Button>
      </Flex>

      {retros.length === 0 ? (
        <Empty description="Henüz retro oluşturmadınız">
          <Button
            type="primary"
            onClick={() => router.push("/retros/new")}
          >
            İlk Retronu Oluştur
          </Button>
        </Empty>
      ) : (
        <Flex vertical gap="middle">
          {retros.map((retro) => {
            const phaseInfo = PHASE_LABELS[retro.phase];
            return (
              <Card
                key={retro.id}
                hoverable
                onClick={() => router.push(`/retros/${retro.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ fontSize: 16 }}>
                      {retro.title}
                    </Text>
                    <Text type="secondary">
                      <ClockCircleOutlined /> {retro.timerMinutes} dk |{" "}
                      {new Date(retro.createdAt).toLocaleDateString("tr-TR")}
                    </Text>
                  </Flex>
                  <Tag color={phaseInfo.color}>{phaseInfo.label}</Tag>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </div>
  );
}
