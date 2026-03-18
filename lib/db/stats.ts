import { prisma } from "./prisma";

export async function getUserStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [betAgg, winAgg, referralAgg, monthlyRefAgg] = await Promise.all([
    // ยอดแทงรวม (amount เป็นลบ จึง _sum จะติดลบ → ใช้ Math.abs)
    prisma.transaction.aggregate({
      where:  { userId, type: "bet", status: "completed" },
      _sum:   { amount: true },
    }),
    // ยอดชนะรวม
    prisma.transaction.aggregate({
      where:  { userId, type: "win", status: "completed" },
      _sum:   { amount: true },
    }),
    // จำนวนที่แนะนำ + ยอดรวม
    prisma.referral.aggregate({
      where:  { referrerId: userId },
      _count: { id: true },
      _sum:   { totalEarned: true },
    }),
    // ยอดแนะนำเดือนนี้ (จาก transaction referral_bonus)
    prisma.transaction.aggregate({
      where:  { userId, type: "referral_bonus", status: "completed", createdAt: { gte: startOfMonth } },
      _sum:   { amount: true },
    }),
  ]);

  return {
    totalBet:         Math.abs(parseFloat(String(betAgg._sum.amount ?? 0))),
    totalWin:         parseFloat(String(winAgg._sum.amount ?? 0)),
    referredCount:    referralAgg._count.id,
    monthlyReferral:  parseFloat(String(monthlyRefAgg._sum.amount ?? 0)),
  };
}
