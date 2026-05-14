import { describe, expect, it } from "vitest";

import {
  upsertUserSchema,
  userProfileSchema,
  userProfileResponseSchema,
} from "@/lib/validations/user.schema";

describe("upsertUserSchema", () => {
  it("should accept valid partial update", () => {
    const result = upsertUserSchema.safeParse({
      displayName: "Alice",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null displayName", () => {
    const result = upsertUserSchema.safeParse({
      displayName: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty displayName", () => {
    const result = upsertUserSchema.safeParse({
      displayName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid photoURL", () => {
    const result = upsertUserSchema.safeParse({
      photoURL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid photoURL", () => {
    const result = upsertUserSchema.safeParse({
      photoURL: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = upsertUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("userProfileSchema", () => {
  const validProfile = {
    uid: "abc123",
    email: "alice@example.com",
    displayName: "Alice",
    photoURL: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  };

  it("should accept a valid profile", () => {
    const result = userProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("should reject profile missing uid", () => {
    const noUid = {
      email: validProfile.email,
      displayName: validProfile.displayName,
      photoURL: validProfile.photoURL,
      createdAt: validProfile.createdAt,
      updatedAt: validProfile.updatedAt,
    };
    const result = userProfileSchema.safeParse(noUid);
    expect(result.success).toBe(false);
  });

  it("should accept null email", () => {
    const result = userProfileSchema.safeParse({
      ...validProfile,
      email: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing timestamps", () => {
    const noTimestamps = {
      uid: validProfile.uid,
      email: validProfile.email,
      displayName: validProfile.displayName,
      photoURL: validProfile.photoURL,
    };
    const result = userProfileSchema.safeParse(noTimestamps);
    expect(result.success).toBe(false);
  });
});

describe("userProfileResponseSchema", () => {
  it("should accept wrapped profile response", () => {
    const result = userProfileResponseSchema.safeParse({
      data: {
        uid: "abc123",
        email: "alice@example.com",
        displayName: "Alice",
        photoURL: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject response without data wrapper", () => {
    const result = userProfileResponseSchema.safeParse({
      uid: "abc123",
      email: "alice@example.com",
    });
    expect(result.success).toBe(false);
  });
});
