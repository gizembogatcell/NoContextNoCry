"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Result,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type ActionInfo = {
  id: string;
  title: string;
  assigneeName: string | null;
  deadline: string | null;
  status: string;
};

type PageState =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "action"; data: ActionInfo }
  | { kind: "form"; formType: "in_progress" | "failed"; data: ActionInfo }
  | { kind: "success"; actionType: string };

async function submitDone(token: string): Promise<PageState> {
  try {
    const res = await fetch(`/api/actions/magic/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "done" }),
    });

    if (res.ok) {
      return { kind: "success", actionType: "done" };
    }

    const err = (await res.json()) as {
      error?: { message?: string; code?: string };
    };
    return {
      kind: "error",
      code: err?.error?.code ?? "UNKNOWN",
      message: err?.error?.message ?? "Güncelleme başarısız",
    };
  } catch {
    return {
      kind: "error",
      code: "NETWORK",
      message: "Bağlantı hatası oluştu",
    };
  }
}

export default function ActionUpdatePage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;
  const preselectedAction = searchParams.get("action");

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [newDeadline, setNewDeadline] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      try {
        const res = await fetch(`/api/actions/magic/${token}`);
        const body: unknown = await res.json();

        if (!res.ok) {
          const err = body as { error?: { message?: string; code?: string } };
          const code = err?.error?.code ?? "UNKNOWN";
          const msg = err?.error?.message ?? "Bir hata oluştu";
          if (!cancelled) setState({ kind: "error", code, message: msg });
          return;
        }

        const data = (body as { data: ActionInfo }).data;

        if (preselectedAction === "done") {
          const result = await submitDone(token);
          if (!cancelled) setState(result);
          return;
        }

        if (preselectedAction === "in-progress" || preselectedAction === "in_progress") {
          if (!cancelled) setState({ kind: "form", formType: "in_progress", data });
          return;
        }

        if (preselectedAction === "failed") {
          if (!cancelled) setState({ kind: "form", formType: "failed", data });
          return;
        }

        if (!cancelled) setState({ kind: "action", data });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            code: "NETWORK",
            message: "Bağlantı hatası oluştu",
          });
        }
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token, preselectedAction]);

  const handleDone = useCallback(async () => {
    setSubmitting(true);
    const result = await submitDone(token);
    setState(result);
    setSubmitting(false);
  }, [token]);

  const handleInProgress = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/actions/magic/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "in-progress",
          ...(newDeadline ? { deadline: newDeadline } : {}),
        }),
      });

      if (res.ok) {
        setState({ kind: "success", actionType: "in_progress" });
      } else {
        const err = (await res.json()) as {
          error?: { message?: string; code?: string };
        };
        setState({
          kind: "error",
          code: err?.error?.code ?? "UNKNOWN",
          message: err?.error?.message ?? "Güncelleme başarısız",
        });
      }
    } catch {
      setState({
        kind: "error",
        code: "NETWORK",
        message: "Bağlantı hatası oluştu",
      });
    } finally {
      setSubmitting(false);
    }
  }, [token, newDeadline]);

  const handleFailed = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/actions/magic/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "failed",
          ...(failReason ? { failedReason: failReason } : {}),
        }),
      });

      if (res.ok) {
        setState({ kind: "success", actionType: "failed" });
      } else {
        const err = (await res.json()) as {
          error?: { message?: string; code?: string };
        };
        setState({
          kind: "error",
          code: err?.error?.code ?? "UNKNOWN",
          message: err?.error?.message ?? "Güncelleme başarısız",
        });
      }
    } catch {
      setState({
        kind: "error",
        code: "NETWORK",
        message: "Bağlantı hatası oluştu",
      });
    } finally {
      setSubmitting(false);
    }
  }, [token, failReason]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            🚀 RetroFlow
          </Title>
          <Text type="secondary">Aksiyon Durum Güncelleme</Text>
        </div>

        {state.kind === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }} type="secondary">
              Link doğrulanıyor...
            </Paragraph>
          </div>
        )}

        {state.kind === "error" && (
          <Result
            status={
              state.code === "TOKEN_EXPIRED"
                ? "warning"
                : state.code === "TOKEN_USED"
                  ? "info"
                  : "error"
            }
            title={
              state.code === "TOKEN_EXPIRED"
                ? "Link Süresi Doldu ⏰"
                : state.code === "TOKEN_USED"
                  ? "Bu Link Zaten Kullanıldı 🔒"
                  : "Hata"
            }
            subTitle={state.message}
          />
        )}

        {state.kind === "action" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              size="small"
              style={{
                background: "#f1f5f9",
                borderLeft: "4px solid #6366f1",
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                📋 Aksiyon
              </Text>
              <Title level={5} style={{ margin: "4px 0 0" }}>
                {state.data.title}
              </Title>
              {state.data.deadline && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  📅 Deadline: {state.data.deadline}
                </Text>
              )}
            </Card>

            <Paragraph style={{ textAlign: "center", margin: 0 }}>
              Bu aksiyonun durumunu güncelle:
            </Paragraph>

            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Button
                type="primary"
                block
                size="large"
                icon={<CheckCircleOutlined />}
                loading={submitting}
                onClick={handleDone}
                style={{ background: "#22c55e", borderColor: "#22c55e" }}
              >
                ✅ Tamamladım
              </Button>
              <Button
                block
                size="large"
                icon={<SyncOutlined />}
                onClick={() =>
                  setState({
                    kind: "form",
                    formType: "in_progress",
                    data: state.data,
                  })
                }
                style={{
                  background: "#f59e0b",
                  borderColor: "#f59e0b",
                  color: "#fff",
                }}
              >
                🔄 Devam Ediyor
              </Button>
              <Button
                danger
                block
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() =>
                  setState({
                    kind: "form",
                    formType: "failed",
                    data: state.data,
                  })
                }
              >
                ❌ Yapılamadı
              </Button>
            </Space>
          </div>
        )}

        {state.kind === "form" && state.formType === "in_progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              🔄 Yeni Deadline Seç
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              <strong>{state.data.title}</strong> aksiyonu için yeni bir deadline
              belirle.
            </Paragraph>
            <DatePicker
              placeholder="Yeni deadline seç"
              onChange={(_date, dateString) => {
                const value = Array.isArray(dateString) ? dateString[0] : dateString;
                setNewDeadline(value ? new Date(value).toISOString() : null);
              }}
              style={{ width: "100%" }}
              size="large"
            />
            <Space>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleInProgress}
                size="large"
              >
                Güncelle
              </Button>
              <Button
                onClick={() =>
                  setState({ kind: "action", data: state.data })
                }
                size="large"
              >
                Geri
              </Button>
            </Space>
          </div>
        )}

        {state.kind === "form" && state.formType === "failed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              ❌ Yapılamadı — Sebep
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              <strong>{state.data.title}</strong> aksiyonu neden yapılamadı?
            </Paragraph>
            <TextArea
              placeholder="Kısa bir açıklama yaz..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              aria-label="Başarısızlık sebebi"
            />
            <Space>
              <Button
                danger
                type="primary"
                loading={submitting}
                onClick={handleFailed}
                size="large"
              >
                Kaydet
              </Button>
              <Button
                onClick={() =>
                  setState({ kind: "action", data: state.data })
                }
                size="large"
              >
                Geri
              </Button>
            </Space>
          </div>
        )}

        {state.kind === "success" && (
          <Result
            status="success"
            title={
              state.actionType === "done"
                ? "Tebrikler! 🎉"
                : state.actionType === "in_progress"
                  ? "Güncellendi! 🔄"
                  : "Kaydedildi 📝"
            }
            subTitle={
              state.actionType === "done"
                ? "Aksiyon başarıyla tamamlandı olarak işaretlendi. Harika iş!"
                : state.actionType === "in_progress"
                  ? "Yeni deadline kaydedildi. Devam et, başarıyorsun! 💪"
                  : "Durum kaydedildi. Bu aksiyon bir sonraki retroya taşınacak."
            }
          />
        )}
      </Card>
    </div>
  );
}
