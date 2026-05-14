import { describe, expect, it } from "vitest";
import { createActionSchema } from "@/lib/validations/action.schema";

describe("createActionSchema", () => {
  const validInput = {
    groupId: "group-1",
    text: "Deploy monitoring dashboard",
    assigneeEmail: "dev@team.com",
    type: "mail" as const,
  };

  it("should accept valid input with required fields only", () => {
    const result = createActionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should accept valid input with all optional fields", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      assigneeName: "Ali",
      deadline: "2026-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty groupId", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      groupId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty text", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      text: "",
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

  it("should accept type jira", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      type: "jira",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid deadline format", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      deadline: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("should accept null deadline", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      deadline: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept null assigneeName", () => {
    const result = createActionSchema.safeParse({
      ...validInput,
      assigneeName: null,
    });
    expect(result.success).toBe(true);
  });
});
