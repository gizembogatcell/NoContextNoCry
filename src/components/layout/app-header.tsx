"use client";

import Link from "next/link";
import { Button, Flex, Typography } from "antd";

const { Title, Paragraph } = Typography;

type AppHeaderProps = {
  email: string | null;
  onSignOut: () => void;
};

export function AppHeader({ email, onSignOut }: AppHeaderProps) {
  return (
    <Flex
      justify="space-between"
      align="center"
      component="header"
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Link href="/">
        <Title level={5} style={{ margin: 0 }}>
          Hackathon app
        </Title>
      </Link>
      <Flex gap="small" align="center">
        <Paragraph style={{ margin: 0 }} type="secondary" ellipsis>
          {email}
        </Paragraph>
        <Button size="small" onClick={onSignOut}>
          Sign out
        </Button>
      </Flex>
    </Flex>
  );
}
