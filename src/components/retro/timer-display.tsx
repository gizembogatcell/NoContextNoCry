"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Statistic, Typography } from "antd";
import { ClockCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";

const { Countdown } = Statistic;
const { Text } = Typography;

type TimerDisplayProps = {
  timerEndsAt: string | null;
  timerMinutes: number;
  isModerator: boolean;
  isWritePhase: boolean;
  onStartTimer: () => void;
  onEndPhase: () => void;
  loading?: boolean;
};

function computeExpired(timerEndsAt: string | null): boolean {
  if (!timerEndsAt) return false;
  return new Date(timerEndsAt).getTime() - Date.now() <= 0;
}

export function TimerDisplay({
  timerEndsAt,
  timerMinutes,
  isModerator,
  isWritePhase,
  onStartTimer,
  onEndPhase,
  loading = false,
}: TimerDisplayProps) {
  const [isExpired, setIsExpired] = useState(() => computeExpired(timerEndsAt));

  useEffect(() => {
    if (!timerEndsAt) return;

    const interval = setInterval(() => {
      setIsExpired(computeExpired(timerEndsAt));
    }, 1_000);

    return () => clearInterval(interval);
  }, [timerEndsAt]);

  if (!isWritePhase) return null;

  if (!timerEndsAt) {
    return (
      <Flex align="center" gap="middle" style={{ marginBottom: 16 }}>
        <ClockCircleOutlined style={{ fontSize: 20 }} />
        <Text>Süre: {timerMinutes} dakika</Text>
        {isModerator && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onStartTimer}
            loading={loading}
          >
            Timer Başlat
          </Button>
        )}
      </Flex>
    );
  }

  if (isExpired) {
    return (
      <Flex align="center" gap="middle" style={{ marginBottom: 16 }}>
        <Text type="danger" strong>
          Süre doldu!
        </Text>
      </Flex>
    );
  }

  const deadline = new Date(timerEndsAt).getTime();

  return (
    <Flex align="center" gap="middle" style={{ marginBottom: 16 }}>
      <ClockCircleOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
      <Countdown
        value={deadline}
        format="mm:ss"
        valueStyle={{ fontSize: 20, fontWeight: 600 }}
      />
      {isModerator && (
        <Button danger onClick={onEndPhase} loading={loading}>
          Aşamayı Bitir
        </Button>
      )}
    </Flex>
  );
}
