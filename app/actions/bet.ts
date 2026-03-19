"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/session/auth";
import type { BetType } from "@prisma/client";
import type { BillRow, BetTypeId } from "@/components/bet/types";

const TOP_TYPE: Partial<Record<BetTypeId, BetType>> = {
  "3top": "top3", "3tod": "tod3", "2top": "top2",
  "6perm": "top3", "19door": "top2", "run": "run_top", "winnum": "top2",
};
const BOT_TYPE: Partial<Record<BetTypeId, BetType>> = {
  "2top": "bot2", "2bot": "bot2", "19door": "bot2", "winlay": "run_bot", "winnum": "bot2",
};

export type BetResult = { ok: true } | { ok: false; error: string };

export async function confirmBet(
  lotteryTypeId: string,
  bills: BillRow[],
): Promise<BetResult> {
  if (!bills.length) return { ok: false, error: "ไม่มีรายการแทง" };

  const user = await requireAuth();

  const totalAmount = bills.reduce((s, b) => s + b.top + b.bot, 0);
  if (totalAmount <= 0) return { ok: false, error: "ยอดแทงต้องมากกว่า 0" };

  // หา round ที่ open
  const round = await prisma.lotteryRound.findFirst({
    where: { lotteryTypeId, status: "open" },
    orderBy: { closeAt: "asc" },
  });
  if (!round) return { ok: false, error: "ไม่พบงวดที่เปิดรับแทง" };
  if (round.closeAt < new Date()) return { ok: false, error: "งวดนี้ปิดรับแทงแล้ว" };

  // ดึง betRates
  const betRates = await prisma.betRate.findMany({ where: { lotteryTypeId, isActive: true } });
  const rateMap  = new Map(betRates.map((r) => [r.betType, Number(r.payRate)]));
  const getRate  = (dbType: BetType) => rateMap.get(dbType) ?? 0;

  const slipGroups = bills.reduce<Record<string, BillRow[]>>((acc, b) => {
    (acc[b.slipNo] ??= []).push(b);
    return acc;
  }, {});

  try {
    await prisma.$transaction(async (tx) => {
      // ล็อคและตรวจ balance ใน transaction
      const freshUser = await tx.user.findUniqueOrThrow({
        where:  { id: user.id },
        select: { balance: true },
      });
      const balance = Number(freshUser.balance);
      if (balance < totalAmount) {
        throw new Error(`ยอดเงินไม่เพียงพอ (มี ฿${balance.toLocaleString("th-TH")})`);
      }

      const now = new Date();

      for (const [slipNo, items] of Object.entries(slipGroups)) {
        const slipTotal = items.reduce((s, b) => s + b.top + b.bot, 0);
        const note      = items[0]?.note || null;
        let   slipPayout = 0;

        for (const b of items) {
          if (TOP_TYPE[b.betType] && b.top > 0) slipPayout += b.top * getRate(TOP_TYPE[b.betType]!);
          if (BOT_TYPE[b.betType] && b.bot > 0) slipPayout += b.bot * getRate(BOT_TYPE[b.betType]!);
        }

        const slip = await tx.betSlip.create({
          data: {
            slipNo, userId: user.id, roundId: round.id,
            totalAmount: slipTotal, totalPayout: slipPayout,
            note, status: "confirmed", confirmedAt: now,
          },
        });

        for (const b of items) {
          const topType = TOP_TYPE[b.betType];
          const botType = BOT_TYPE[b.betType];

          if (topType && b.top > 0) {
            const payRate = getRate(topType);
            await tx.betItem.create({
              data: { slipId: slip.id, number: b.number, betType: topType, amount: b.top, payRate, payout: b.top * payRate },
            });
          }
          if (botType && b.bot > 0) {
            const payRate = getRate(botType);
            await tx.betItem.create({
              data: { slipId: slip.id, number: b.number, betType: botType, amount: b.bot, payRate, payout: b.bot * payRate },
            });
          }
        }
      }

      // หักยอดเงิน
      await tx.user.update({
        where: { id: user.id },
        data:  { balance: { decrement: totalAmount } },
      });

      // บันทึก Transaction
      await tx.transaction.create({
        data: {
          userId: user.id, type: "bet",
          amount: -totalAmount,
          balanceBefore: balance,
          balanceAfter:  balance - totalAmount,
          referenceId:   Object.keys(slipGroups)[0],
          note:          `แทงหวย ${bills.length} รายการ`,
          status: "completed",
        },
      });
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
    return { ok: false, error: msg };
  }
}
