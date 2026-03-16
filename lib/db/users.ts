/**
 * lib/db/users.ts
 * User-related database operations using Prisma.
 */

import type { User } from "@prisma/client";
import { prisma } from "./prisma";

export type { User };

/** Find active user by phone */
export async function findUserByPhone(phone: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { phone, isActive: true },
  });
}

/** Find active user by id */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id, isActive: true },
  });
}

/** Check whether a phone is already registered */
export async function phoneExists(phone: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { phone } });
  return count > 0;
}

/** Find user by referral code */
export async function findUserByReferralCode(code: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { referralCode: code, isActive: true },
  });
}

/** Generate a unique referral code (LT + 6 uppercase alphanumeric) */
export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "LT";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await prisma.user.count({ where: { referralCode: code } });
    if (exists === 0) return code;
  }
  // Ultra-rare fallback: use timestamp suffix
  return "LT" + Date.now().toString(36).toUpperCase().slice(-6);
}

/** Create a new user with optional referral tracking, returns the created User */
export async function createUser(
  phone: string,
  passwordHash: string | null,
  displayName?: string,
  referredByCode?: string
): Promise<User> {
  const referralCode = await generateUniqueReferralCode();
  return prisma.user.create({
    data: {
      phone,
      passwordHash,
      displayName:   displayName ?? null,
      referralCode,
      referredByCode: referredByCode ?? null,
    },
  });
}

/** Update display name and bank details */
export async function updateUserProfile(
  userId: string,
  data: { displayName?: string; bankName?: string; bankAccount?: string }
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
}

/** Update bcrypt password hash */
export async function updatePasswordHash(
  userId: string,
  hash: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { passwordHash: hash },
  });
}
