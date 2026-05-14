import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCallAiProxy = vi.fn();
vi.mock("@/services/ai-chat.service", () => ({
  callAiProxy: (...args: unknown[]) => mockCallAiProxy(...args),
}));

const mockCardAggregate = vi.fn();
const mockVotesAggregate = vi.fn();
const mockCardFind = vi.fn();
const mockRetroFind = vi.fn();
const mockDistinct = vi.fn();

const mockCollectionMap: Record<string, unknown> = {
  cards: {
    aggregate: mockCardAggregate,
    find: mockCardFind,
    distinct: mockDistinct,
  },
  retros: {
    find: mockRetroFind,
  },
  votes: {
    aggregate: mockVotesAggregate,
  },
};

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() =>
    Promise.resolve({
      collection: (name: string) => mockCollectionMap[name],
    }),
  ),
}));

const { generateActionSuggestions, getCardGroups } = await import(
  "@/services/retro-ai.service"
);

describe("retro-ai.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCardGroups", () => {
    it("should aggregate grouped cards with vote counts from votes collection", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "group-1", groupTitle: "Deployment" },
          { _id: "group-2", groupTitle: "Communication" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "group-1", count: 8 },
          { _id: "group-2", count: 5 },
        ]),
      });

      const groups = await getCardGroups("retro-1");
      expect(groups).toHaveLength(2);
      expect(groups[0].groupId).toBe("group-1");
      expect(groups[0].groupTitle).toBe("Deployment");
      expect(groups[0].votes).toBe(8);
      expect(groups[1].votes).toBe(5);
    });

    it("should return 0 votes when no votes exist for a group", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "group-1", groupTitle: "Topic A" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const groups = await getCardGroups("retro-1");
      expect(groups).toHaveLength(1);
      expect(groups[0].votes).toBe(0);
    });

    it("should return empty array when no groups", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const groups = await getCardGroups("retro-empty");
      expect(groups).toHaveLength(0);
    });
  });

  describe("generateActionSuggestions", () => {
    it("should return suggestions for each group", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", groupTitle: "Test Coverage" },
          { _id: "g2", groupTitle: "Code Reviews" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", count: 6 },
          { _id: "g2", count: 3 },
        ]),
      });

      mockRetroFind.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      mockCallAiProxy
        .mockResolvedValueOnce("Test coverage'ı artırmak için otomasyon kur")
        .mockResolvedValueOnce("Haftalık code review rotasyonu başlat");

      const suggestions = await generateActionSuggestions("retro-1", "user-1");

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].groupId).toBe("g1");
      expect(suggestions[0].suggestedText).toBe(
        "Test coverage'ı artırmak için otomasyon kur",
      );
      expect(suggestions[1].groupId).toBe("g2");
      expect(suggestions[1].suggestedText).toBe(
        "Haftalık code review rotasyonu başlat",
      );
    });

    it("should return empty suggestedText when AI fails for a group", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", groupTitle: "Deployment" },
          { _id: "g2", groupTitle: "Onboarding" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", count: 4 },
          { _id: "g2", count: 2 },
        ]),
      });

      mockRetroFind.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      mockCallAiProxy
        .mockRejectedValueOnce(new Error("AI proxy error"))
        .mockResolvedValueOnce("Yeni katılımcılar için onboarding dokümanı hazırla");

      const suggestions = await generateActionSuggestions("retro-1", "user-1");

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].suggestedText).toBe("");
      expect(suggestions[1].suggestedText).toBe(
        "Yeni katılımcılar için onboarding dokümanı hazırla",
      );
    });

    it("should return empty array when no card groups exist", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const suggestions = await generateActionSuggestions("retro-1", "user-1");
      expect(suggestions).toHaveLength(0);
      expect(mockCallAiProxy).not.toHaveBeenCalled();
    });

    it("should pass repeat count in AI prompt when groups repeat", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", groupTitle: "Deployment" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", count: 4 },
        ]),
      });

      mockRetroFind.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ _id: "old-retro-1" }, { _id: "old-retro-2" }]),
        }),
      });

      mockDistinct.mockResolvedValue(["old-retro-1"]);

      mockCallAiProxy.mockResolvedValueOnce("CI/CD pipeline iyileştir");

      const suggestions = await generateActionSuggestions("retro-1", "user-1");

      expect(suggestions).toHaveLength(1);
      const promptCall = mockCallAiProxy.mock.calls[0][0];
      expect(promptCall[0].content).toContain("tekrar sayısı=1");
    });

    it("should handle all AI calls failing gracefully", async () => {
      mockCardAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", groupTitle: "Topic A" },
          { _id: "g2", groupTitle: "Topic B" },
        ]),
      });
      mockVotesAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g1", count: 3 },
          { _id: "g2", count: 1 },
        ]),
      });

      mockRetroFind.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      mockCallAiProxy.mockRejectedValue(new Error("Service down"));

      const suggestions = await generateActionSuggestions("retro-1", "user-1");

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].suggestedText).toBe("");
      expect(suggestions[1].suggestedText).toBe("");
    });
  });
});
