import { describe, expect, it } from "vitest";

import {
  createActionSchema,
  updateActionSchema,
  suggestActionsSchema,
} from "@/lib/validations/action.schema";

describe("createActionSchema", () => {
  const validInput = {
    retroId: "retro-1",
    title: "CI/CD pipeline'ını iyileştir",
    assigneeEmail: "dev@example.com",
    type: "mail" as const,
  };

  it("should accept valid minimal input", () => {
    const result = createActionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should accept full input with all optional fields", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      cardId: "card-1",
      assigneeName: "Ahmet",
      deadline: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing title", () => {
    const result = createActionSchema.safeParse({
      retroId: "retro-1",
      assigneeEmail: "dev@example.com",
      type: "mail",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      assigneeEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid type", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      type: "slack",
    });
    expect(result.success).toBe(false);
  });

  it("should default cardId to null", () => {
    const result = createActionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cardId).toBeNull();
    }
  });

  it("should reject empty retroId", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      retroId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateActionSchema", () => {
  it("should accept valid status update", () => {
    const result = updateActionSchema.safeParse({ status: "done" });
    expect(result.success).toBe(true);
  });

  it("should accept valid deadline update", () => {
    const result = updateActionSchema.safeParse({
      deadline: "2026-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (partial update)", () => {
    const result = updateActionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = updateActionSchema.safeParse({ status: "unknown" });
    expect(result.success).toBe(false);
  });

  it("should accept null deadline", () => {
    const result = updateActionSchema.safeParse({ deadline: null });
    expect(result.success).toBe(true);
  });

  it("should accept title update", () => {
    const result = updateActionSchema.safeParse({
      title: "Güncellenmiş başlık",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = updateActionSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("suggestActionsSchema", () => {
  it("should accept valid groups", () => {
    const result = suggestActionsSchema.safeParse({
      groups: [
        { groupId: "g1", title: "CI sorunları", cardIds: ["c1", "c2"] },
        { groupId: "g2", title: "İletişim", cardIds: ["c3"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty groups array", () => {
    const result = suggestActionsSchema.safeParse({ groups: [] });
    expect(result.success).toBe(true);
  });

  it("should reject group without title", () => {
    const result = suggestActionsSchema.safeParse({
      groups: [{ groupId: "g1", cardIds: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing groups field", () => {
    const result = suggestActionsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
