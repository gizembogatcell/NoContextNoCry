import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateMagicToken, isMagicTokenExpired } from "@/lib/magic-token";

describe("generateMagicToken", () => {
  it("should return a token and expiresAt", () => {
    const result = generateMagicToken();
    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(0);
    expect(result.expiresAt).toBeDefined();
  });

  it("should generate 64-char hex tokens", () => {
    const { token } = generateMagicToken();
    const hexRegex = /^[0-9a-f]{64}$/;
    expect(token).toMatch(hexRegex);
  });

  it("should set expiry 48 hours in the future", () => {
    const before = Date.now();
    const { expiresAt } = generateMagicToken();
    const after = Date.now();
    const expiryMs = new Date(expiresAt).getTime();
    const expectedMs = 48 * 60 * 60 * 1000;

    expect(expiryMs).toBeGreaterThanOrEqual(before + expectedMs - 100);
    expect(expiryMs).toBeLessThanOrEqual(after + expectedMs + 100);
  });

  it("should generate unique tokens", () => {
    const tokens = new Set(
      Array.from({ length: 10 }, () => generateMagicToken().token),
    );
    expect(tokens.size).toBe(10);
  });
});

describe("isMagicTokenExpired", () => {
  it("should return false for future date", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isMagicTokenExpired(future)).toBe(false);
  });

  it("should return true for past date", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isMagicTokenExpired(past)).toBe(true);
  });
});
