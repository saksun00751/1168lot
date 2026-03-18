import { prisma } from "./prisma";
import type { BetType, SlipStatus } from "@prisma/client";

export const BET_TYPE_LABEL: Record<BetType, string> = {
  top3:    "3 ตัวบน",
  tod3:    "3 ตัวโต๊ด",
  top2:    "2 ตัวบน",
  bot2:    "2 ตัวล่าง",
  run_top: "วิ่งบน",
  run_bot: "วิ่งล่าง",
};

export interface BetSlipSummary {
  id:          string;
  slipNo:      string;
  lotteryName: string;
  totalAmount: number;
  totalPayout: number;
  status:      string;
  itemCount:   number;
  createdAt:   Date;
}

export interface BetItemDetail {
  id:           number;
  number:       string;
  betType:      BetType;
  betTypeLabel: string;
  amount:       number;
  payRate:      number;
  payout:       number;
  isWin:        boolean | null;
  actualPayout: number | null;
}

export interface BetSlipDetail extends BetSlipSummary {
  note:        string | null;
  confirmedAt: Date | null;
  items:       BetItemDetail[];
}

export interface BetHistoryFilter {
  status?:   string;
  search?:   string;
  dateFrom?: string;   // "YYYY-MM-DD"
  dateTo?:   string;   // "YYYY-MM-DD"
  skip?:     number;
  limit?:    number;
}

export async function getBetHistory(
  userId: string,
  filter: BetHistoryFilter = {},
): Promise<{ slips: BetSlipSummary[]; total: number }> {
  const { status, search, dateFrom, dateTo, skip = 0, limit = 20 } = filter;

  const where: NonNullable<Parameters<typeof prisma.betSlip.findMany>[0]>["where"] = { userId };

  if (status && status !== "all") where.status = status as SlipStatus;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
      ...(dateTo   ? { lte: new Date(`${dateTo}T23:59:59`)   } : {}),
    };
  }

  if (search) {
    where.OR = [
      { slipNo: { contains: search } },
      { round:  { lotteryType: { name: { contains: search } } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.betSlip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    limit,
      skip,
      include: {
        _count: { select: { items: true } },
        round:  { include: { lotteryType: { select: { name: true } } } },
      },
    }),
    prisma.betSlip.count({ where }),
  ]);

  return {
    total,
    slips: rows.map((s) => ({
      id:          s.id,
      slipNo:      s.slipNo,
      lotteryName: s.round.lotteryType.name,
      totalAmount: Number(s.totalAmount),
      totalPayout: Number(s.totalPayout),
      status:      s.status,
      itemCount:   s._count.items,
      createdAt:   s.createdAt,
    })),
  };
}

export async function getLotteryBetHistory(
  userId: string,
  lotteryTypeId: string,
  limit = 5,
): Promise<BetSlipSummary[]> {
  const rows = await prisma.betSlip.findMany({
    where: {
      userId,
      round: { lotteryTypeId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { items: true } },
      round:  { include: { lotteryType: { select: { name: true } } } },
    },
  });

  return rows.map((s) => ({
    id:          s.id,
    slipNo:      s.slipNo,
    lotteryName: s.round.lotteryType.name,
    totalAmount: Number(s.totalAmount),
    totalPayout: Number(s.totalPayout),
    status:      s.status,
    itemCount:   s._count.items,
    createdAt:   s.createdAt,
  }));
}

export async function getSlipDetail(slipId: string, userId: string): Promise<BetSlipDetail | null> {
  const s = await prisma.betSlip.findFirst({
    where:   { id: slipId, userId },
    include: {
      _count: { select: { items: true } },
      round:  { include: { lotteryType: { select: { name: true } } } },
      items:  { orderBy: { id: "asc" } },
    },
  });
  if (!s) return null;

  return {
    id:          s.id,
    slipNo:      s.slipNo,
    lotteryName: s.round.lotteryType.name,
    totalAmount: Number(s.totalAmount),
    totalPayout: Number(s.totalPayout),
    status:      s.status,
    itemCount:   s._count.items,
    createdAt:   s.createdAt,
    note:        s.note,
    confirmedAt: s.confirmedAt,
    items: s.items.map((i) => ({
      id:           i.id,
      number:       i.number,
      betType:      i.betType,
      betTypeLabel: BET_TYPE_LABEL[i.betType],
      amount:       Number(i.amount),
      payRate:      Number(i.payRate),
      payout:       Number(i.payout),
      isWin:        i.isWin,
      actualPayout: i.actualPayout ? Number(i.actualPayout) : null,
    })),
  };
}
