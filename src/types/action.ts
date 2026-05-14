export type ActionStatus = "open" | "done" | "in_progress" | "failed";
export type ActionType = "mail";

export type Action = {
  id: string;
  retroId: string;
  groupId: string | null;
  title: string;
  assigneeEmail: string;
  assigneeName: string | null;
  deadline: string | null;
  type: ActionType;
  status: ActionStatus;
  mailSentAt: string | null;
  magicToken: string | null;
  magicTokenExpiresAt: string | null;
  magicTokenUsed: boolean;
  failedReason: string | null;
  nextRetroCarryOver: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActionSuggestion = {
  groupId: string;
  groupTitle: string;
  votes: number;
  suggestedText: string;
};
