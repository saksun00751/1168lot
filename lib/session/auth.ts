/**
 * lib/session/auth.ts
 *
 * Server-side helper: resolves the current logged-in user from
 * the session cookie.  Used in Server Components and Server Actions.
 */

import { getSessionToken } from "./cookies";
import { getSession, refreshSession } from "@/lib/db/sessions";
import { findUserById }    from "@/lib/db/users";
import type { User }       from "@/lib/db/users";

export interface AuthUser {
  id:          string;
  phone:       string;
  displayName: string | null;
  balance:     number;
  level:       User["level"];
  createdAt:   Date;
  bankName:    string | null;
  bankAccount: string | null;
}

/**
 * Returns the authenticated user or null.
 * Call this from any Server Component / Server Action.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const session = await getSession(token);
    if (!session) return null;

    // Extend expiry on every request (rolling session)
    await refreshSession(token);

    const user = await findUserById(session.userId);
    if (!user) return null;

    return {
      id:          user.id,
      phone:       user.phone,
      displayName: user.displayName,
      balance:     parseFloat(String(user.balance)),
      level:       user.level,
      createdAt:   user.createdAt,
      bankName:    user.bankName,
      bankAccount: user.bankAccount,
    };
  } catch (error) {
    console.error("Authentication check failed:", error);
    return null;
  }
}

/** Redirect-aware guard — throws NEXT_REDIRECT if unauthenticated */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    // ส่งไปหน้า login พร้อม flag เพื่อแจ้งว่า session หมดอายุและป้องกัน redirect loop
    redirect("/login?expired=1");
  }
  return user as AuthUser;
}
