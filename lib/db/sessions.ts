/**
 * lib/db/sessions.ts
 * Session create / validate / destroy via Prisma.
 */

import crypto from "crypto";
import { prisma } from "./prisma";


const SESSION_MAX_AGE_SEC = Number(process.env.SESSION_MAX_AGE ?? 604_800); // 7 days

/** Create a new session token for a user; returns the token string */
export async function createSession(
  userId: string,
  userAgent?: string | null,
  ipAddress?: string | null
): Promise<string> {
  const token     = crypto.randomBytes(32).toString("hex"); // 64-char hex
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1_000);

  await prisma.session.create({
    data: { id: token, userId, expiresAt, userAgent, ipAddress },
  });

  return token;
}

/** Validate a token; returns { userId, expiresAt } or null */
export async function getSession(
  token: string
): Promise<{ userId: string; expiresAt: Date } | null> {
  const session = await prisma.session.findFirst({
    where: {
      id:        token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) return null;
  return { userId: session.userId, expiresAt: session.expiresAt };
}

/** Delete a session (logout) */
export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: token } });
}

/** Extend expiry (rolling sessions) */
export async function refreshSession(token: string): Promise<void> {
  const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1_000);
  await prisma.session.updateMany({
    where: { id: token },
    data:  { expiresAt: newExpiry },
  });
}
