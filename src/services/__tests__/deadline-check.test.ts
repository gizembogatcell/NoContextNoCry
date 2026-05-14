import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFind = vi.fn();
const mockUpdateOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();

const mockCollection = vi.fn(() => ({
  find: mockFind,
  findOne: vi.fn(),
  updateOne: mockUpdateOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  createIndex: vi.fn(),
  insertOne: vi.fn(),
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() => Promise.resolve({ collection: mockCollection })),
}));

const { getActionsDueToday, updateActionByMagicToken } = await import(
  "@/services/action.service"
);

function makeActionDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "action-1",
    retroId: "retro-1",
    groupId: "group-1",
    title: "Fix flaky tests",
    assigneeEmail: "dev@team.com",
    assigneeName: "Ali",
    deadline: new Date().toISOString(),
    type: "mail",
    status: "open",
    mailSentAt: null,
    magicToken: "tok-abc-123",
    magicTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
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

describe("getActionsDueToday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return open actions with deadline today", async () => {
    const docs = [makeActionDoc()];
    mockFind.mockReturnValue({ toArray: vi.fn().mockResolvedValue(docs) });

    const actions = await getActionsDueToday();
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe("action-1");
    expect(actions[0].status).toBe("open");
  });

  it("should return empty array when no actions are due", async () => {
    mockFind.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

    const actions = await getActionsDueToday();
    expect(actions).toHaveLength(0);
  });

  it("should query with status open, mailSentAt null, and deadline within today", async () => {
    mockFind.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

    await getActionsDueToday();

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "open",
        mailSentAt: null,
        deadline: expect.objectContaining({
          $gte: expect.any(String),
          $lte: expect.any(String),
        }),
      }),
    );
  });
});

describe("updateActionByMagicToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update action to done and mark token as used", async () => {
    const updatedDoc = makeActionDoc({
      status: "done",
      magicTokenUsed: true,
    });
    mockFindOneAndUpdate.mockResolvedValue(updatedDoc);

    const result = await updateActionByMagicToken("tok-abc-123", {
      status: "done",
      magicTokenUsed: true,
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe("done");
    expect(result!.magicTokenUsed).toBe(true);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { magicToken: "tok-abc-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "done",
          magicTokenUsed: true,
        }),
      }),
      { returnDocument: "after" },
    );
  });

  it("should update action to failed with reason and carry-over flag", async () => {
    const updatedDoc = makeActionDoc({
      status: "failed",
      magicTokenUsed: true,
      failedReason: "Kaynak yetersiz",
      nextRetroCarryOver: true,
    });
    mockFindOneAndUpdate.mockResolvedValue(updatedDoc);

    const result = await updateActionByMagicToken("tok-abc-123", {
      status: "failed",
      magicTokenUsed: true,
      failedReason: "Kaynak yetersiz",
      nextRetroCarryOver: true,
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe("failed");
    expect(result!.failedReason).toBe("Kaynak yetersiz");
    expect(result!.nextRetroCarryOver).toBe(true);
  });

  it("should update deadline for in-progress action", async () => {
    const newDeadline = "2026-06-01T00:00:00.000Z";
    const updatedDoc = makeActionDoc({
      status: "open",
      magicTokenUsed: true,
      deadline: newDeadline,
    });
    mockFindOneAndUpdate.mockResolvedValue(updatedDoc);

    const result = await updateActionByMagicToken("tok-abc-123", {
      status: "open",
      magicTokenUsed: true,
      deadline: newDeadline,
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe("open");
    expect(result!.deadline).toBe(newDeadline);
  });

  it("should return null when token not found", async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);

    const result = await updateActionByMagicToken("non-existent", {
      status: "done",
      magicTokenUsed: true,
    });

    expect(result).toBeNull();
  });
});
