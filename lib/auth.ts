import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "owner_session";

// Owner password. Override in production via the OWNER_PASSWORD env var.
export function ownerPassword(): string {
  return process.env.OWNER_PASSWORD || "natalie2026";
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function sessionToken(): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(ownerPassword())
    .digest("hex");
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isOwner(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === sessionToken();
}
