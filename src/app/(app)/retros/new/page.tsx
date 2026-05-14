"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Input,
  InputNumber,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, WarningOutlined } from "@ant-design/icons";

import { useAuth } from "@/hooks/use-auth";
import type { Action } from "@/types/action";

const { Title, Paragraph, Text } = Typography;

type FormValues = {
  title: string;
  timerMinutes: number;
  votesPerUser: number;
  sendSummaryMail: boolean;
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  open: { color: "processing", label: "Açık" },
  in_progress: { color: "warning", label: "Devam Ediyor" },
  failed: { color: "error", label: "Başarısız" },
};

export default function NewRetroPage() {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [carryOverActions, setCarryOverActions] = useState<Action[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCarryOver() {
      try {
        const token = await getIdToken();
        if (!token) return;

        const res = await fetch("/api/actions/carry-over", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok || cancelled) return;

        const body = (await res.json()) as { data: Action[] };
        if (!cancelled) setCarryOverActions(body.data);
      } catch {
        // non-critical, silently ignore
      }
    }

    fetchCarryOver();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) {
        message.error("Oturum bulunamadı");
        return;
      }

      const res = await fetch("/api/retros", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(body?.error?.message ?? "Retro oluşturulamadı");
      }

      const body = (await res.json()) as { data: { id: string } };
      message.success("Retro oluşturuldu!");
      router.push(`/retros/${body.data.id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex justify="center" style={{ padding: "40px 24px" }}>
      <Flex vertical gap="middle" style={{ maxWidth: 520, width: "100%" }}>
        {carryOverActions.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={`Geçen retrodan ${carryOverActions.length} aksiyon hâlâ açık`}
            description={
              <Flex vertical gap="small" style={{ marginTop: 8 }}>
                {carryOverActions.map((action) => {
                  const cfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.open;
                  return (
                    <Flex
                      key={action.id}
                      justify="space-between"
                      align="center"
                      gap="small"
                    >
                      <Text style={{ fontSize: 13 }}>
                        {action.title}
                        {action.assigneeName && (
                          <Text type="secondary"> — {action.assigneeName}</Text>
                        )}
                      </Text>
                      <Tag color={cfg.color}>{cfg.label}</Tag>
                    </Flex>
                  );
                })}
              </Flex>
            }
          />
        )}

        <Card>
          <Title level={3}>Yeni Retro Oluştur</Title>
          <Paragraph type="secondary">
            Retrospektif oturumunuz için bir ad ve süre belirleyin.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              timerMinutes: 5,
              votesPerUser: 3,
              sendSummaryMail: true,
            }}
          >
            <Form.Item
              name="title"
              label="Retro Adı"
              rules={[
                { required: true, message: "Retro adı gereklidir" },
                { max: 200, message: "En fazla 200 karakter" },
              ]}
            >
              <Input placeholder="Sprint 42 Retrospektifi" autoFocus />
            </Form.Item>

            <Form.Item
              name="timerMinutes"
              label="Yazma Süresi (dakika)"
              rules={[{ required: true, message: "Süre gereklidir" }]}
            >
              <InputNumber min={1} max={60} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="votesPerUser"
              label="Kişi Başı Oy Hakkı"
              rules={[{ required: true, message: "Oy hakkı gereklidir" }]}
            >
              <InputNumber min={1} max={10} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="sendSummaryMail" valuePropName="checked">
              <Checkbox>Ekibe Özet Maili Gönder</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={submitting}
                block
              >
                Retro Oluştur
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Flex>
    </Flex>
  );
}
