"use client";

import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  Alert,
  Button,
  Card,
  Divider,
  Flex,
  Form,
  Input,
  Spin,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";

const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const {
    firebaseConfigured,
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const onGoogle = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Google sign-in failed";
      setError(message);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError(
        "Firebase is not configured. Copy .env.local.example to .env.local.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign-in failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (user) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
        <Card>
          <p>Already signed in.</p>
          <Link href="/dashboard">
            <Button type="primary">Go to dashboard</Button>
          </Link>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", padding: 24 }}
    >
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Sign in
          </Title>
        }
        style={{ width: "100%", maxWidth: 400 }}
      >
        {!firebaseConfigured && (
          <Alert
            type="warning"
            showIcon
            title="Missing Firebase env"
            description="Add NEXT_PUBLIC_FIREBASE_* keys from the Firebase console. See .env.local.example."
            style={{ marginBottom: 16 }}
          />
        )}
        {error && (
          <Alert type="error" title={error} style={{ marginBottom: 16 }} />
        )}
        <Button
          onClick={onGoogle}
          loading={googleSubmitting}
          disabled={!firebaseConfigured}
          block
          style={{ marginBottom: 16 }}
        >
          Continue with Google
        </Button>
        <Divider plain>or</Divider>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Sign in
            </Button>
          </Form.Item>
        </Form>
        <Flex justify="center">
          <Link href="/">Back home</Link>
        </Flex>
      </Card>
    </Flex>
  );
}
