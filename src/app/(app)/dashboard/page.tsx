"use client";

import { Alert, Card, Flex, Spin, Typography } from "antd";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { userProfileResponseSchema } from "@/lib/validations/user.schema";
import type { UserProfile } from "@/types/user";

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const { getIdToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const token = await getIdToken();
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }

        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body: unknown = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          const msg =
            body &&
            typeof body === "object" &&
            "error" in body &&
            body.error &&
            typeof body.error === "object" &&
            "message" in body.error
              ? String(body.error.message)
              : "Request failed";
          setError(msg);
          return;
        }

        const parsed = userProfileResponseSchema.safeParse(body);
        if (!parsed.success) {
          setError("Unexpected response format");
          return;
        }
        setProfile(parsed.data.data);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Request failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  return (
    <Flex vertical gap="small" style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Title>
      <Paragraph>
        This route is behind the client auth guard in{" "}
        <code>(app)/layout.tsx</code>. The profile below is fetched from{" "}
        <code>/api/users/me</code> (Firebase-verified, MongoDB-backed).
      </Paragraph>
      <Card title="Your MongoDB profile">
        <ProfileContent loading={loading} error={error} profile={profile} />
      </Card>
    </Flex>
  );
}

type ProfileContentProps = {
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
};

function ProfileContent({ loading, error, profile }: ProfileContentProps) {
  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;
  if (profile) {
    return (
      <pre style={{ margin: 0 }}>{JSON.stringify(profile, null, 2)}</pre>
    );
  }
  return (
    <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
      Not signed in.
    </Typography.Paragraph>
  );
}
