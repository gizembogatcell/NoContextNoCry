export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  uid: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};
