/**
 * lib/db/referrals.ts
 * Referral-related database operations.
 */

import { prisma } from "./prisma";

/** Create a referral record (referrer → new user) */
export async function createReferral(referrerId: string, refereeId: string): Promise<void> {
  await prisma.referral.create({
    data: { referrerId, refereeId },
  });
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string): Promise<{
  referredCount: number;
  totalEarned: number;
}> {
  const result = await prisma.referral.aggregate({
    where:   { referrerId: userId },
    _count:  { id: true },
    _sum:    { totalEarned: true },
  });
  return {
    referredCount: result._count.id,
    totalEarned:   parseFloat(String(result._sum.totalEarned ?? 0)),
  };
}

/** Get list of referred users with joined date */
export async function getReferralList(userId: string) {
  return prisma.referral.findMany({
    where:   { referrerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      totalEarned: true,
      createdAt:   true,
      referee: {
        select: {
          displayName: true,
          phone:       true,
          createdAt:   true,
        },
      },
    },
  });
}
