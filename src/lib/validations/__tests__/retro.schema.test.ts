import { describe, expect, it } from "vitest";

import {
  createRetroSchema,
  addCardSchema,
  updatePhaseSchema,
} from "@/lib/validations/retro.schema";

describe("createRetroSchema", () => {
  it("should accept valid retro creation input", () => {
    const result = createRetroSchema.safeParse({
      title: "Sprint 42 Retro",
      timerMinutes: 5,
      votesPerUser: 3,
    });
    expect(result.success).toBe(true);
  });

  it("should default votesPerUser to 3", () => {
    const result = createRetroSchema.safeParse({
      title: "Sprint 42 Retro",
      timerMinutes: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.votesPerUser).toBe(3);
    }
  });

  it("should reject empty title", () => {
    const result = createRetroSchema.safeParse({
      title: "",
      timerMinutes: 5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject timerMinutes below 1", () => {
    const result = createRetroSchema.safeParse({
      title: "Retro",
      timerMinutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject timerMinutes above 60", () => {
    const result = createRetroSchema.safeParse({
      title: "Retro",
      timerMinutes: 61,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer timerMinutes", () => {
    const result = createRetroSchema.safeParse({
      title: "Retro",
      timerMinutes: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject votesPerUser above 20", () => {
    const result = createRetroSchema.safeParse({
      title: "Retro",
      timerMinutes: 5,
      votesPerUser: 21,
    });
    expect(result.success).toBe(false);
  });
});

describe("addCardSchema", () => {
  it("should accept valid card input", () => {
    const result = addCardSchema.safeParse({
      column: "mad",
      content: "Too many meetings",
      sessionId: "abc-123",
    });
    expect(result.success).toBe(true);
  });

  it("should accept all column types", () => {
    for (const column of ["mad", "sad", "glad"]) {
      const result = addCardSchema.safeParse({
        column,
        content: "Some feedback",
        sessionId: "abc-123",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid column", () => {
    const result = addCardSchema.safeParse({
      column: "angry",
      content: "Some feedback",
      sessionId: "abc-123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty content", () => {
    const result = addCardSchema.safeParse({
      column: "mad",
      content: "",
      sessionId: "abc-123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing sessionId", () => {
    const result = addCardSchema.safeParse({
      column: "mad",
      content: "Something",
    });
    expect(result.success).toBe(false);
  });

  it("should reject content over 2000 chars", () => {
    const result = addCardSchema.safeParse({
      column: "glad",
      content: "a".repeat(2001),
      sessionId: "abc-123",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePhaseSchema", () => {
  it("should accept valid phases", () => {
    for (const phase of ["write", "vote", "actions", "closed"]) {
      const result = updatePhaseSchema.safeParse({ phase });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid phase", () => {
    const result = updatePhaseSchema.safeParse({ phase: "writing" });
    expect(result.success).toBe(false);
  });

  it("should reject empty object", () => {
    const result = updatePhaseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
