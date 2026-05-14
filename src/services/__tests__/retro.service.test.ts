import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Retro } from "@/types/retro";

vi.mock("server-only", () => ({}));

const mockInsertOne = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockCreateIndex = vi.fn();

const mockCollection = vi.fn(() => ({
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  find: mockFind,
  findOneAndUpdate: mockFindOneAndUpdate,
  createIndex: mockCreateIndex,
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() => Promise.resolve({ collection: mockCollection })),
}));

const {
  createRetro,
  listRetrosByUser,
  getRetroById,
  updatePhase,
  startTimer,
  checkTimerExpiry,
  addCard,
  listCards,
  PhaseTransitionError,
  ForbiddenError,
  CardWriteError,
} = await import("@/services/retro.service");

function makeRetroDoc(overrides: Partial<Retro> = {}) {
  return {
    _id: "retro-1",
    title: "Sprint 42",
    phase: "write" as const,
    votesPerUser: 3,
    timerMinutes: 5,
    timerEndsAt: null,
    createdBy: "user-1",
    teamId: null,
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("retro.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRetro", () => {
    it("should create a retro with write phase", async () => {
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const retro = await createRetro("user-1", {
        title: "Sprint 42",
        timerMinutes: 5,
        votesPerUser: 3,
      });

      expect(retro.title).toBe("Sprint 42");
      expect(retro.phase).toBe("write");
      expect(retro.timerMinutes).toBe(5);
      expect(retro.votesPerUser).toBe(3);
      expect(retro.createdBy).toBe("user-1");
      expect(retro.timerEndsAt).toBeNull();
      expect(retro.id).toBeDefined();
      expect(mockInsertOne).toHaveBeenCalledOnce();
    });
  });

  describe("listRetrosByUser", () => {
    it("should return retros for a given user", async () => {
      const docs = [makeRetroDoc(), makeRetroDoc({ _id: "retro-2" } as never)];
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(docs),
          }),
        }),
      });

      const retros = await listRetrosByUser("user-1");
      expect(retros).toHaveLength(2);
      expect(retros[0].id).toBe("retro-1");
    });
  });

  describe("getRetroById", () => {
    it("should return retro when found", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      const retro = await getRetroById("retro-1");
      expect(retro).not.toBeNull();
      expect(retro!.id).toBe("retro-1");
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);
      const retro = await getRetroById("nonexistent");
      expect(retro).toBeNull();
    });
  });

  describe("updatePhase", () => {
    it("should transition write → vote", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      const updatedDoc = makeRetroDoc({
        phase: "vote",
        timerEndsAt: null,
      } as never);
      mockFindOneAndUpdate.mockResolvedValue(updatedDoc);

      const retro = await updatePhase("retro-1", "user-1", "vote");
      expect(retro.phase).toBe("vote");
    });

    it("should reject non-forward transition", async () => {
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ phase: "vote" } as never),
      );

      await expect(
        updatePhase("retro-1", "user-1", "write"),
      ).rejects.toThrow(PhaseTransitionError);
    });

    it("should reject skip transition (write → actions)", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());

      await expect(
        updatePhase("retro-1", "user-1", "actions"),
      ).rejects.toThrow(PhaseTransitionError);
    });

    it("should reject non-moderator", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());

      await expect(
        updatePhase("retro-1", "other-user", "vote"),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("startTimer", () => {
    it("should set timerEndsAt in write phase", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      const timerEndsAt = new Date(Date.now() + 5 * 60_000).toISOString();
      mockFindOneAndUpdate.mockResolvedValue(
        makeRetroDoc({ timerEndsAt } as never),
      );

      const retro = await startTimer("retro-1", "user-1");
      expect(retro.timerEndsAt).toBeTruthy();
    });

    it("should reject starting timer in non-write phase", async () => {
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ phase: "vote" } as never),
      );

      await expect(startTimer("retro-1", "user-1")).rejects.toThrow(
        PhaseTransitionError,
      );
    });

    it("should reject non-moderator starting timer", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());

      await expect(startTimer("retro-1", "other-user")).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("checkTimerExpiry", () => {
    it("should auto-transition to vote when timer expired", async () => {
      const pastTime = new Date(Date.now() - 60_000).toISOString();
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ timerEndsAt: pastTime } as never),
      );
      const updatedDoc = makeRetroDoc({
        phase: "vote",
        timerEndsAt: null,
      } as never);
      mockFindOneAndUpdate.mockResolvedValue(updatedDoc);

      const retro = await checkTimerExpiry("retro-1");
      expect(retro!.phase).toBe("vote");
      expect(mockFindOneAndUpdate).toHaveBeenCalled();
    });

    it("should not transition when timer still running", async () => {
      const futureTime = new Date(Date.now() + 60_000).toISOString();
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ timerEndsAt: futureTime } as never),
      );

      const retro = await checkTimerExpiry("retro-1");
      expect(retro!.phase).toBe("write");
      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should return null when retro not found", async () => {
      mockFindOne.mockResolvedValue(null);
      const retro = await checkTimerExpiry("nonexistent");
      expect(retro).toBeNull();
    });
  });

  describe("addCard", () => {
    it("should add a card during write phase", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const card = await addCard("retro-1", {
        column: "mad",
        content: "Too many meetings",
        sessionId: "session-1",
      });

      expect(card.column).toBe("mad");
      expect(card.content).toBe("Too many meetings");
      expect(card.sessionId).toBe("session-1");
      expect(card.retroId).toBe("retro-1");
      expect(card.id).toBeDefined();
    });

    it("should reject card during vote phase", async () => {
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ phase: "vote" } as never),
      );

      await expect(
        addCard("retro-1", {
          column: "glad",
          content: "Good vibes",
          sessionId: "session-1",
        }),
      ).rejects.toThrow(CardWriteError);
    });

    it("should reject card when retro not found", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        addCard("nonexistent", {
          column: "sad",
          content: "Missing retro",
          sessionId: "session-1",
        }),
      ).rejects.toThrow(CardWriteError);
    });
  });

  describe("listCards", () => {
    it("should return only session cards during write phase", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      const sessionCards = [
        {
          _id: "card-1",
          retroId: "retro-1",
          column: "mad",
          content: "My card",
          sessionId: "session-1",
          groupId: null,
          groupTitle: null,
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ];
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(sessionCards),
        }),
      });

      const cards = await listCards("retro-1", "session-1");
      expect(cards).toHaveLength(1);
      expect(cards[0].sessionId).toBe("session-1");
    });

    it("should return empty when no sessionId in write phase", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      const cards = await listCards("retro-1");
      expect(cards).toHaveLength(0);
    });

    it("should return all cards during vote phase", async () => {
      mockFindOne.mockResolvedValue(
        makeRetroDoc({ phase: "vote" } as never),
      );
      const allCards = [
        {
          _id: "card-1",
          retroId: "retro-1",
          column: "mad",
          content: "Card A",
          sessionId: "session-1",
          groupId: null,
          groupTitle: null,
          createdAt: "2026-05-14T00:00:00.000Z",
        },
        {
          _id: "card-2",
          retroId: "retro-1",
          column: "glad",
          content: "Card B",
          sessionId: "session-2",
          groupId: null,
          groupTitle: null,
          createdAt: "2026-05-14T00:01:00.000Z",
        },
      ];
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(allCards),
        }),
      });

      const cards = await listCards("retro-1", "session-1");
      expect(cards).toHaveLength(2);
    });
  });
});
