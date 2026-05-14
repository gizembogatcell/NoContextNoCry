export type RetroPhase = "write" | "vote" | "actions" | "closed";

export type CardColumn = "mad" | "sad" | "glad";

export type Retro = {
  _id: string;
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

export type Card = {
  _id: string;
  retroId: string;
  column: CardColumn;
  content: string;
  sessionId: string;
  votes: number;
  votedBy: string[];
  groupId: string | null;
  groupTitle: string | null;
  createdAt: string;
};

export type AiGroup = {
  groupId: string;
  title: string;
  cardIds: string[];
};
