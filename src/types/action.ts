export type ActionStatus = "open" | "done" | "in_progress" | "failed";

export type ActionType = "mail" | "jira";

export type Action = {
  _id: string;
  retroId: string;
  cardId: string | null;
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
  jiraTicketUrl: string | null;
  jiraTicketId: string | null;
  jiraError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActionSuggestion = {
  groupId: string;
  groupTitle: string;
  voteCount: number;
  suggestedAction: string;
};
