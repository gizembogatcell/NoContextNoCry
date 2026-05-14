"use client";

import { Button, Flex, Steps } from "antd";

import type { RetroPhase } from "@/types/retro";

const PHASE_STEPS = [
  { title: "Yazma", key: "write" as const },
  { title: "Oylama", key: "vote" as const },
  { title: "Aksiyonlar", key: "actions" as const },
  { title: "Kapandı", key: "closed" as const },
];

const PHASE_INDEX: Record<RetroPhase, number> = {
  write: 0,
  vote: 1,
  actions: 2,
  closed: 3,
};

const NEXT_PHASE: Partial<Record<RetroPhase, RetroPhase>> = {
  write: "vote",
  vote: "actions",
  actions: "closed",
};

type PhaseBarProps = {
  phase: RetroPhase;
  isModerator: boolean;
  onNextPhase: (nextPhase: RetroPhase) => void;
  loading?: boolean;
};

export function PhaseBar({
  phase,
  isModerator,
  onNextPhase,
  loading = false,
}: PhaseBarProps) {
  const currentIndex = PHASE_INDEX[phase];
  const nextPhase = NEXT_PHASE[phase];

  const buttonLabels: Partial<Record<RetroPhase, string>> = {
    vote: "Aşamayı Bitir → Oylama",
    actions: "Oylama Kapat → Aksiyonlar",
    closed: "Retroyu Kapat",
  };

  return (
    <Flex vertical gap="middle" style={{ marginBottom: 24 }}>
      <Steps
        current={currentIndex}
        items={PHASE_STEPS.map((step) => ({ title: step.title }))}
        size="small"
      />
      {isModerator && nextPhase && (
        <Flex justify="flex-end">
          <Button
            type="primary"
            onClick={() => onNextPhase(nextPhase)}
            loading={loading}
          >
            {buttonLabels[nextPhase] ?? "Sonraki Aşama"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
