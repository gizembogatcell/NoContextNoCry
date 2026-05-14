import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockInsertOne = vi.fn();
const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockCreateIndex = vi.fn();

const mockCollection = vi.fn(() => ({
  insertOne: mockInsertOne,
  find: mockFind,
  findOne: mockFindOne,
  createIndex: mockCreateIndex,
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() => Promise.resolve({ collection: mockCollection })),
}));

const { createAction, listActionsByRetro, getActionByToken, ensureActionIndexes } =
  await import("@/services/action.service");

describe("action.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAction", () => {
    it("should create an action with magicToken", async () => {
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const action = await createAction("retro-1", {
        groupId: "group-1",
        text: "Deploy monitoring dashboard",
        assigneeEmail: "dev@team.com",
        type: "mail",
      });

      expect(action.retroId).toBe("retro-1");
      expect(action.title).toBe("Deploy monitoring dashboard");
      expect(action.assigneeEmail).toBe("dev@team.com");
      expect(action.type).toBe("mail");
      expect(action.status).toBe("open");
      expect(action.magicToken).toBeTruthy();
      expect(action.magicTokenExpiresAt).toBeTruthy();
      expect(action.magicTokenUsed).toBe(false);
      expect(action.id).toBeDefined();
      expect(mockInsertOne).toHaveBeenCalledOnce();
    });

    it("should set magicTokenExpiresAt to ~48h from now", async () => {
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const before = Date.now();
      const action = await createAction("retro-1", {
        groupId: "group-1",
        text: "Fix flaky tests",
        assigneeEmail: "dev@team.com",
        type: "jira",
      });
      const after = Date.now();

      const expiresAt = new Date(action.magicTokenExpiresAt!).getTime();
      const fortyEightHours = 48 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + fortyEightHours - 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + fortyEightHours + 1000);
    });

    it("should handle optional fields", async () => {
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const action = await createAction("retro-1", {
        groupId: "group-1",
        text: "Review PR backlog",
        assigneeEmail: "dev@team.com",
        assigneeName: "Ali",
        deadline: "2026-06-01T00:00:00.000Z",
        type: "mail",
      });

      expect(action.assigneeName).toBe("Ali");
      expect(action.deadline).toBe("2026-06-01T00:00:00.000Z");
    });

    it("should default nullable fields to null", async () => {
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const action = await createAction("retro-1", {
        groupId: "group-1",
        text: "Set up CI",
        assigneeEmail: "dev@team.com",
        type: "mail",
      });

      expect(action.assigneeName).toBeNull();
      expect(action.deadline).toBeNull();
      expect(action.mailSentAt).toBeNull();
      expect(action.failedReason).toBeNull();
      expect(action.jiraTicketUrl).toBeNull();
      expect(action.jiraTicketId).toBeNull();
      expect(action.jiraError).toBeNull();
    });
  });

  describe("listActionsByRetro", () => {
    it("should return actions for a retro", async () => {
      const docs = [
        {
          _id: "action-1",
          retroId: "retro-1",
          groupId: "group-1",
          title: "Fix tests",
          assigneeEmail: "dev@team.com",
          assigneeName: null,
          deadline: null,
          type: "mail",
          status: "open",
          mailSentAt: null,
          magicToken: "tok-1",
          magicTokenExpiresAt: "2026-05-16T00:00:00.000Z",
          magicTokenUsed: false,
          failedReason: null,
          nextRetroCarryOver: false,
          jiraTicketUrl: null,
          jiraTicketId: null,
          jiraError: null,
          createdAt: "2026-05-14T00:00:00.000Z",
          updatedAt: "2026-05-14T00:00:00.000Z",
        },
      ];
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(docs),
        }),
      });

      const actions = await listActionsByRetro("retro-1");
      expect(actions).toHaveLength(1);
      expect(actions[0].id).toBe("action-1");
      expect(actions[0].title).toBe("Fix tests");
    });

    it("should return empty array when no actions", async () => {
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      const actions = await listActionsByRetro("retro-empty");
      expect(actions).toHaveLength(0);
    });
  });

  describe("getActionByToken", () => {
    it("should return action when token matches", async () => {
      mockFindOne.mockResolvedValue({
        _id: "action-1",
        retroId: "retro-1",
        groupId: "group-1",
        title: "Fix tests",
        assigneeEmail: "dev@team.com",
        assigneeName: null,
        deadline: null,
        type: "mail",
        status: "open",
        mailSentAt: null,
        magicToken: "valid-token",
        magicTokenExpiresAt: "2026-05-16T00:00:00.000Z",
        magicTokenUsed: false,
        failedReason: null,
        nextRetroCarryOver: false,
        jiraTicketUrl: null,
        jiraTicketId: null,
        jiraError: null,
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z",
      });

      const action = await getActionByToken("valid-token");
      expect(action).not.toBeNull();
      expect(action!.magicToken).toBe("valid-token");
    });

    it("should return null when token not found", async () => {
      mockFindOne.mockResolvedValue(null);
      const action = await getActionByToken("invalid-token");
      expect(action).toBeNull();
    });
  });

  describe("ensureActionIndexes", () => {
    it("should create indexes without error", async () => {
      mockCreateIndex.mockResolvedValue("ok");
      await expect(ensureActionIndexes()).resolves.toBeUndefined();
      expect(mockCreateIndex).toHaveBeenCalledTimes(3);
    });
  });
});
