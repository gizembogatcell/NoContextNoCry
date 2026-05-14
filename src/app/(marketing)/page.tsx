"use client";

import Link from "next/link";
import { Button, Flex, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function MarketingHomePage() {
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap="large"
      style={{ minHeight: "100vh", padding: 24 }}
    >
      <Title level={1} style={{ margin: 0, textAlign: "center" }}>
        AI Hackathon Template
      </Title>
      <Paragraph
        type="secondary"
        style={{ maxWidth: 480, textAlign: "center" }}
      >
        Next.js App Router, Ant Design, and client-first Firebase Auth. See{" "}
        <code>AGENTS.md</code> and <code>README.md</code> for Cursor and stack
        conventions.
      </Paragraph>
      <Flex gap="small" wrap="wrap" justify="center">
        <Link href="/login">
          <Button type="primary">Sign in</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Dashboard (protected)</Button>
        </Link>
      </Flex>
    </Flex>
  );
}
