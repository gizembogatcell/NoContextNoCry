export type RetroPhase = "write" | "vote" | "actions" | "closed";

export type Retro = {
  id: string;
  title: string;
  phase: RetroPhase;
  votesPerUser: number;
  timerMinutes: number;
  timerEndsAt: string | null;
  createdBy: string;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardColumn = "mad" | "sad" | "glad";

export type Card = {
  id: string;
  retroId: string;
  column: CardColumn;
  content: string;
  sessionId: string;
  groupId: string | null;
  groupTitle: string | null;
  createdAt: string;
};

export type NoteGroup = {
  id: string;
  retroId: string;
  title: string;
  cardIds: string[];
  voteCount: number;
};

export type Vote = {
  id: string;
  retroId: string;
  groupId: string;
  sessionId: string;
  createdAt: string;
};

export const PHASE_ORDER: readonly RetroPhase[] = [
  "write",
  "vote",
  "actions",
  "closed",
] as const;
