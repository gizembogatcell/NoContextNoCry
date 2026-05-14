import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();

const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  createIndex: vi.fn(),
  insertOne: vi.fn(),
  find: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("@/lib/mongodb/client", () => ({
  getDb: vi.fn(() => Promise.resolve({ collection: mockCollection })),
}));

const { isMagicTokenExpired } = await import("@/lib/magic-token");
const { getActionByToken } = await import("@/services/action.service");
const { magicLinkActionSchema } = await import(
  "@/lib/validations/action.schema"
);

function makeActionDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "action-1",
    retroId: "retro-1",
    groupId: "group-1",
    title: "Deploy monitoring",
    assigneeEmail: "dev@team.com",
    assigneeName: "Ali",
    deadline: "2026-05-14T00:00:00.000Z",
    type: "mail",
    status: "open",
    mailSentAt: null,
    magicToken: "valid-token-uuid",
    magicTokenExpiresAt: new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    ).toISOString(),
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

describe("magic token validation", () => {
  describe("isMagicTokenExpired", () => {
    it("should return false for a token expiring in the future", () => {
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(isMagicTokenExpired(futureDate)).toBe(false);
    });

    it("should return true for a token that has already expired", () => {
      const pastDate = new Date(
        Date.now() - 1 * 60 * 60 * 1000,
      ).toISOString();
      expect(isMagicTokenExpired(pastDate)).toBe(true);
    });

    it("should return true for a token expiring right now", () => {
      const now = new Date(Date.now() - 1).toISOString();
      expect(isMagicTokenExpired(now)).toBe(true);
    });
  });

  describe("getActionByToken", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should find an action by its magic token", async () => {
      mockFindOne.mockResolvedValue(makeActionDoc());

      const action = await getActionByToken("valid-token-uuid");
      expect(action).not.toBeNull();
      expect(action!.magicToken).toBe("valid-token-uuid");
      expect(action!.id).toBe("action-1");
    });

    it("should return null for invalid token", async () => {
      mockFindOne.mockResolvedValue(null);

      const action = await getActionByToken("bogus-token");
      expect(action).toBeNull();
    });
  });

  describe("token state checks", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should detect a used token", async () => {
      mockFindOne.mockResolvedValue(
        makeActionDoc({ magicTokenUsed: true }),
      );

      const action = await getActionByToken("used-token");
      expect(action).not.toBeNull();
      expect(action!.magicTokenUsed).toBe(true);
    });

    it("should detect an expired token", async () => {
      const expiredDate = new Date(
        Date.now() - 1 * 60 * 60 * 1000,
      ).toISOString();
      mockFindOne.mockResolvedValue(
        makeActionDoc({ magicTokenExpiresAt: expiredDate }),
      );

      const action = await getActionByToken("expired-token");
      expect(action).not.toBeNull();
      expect(
        isMagicTokenExpired(action!.magicTokenExpiresAt!),
      ).toBe(true);
    });

    it("should accept a valid, unused, non-expired token", async () => {
      mockFindOne.mockResolvedValue(makeActionDoc());

      const action = await getActionByToken("valid-token-uuid");
      expect(action).not.toBeNull();
      expect(action!.magicTokenUsed).toBe(false);
      expect(
        isMagicTokenExpired(action!.magicTokenExpiresAt!),
      ).toBe(false);
    });
  });
});

describe("magicLinkActionSchema", () => {
  it("should accept valid done action", () => {
    const result = magicLinkActionSchema.safeParse({ action: "done" });
    expect(result.success).toBe(true);
  });

  it("should accept valid in-progress action", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "in-progress",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid failed action with reason", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "failed",
      failedReason: "Kaynak yetersiz",
    });
    expect(result.success).toBe(true);
  });

  it("should accept in-progress with new deadline", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "in-progress",
      deadline: "2026-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid action type", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing action field", () => {
    const result = magicLinkActionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject invalid deadline format", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "in-progress",
      deadline: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty failedReason", () => {
    const result = magicLinkActionSchema.safeParse({
      action: "failed",
      failedReason: "",
    });
    expect(result.success).toBe(false);
  });
});
