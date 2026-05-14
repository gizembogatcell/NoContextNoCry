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

const { getActionStatsByRetro } = await import("@/services/action.service");

function makeActionDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "action-1",
    retroId: "retro-1",
    groupId: "group-1",
    title: "Default action",
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
    ...overrides,
  };
}

describe("getActionStatsByRetro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should aggregate action counts correctly", async () => {
    const docs = [
      makeActionDoc({ _id: "a1", status: "done", title: "Done task" }),
      makeActionDoc({ _id: "a2", status: "done", title: "Done task 2" }),
      makeActionDoc({ _id: "a3", status: "open", title: "Open task" }),
      makeActionDoc({ _id: "a4", status: "in_progress", title: "In progress task" }),
      makeActionDoc({ _id: "a5", status: "failed", title: "Failed task" }),
    ];
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(docs),
      }),
    });

    const stats = await getActionStatsByRetro("retro-1");

    expect(stats.completedCount).toBe(2);
    expect(stats.openCount).toBe(2);
    expect(stats.failedCount).toBe(1);
    expect(stats.openActions).toHaveLength(2);
  });

  it("should include open and in_progress actions in openActions", async () => {
    const docs = [
      makeActionDoc({ _id: "a1", status: "open", title: "Task A" }),
      makeActionDoc({ _id: "a2", status: "in_progress", title: "Task B" }),
      makeActionDoc({ _id: "a3", status: "done", title: "Task C" }),
    ];
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(docs),
      }),
    });

    const stats = await getActionStatsByRetro("retro-1");

    const titles = stats.openActions.map((a) => a.title);
    expect(titles).toContain("Task A");
    expect(titles).toContain("Task B");
    expect(titles).not.toContain("Task C");
  });

  it("should return zero counts when no actions exist", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    });

    const stats = await getActionStatsByRetro("retro-empty");

    expect(stats.completedCount).toBe(0);
    expect(stats.openCount).toBe(0);
    expect(stats.failedCount).toBe(0);
    expect(stats.openActions).toHaveLength(0);
  });

  it("should count all-done scenario correctly", async () => {
    const docs = [
      makeActionDoc({ _id: "a1", status: "done" }),
      makeActionDoc({ _id: "a2", status: "done" }),
    ];
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(docs),
      }),
    });

    const stats = await getActionStatsByRetro("retro-1");

    expect(stats.completedCount).toBe(2);
    expect(stats.openCount).toBe(0);
    expect(stats.failedCount).toBe(0);
    expect(stats.openActions).toHaveLength(0);
  });
});
