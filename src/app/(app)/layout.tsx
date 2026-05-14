"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Flex, Spin } from "antd";

import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/hooks/use-auth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    signOut().catch(console.error);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader email={user.email} onSignOut={handleSignOut} />
      {children}
    </div>
  );
}
