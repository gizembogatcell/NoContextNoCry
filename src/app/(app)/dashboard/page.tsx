"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import { useAuth } from "@/hooks/use-auth";
import type { Action } from "@/types/action";

const { Title, Text } = Typography;

type SummaryData = {
  done: Action[];
  open: Action[];
  failed: Action[];
  stats: { done: number; open: number; failed: number };
};

const STATUS_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  done: { color: "success", label: "Tamamlandı", emoji: "✅" },
  open: { color: "processing", label: "Açık", emoji: "⏳" },
  in_progress: { color: "warning", label: "Devam Ediyor", emoji: "🔄" },
  failed: { color: "error", label: "Başarısız", emoji: "❌" },
};

export default function DashboardPage() {
  const { getIdToken } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
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
          setError(err?.error?.message ?? "Özet alınamadı");
          return;
        }

        const data = (body as { data: SummaryData }).data;
        setSummary(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Bağlantı hatası");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex vertical gap="middle" style={{ padding: 24 }}>
        <Alert type="error" message={error} showIcon />
      </Flex>
    );
  }

  const isEmpty =
    !summary ||
    (summary.stats.done === 0 &&
      summary.stats.open === 0 &&
      summary.stats.failed === 0);

  return (
    <Flex vertical gap="large" style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap="small">
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Flex gap="small">
          <Link href="/retros/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Yeni Retro Başlat
            </Button>
          </Link>
          <Link href="/retros">
            <Button icon={<UnorderedListOutlined />}>Retrolarım</Button>
          </Link>
        </Flex>
      </Flex>

      {isEmpty ? (
        <Card>
          <Empty
            description={
              <Flex vertical align="center" gap="small">
                <Text type="secondary" style={{ fontSize: 16 }}>
                  Henüz retro yok — ilk retroyu oluştur
                </Text>
                <Link href="/retros/new">
                  <Button type="primary" icon={<PlusOutlined />} size="large">
                    İlk Retroyu Oluştur
                  </Button>
                </Link>
              </Flex>
            }
          />
        </Card>
      ) : (
        <>
          <Title level={4} style={{ margin: 0 }}>
            📊 Son Retro Özeti
          </Title>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Tamamlandı"
                  value={summary!.stats.done}
                  prefix={<CheckCircleOutlined style={{ color: "#22c55e" }} />}
                  valueStyle={{ color: "#22c55e" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Açık"
                  value={summary!.stats.open}
                  prefix={<ClockCircleOutlined style={{ color: "#f59e0b" }} />}
                  valueStyle={{ color: "#f59e0b" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Başarısız"
                  value={summary!.stats.failed}
                  prefix={<CloseCircleOutlined style={{ color: "#ef4444" }} />}
                  valueStyle={{ color: "#ef4444" }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Aksiyonlar">
            <Flex vertical gap="small">
              {[
                ...summary!.open,
                ...summary!.failed,
                ...summary!.done,
              ].map((action) => {
                const cfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.open;
                return (
                  <Flex
                    key={action.id}
                    justify="space-between"
                    align="center"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#f8fafc",
                    }}
                    wrap="wrap"
                    gap="small"
                  >
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 200 }}>
                      <Text strong>{action.title}</Text>
                      <Flex gap="small" wrap="wrap">
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          👤 {action.assigneeName ?? action.assigneeEmail}
                        </Text>
                        {action.deadline && (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            📅 {action.deadline}
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                    <Tag color={cfg.color}>
                      {cfg.emoji} {cfg.label}
                    </Tag>
                  </Flex>
                );
              })}
            </Flex>
          </Card>

          <Flex justify="center">
            <Link href="/actions">
              <Button type="link" size="large">
                Tüm Aksiyonları Gör →
              </Button>
            </Link>
          </Flex>
        </>
      )}
    </Flex>
  );
}
