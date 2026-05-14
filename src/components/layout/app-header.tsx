"use client";

import Link from "next/link";
import { Button, Flex, Typography, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";

import { useTheme } from "@/contexts/theme-context";

const { Title, Paragraph } = Typography;

type AppHeaderProps = {
  email: string | null;
  onSignOut: () => void;
};

export function AppHeader({ email, onSignOut }: AppHeaderProps) {
  const { isDark, toggleColorScheme } = useTheme();

  return (
    <Flex
      justify="space-between"
      align="center"
      component="header"
      style={{
        padding: "12px 24px",
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Flex align="center" gap="large">
        <Link href="/dashboard">
          <Title level={5} style={{ margin: 0 }}>
            RetroFlow
          </Title>
        </Link>
        <Flex gap="small">
          <Link href="/retros">
            <Button type="text" size="small">
              Retrolar
            </Button>
          </Link>
          <Link href="/actions">
            <Button type="text" size="small">
              Aksiyonlar
            </Button>
          </Link>
        </Flex>
      </Flex>

      <Flex gap="small" align="center">
        <Paragraph style={{ margin: 0 }} type="secondary" ellipsis>
          {email}
        </Paragraph>

        <Tooltip title={isDark ? "Açık mod" : "Koyu mod"}>
          <Button
            type="text"
            size="small"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleColorScheme}
            aria-label={isDark ? "Açık moda geç" : "Koyu moda geç"}
          />
        </Tooltip>

        <Button size="small" onClick={onSignOut}>
          Çıkış
        </Button>
      </Flex>
    </Flex>
  );
}
