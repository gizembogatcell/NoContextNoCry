import "server-only";
import crypto from "node:crypto";

const TOKEN_EXPIRY_HOURS = 48;

export function generateMagicToken(): {
  token: string;
  expiresAt: string;
} {
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  ).toISOString();
  return { token, expiresAt };
}

export function isMagicTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
