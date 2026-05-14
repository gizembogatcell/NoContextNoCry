import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCallAiProxy = vi.fn();
vi.mock("@/services/ai-chat.service", () => ({
  callAiProxy: (...args: unknown[]) => mockCallAiProxy(...args),
}));

const mockListCards = vi.fn();
vi.mock("@/services/retro.service", () => ({
  listCards: (...args: unknown[]) => mockListCards(...args),
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() =>
    Promise.resolve({ collection: vi.fn(() => ({})) }),
  ),
}));

const { groupCardsWithAi, AiGroupingError, AiTimeoutError } = await import(
  "@/services/retro-ai.service"
);

const sampleCards = [
  {
    id: "card-1",
    retroId: "retro-1",
    column: "mad",
    content: "Too many meetings",
    sessionId: "s1",
    groupId: null,
    groupTitle: null,
    createdAt: "2026-05-14T00:00:00.000Z",
  },
  {
    id: "card-2",
    retroId: "retro-1",
    column: "sad",
    content: "Deployments are slow",
    sessionId: "s2",
    groupId: null,
    groupTitle: null,
    createdAt: "2026-05-14T00:01:00.000Z",
  },
  {
    id: "card-3",
    retroId: "retro-1",
    column: "glad",
    content: "Good team spirit",
    sessionId: "s3",
    groupId: null,
    groupTitle: null,
    createdAt: "2026-05-14T00:02:00.000Z",
  },
];

describe("groupCardsWithAi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should group cards using AI response", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockResolvedValue(
      JSON.stringify({
        groups: [
          { title: "Toplantı Sorunları", cardIds: ["card-1"] },
          { title: "Teknik Altyapı", cardIds: ["card-2"] },
          { title: "Takım Kültürü", cardIds: ["card-3"] },
        ],
      }),
    );

    const groups = await groupCardsWithAi("retro-1");

    expect(groups).toHaveLength(3);
    expect(groups[0].title).toBe("Toplantı Sorunları");
    expect(groups[0].cardIds).toEqual(["card-1"]);
    expect(groups[0].voteCount).toBe(0);
    expect(groups[0].retroId).toBe("retro-1");
    expect(groups[0].id).toBeDefined();
  });

  it("should handle markdown-fenced JSON response", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockResolvedValue(
      '```json\n{"groups": [{"title": "Grup A", "cardIds": ["card-1", "card-2"]}]}\n```',
    );

    const groups = await groupCardsWithAi("retro-1");

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Grup A");
    expect(groups[0].cardIds).toEqual(["card-1", "card-2"]);
  });

  it("should filter out invalid card IDs from AI response", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockResolvedValue(
      JSON.stringify({
        groups: [
          { title: "Grup", cardIds: ["card-1", "nonexistent-card"] },
        ],
      }),
    );

    const groups = await groupCardsWithAi("retro-1");

    expect(groups[0].cardIds).toEqual(["card-1"]);
  });

  it("should throw AiGroupingError when no cards exist", async () => {
    mockListCards.mockResolvedValue([]);

    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(AiGroupingError);
    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(
      "No cards to group",
    );
  });

  it("should throw AiGroupingError on invalid JSON response", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockResolvedValue("This is not JSON");

    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(AiGroupingError);
    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(
      "Failed to parse AI response",
    );
  });

  it("should throw AiGroupingError when AI proxy fails", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockRejectedValue(new Error("AI proxy error (500)"));

    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(AiGroupingError);
  });

  it("should throw AiTimeoutError when AI takes too long", async () => {
    mockListCards.mockResolvedValue(sampleCards);
    mockCallAiProxy.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 15_000)),
    );

    await expect(groupCardsWithAi("retro-1")).rejects.toThrow(AiTimeoutError);
  }, 12_000);
});
