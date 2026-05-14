"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { useAuth } from "@/hooks/use-auth";

const { Title, Paragraph } = Typography;

type FormValues = {
  title: string;
  timerMinutes: number;
  votesPerUser: number;
};

export default function NewRetroPage() {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();

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
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Retro oluşturulamadı");
      }

      const body = await res.json() as { data: { _id: string } };
      message.success("Retro oluşturuldu!");
      router.push(`/retros/${body.data._id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex justify="center" style={{ padding: "40px 24px" }}>
      <Card style={{ maxWidth: 520, width: "100%" }}>
        <Title level={3}>Yeni Retro Oluştur</Title>
        <Paragraph type="secondary">
          Retrospektif oturumunuz için bir ad ve süre belirleyin.
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ timerMinutes: 5, votesPerUser: 3 }}
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
  );
}
