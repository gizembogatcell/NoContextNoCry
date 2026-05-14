"use client";

import { Col, Row, Typography } from "antd";
import {
  FrownOutlined,
  MehOutlined,
  SmileOutlined,
} from "@ant-design/icons";

import type { Card, CardColumn, RetroPhase } from "@/types/retro";
import { CardList } from "./card-list";
import { AddCardForm } from "./add-card-form";

const { Title } = Typography;

const COLUMNS: Array<{
  key: CardColumn;
  title: string;
  color: string;
  icon: React.ReactNode;
}> = [
  { key: "mad", title: "Mad", color: "#ff4d4f", icon: <FrownOutlined /> },
  { key: "sad", title: "Sad", color: "#1677ff", icon: <MehOutlined /> },
  { key: "glad", title: "Glad", color: "#52c41a", icon: <SmileOutlined /> },
];

type ColumnLayoutProps = {
  retroId: string;
  cards: Card[];
  phase: RetroPhase;
  sessionId: string;
  timerStarted: boolean;
  getIdToken: () => Promise<string | null>;
  onCardAdded: () => void;
  onVoteToggled: () => void;
};

export function ColumnLayout({
  retroId,
  cards,
  phase,
  sessionId,
  timerStarted,
  getIdToken,
  onCardAdded,
  onVoteToggled,
}: ColumnLayoutProps) {
  const canAddCards = phase === "write" && timerStarted;

  return (
    <Row gutter={16}>
      {COLUMNS.map((col) => (
        <Col key={col.key} xs={24} md={8}>
          <div
            style={{
              background: "var(--ant-color-bg-container)",
              borderRadius: 8,
              padding: 16,
              minHeight: 300,
              borderTop: `3px solid ${col.color}`,
            }}
          >
            <Title
              level={5}
              style={{ color: col.color, marginBottom: 12 }}
            >
              {col.icon} {col.title}
            </Title>

            <CardList
              cards={cards}
              column={col.key}
              phase={phase}
              sessionId={sessionId}
              retroId={retroId}
              getIdToken={getIdToken}
              onVoteToggled={onVoteToggled}
            />

            {canAddCards && (
              <AddCardForm
                retroId={retroId}
                column={col.key}
                sessionId={sessionId}
                getIdToken={getIdToken}
                onCardAdded={onCardAdded}
              />
            )}
          </div>
        </Col>
      ))}
    </Row>
  );
}
