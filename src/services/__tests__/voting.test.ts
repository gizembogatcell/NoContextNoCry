import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Retro } from "@/types/retro";

vi.mock("server-only", () => ({}));

const mockInsertOne = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockCreateIndex = vi.fn();
const mockCountDocuments = vi.fn();
const mockBulkWrite = vi.fn();
const mockUpdateMany = vi.fn();
const mockAggregate = vi.fn();

const mockCollection = vi.fn(() => ({
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  find: mockFind,
  findOneAndUpdate: mockFindOneAndUpdate,
  createIndex: mockCreateIndex,
  countDocuments: mockCountDocuments,
  bulkWrite: mockBulkWrite,
  updateMany: mockUpdateMany,
  aggregate: mockAggregate,
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() => Promise.resolve({ collection: mockCollection })),
}));

const {
  castVote,
  getVotesBySession,
  getGroups,
  saveGroups,
  VoteError,
} = await import("@/services/retro.service");

function makeRetroDoc(overrides: Partial<Retro> = {}) {
  return {
    _id: "retro-1",
    title: "Sprint 42",
    phase: "vote" as const,
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

describe("voting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("castVote", () => {
    it("should record a vote during vote phase", async () => {
      mockFindOne
        .mockResolvedValueOnce(makeRetroDoc())
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: "card-1", retroId: "retro-1", groupId: "group-1" });
      mockCountDocuments.mockResolvedValue(0);
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const vote = await castVote("retro-1", "group-1", "session-1");

      expect(vote.retroId).toBe("retro-1");
      expect(vote.groupId).toBe("group-1");
      expect(vote.sessionId).toBe("session-1");
      expect(vote.id).toBeDefined();
      expect(mockInsertOne).toHaveBeenCalledOnce();
    });

    it("should reject voting when not in vote phase", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc({ phase: "write" } as never));

      await expect(
        castVote("retro-1", "group-1", "session-1"),
      ).rejects.toThrow(VoteError);
      await expect(
        castVote("retro-1", "group-1", "session-1"),
      ).rejects.toThrow("only allowed during the vote phase");
    });

    it("should reject when max votes exceeded", async () => {
      mockFindOne
        .mockResolvedValueOnce(makeRetroDoc())
        .mockResolvedValueOnce(null);
      mockCountDocuments.mockResolvedValue(3);

      await expect(
        castVote("retro-1", "group-1", "session-1"),
      ).rejects.toThrow(VoteError);
    });

    it("should reject when retro not found", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        castVote("nonexistent", "group-1", "session-1"),
      ).rejects.toThrow(VoteError);
      await expect(
        castVote("nonexistent", "group-1", "session-1"),
      ).rejects.toThrow("Retro not found");
    });

    it("should reject when group does not exist", async () => {
      mockFindOne
        .mockResolvedValueOnce(makeRetroDoc())
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockCountDocuments.mockResolvedValue(0);

      await expect(
        castVote("retro-1", "nonexistent-group", "session-1"),
      ).rejects.toThrow("Group does not exist");
    });

    it("should reject duplicate vote on the same group", async () => {
      mockFindOne
        .mockResolvedValueOnce(makeRetroDoc())
        .mockResolvedValueOnce({ _id: "vote-existing", retroId: "retro-1", groupId: "group-1", sessionId: "session-1" });

      await expect(
        castVote("retro-1", "group-1", "session-1"),
      ).rejects.toThrow("You have already voted for this group");
    });
  });

  describe("getVotesBySession", () => {
    it("should return votes used and remaining", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      mockCountDocuments.mockResolvedValue(2);

      const result = await getVotesBySession("retro-1", "session-1");

      expect(result.votesUsed).toBe(2);
      expect(result.votesRemaining).toBe(1);
    });

    it("should return 0 remaining when all votes used", async () => {
      mockFindOne.mockResolvedValue(makeRetroDoc());
      mockCountDocuments.mockResolvedValue(3);

      const result = await getVotesBySession("retro-1", "session-1");

      expect(result.votesUsed).toBe(3);
      expect(result.votesRemaining).toBe(0);
    });

    it("should throw when retro not found", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        getVotesBySession("nonexistent", "session-1"),
      ).rejects.toThrow(VoteError);
    });
  });

  describe("getGroups", () => {
    it("should return groups sorted by vote count", async () => {
      mockFind.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "card-1", retroId: "retro-1", groupId: "g1", groupTitle: "Group A" },
          { _id: "card-2", retroId: "retro-1", groupId: "g1", groupTitle: "Group A" },
          { _id: "card-3", retroId: "retro-1", groupId: "g2", groupTitle: "Group B" },
        ]),
      });
      mockAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: "g2", count: 5 },
          { _id: "g1", count: 2 },
        ]),
      });

      const groups = await getGroups("retro-1");

      expect(groups).toHaveLength(2);
      expect(groups[0].id).toBe("g2");
      expect(groups[0].voteCount).toBe(5);
      expect(groups[1].id).toBe("g1");
      expect(groups[1].voteCount).toBe(2);
      expect(groups[1].cardIds).toEqual(["card-1", "card-2"]);
    });

    it("should return empty array when no grouped cards", async () => {
      mockFind.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });
      mockAggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const groups = await getGroups("retro-1");
      expect(groups).toHaveLength(0);
    });
  });

  describe("saveGroups", () => {
    it("should reset all cards then assign groups", async () => {
      mockUpdateMany.mockResolvedValue({ modifiedCount: 3 });
      mockBulkWrite.mockResolvedValue({ ok: 1 });

      await saveGroups("retro-1", [
        { id: "g1", title: "Group A", cardIds: ["card-1", "card-2"] },
        { id: "g2", title: "Group B", cardIds: ["card-3"] },
      ]);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { retroId: "retro-1" },
        { $set: { groupId: null, groupTitle: null } },
      );
      expect(mockBulkWrite).toHaveBeenCalledOnce();
    });
  });
});
