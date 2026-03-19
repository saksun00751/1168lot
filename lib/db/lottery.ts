import { prisma } from "./prisma";
import type { Category, SubItem } from "@/lib/categories";
import type { BetType } from "@prisma/client";
import type { BetTypeId } from "@/components/bet/types";

// Prisma reads DATETIME (no tz) as UTC, but DB stores Bangkok time (UTC+7)
// → subtract 7h to get correct UTC timestamp
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
const toUtcIso = (d: Date) => new Date(d.getTime() - BKK_OFFSET_MS).toISOString();

// map DB BetType enum → frontend BetTypeId
const DB_TO_BET_TYPE_ID: Record<BetType, BetTypeId> = {
  top3: "3top", tod3: "3tod", top2: "2top",
  bot2: "2bot", run_top: "run", run_bot: "winlay",
};

const BET_TYPE_LABEL: Record<BetTypeId, string> = {
  "3top": "3 ตัวบน", "3tod": "3 ตัวโต๊ด", "2top": "2 ตัวบน",
  "2bot": "2 ตัวล่าง", "run": "วิ่งบน", "winlay": "วิ่งล่าง",
  "6perm": "6กลับ", "19door": "19ประตู", "winnum": "วินเลข",
};

export interface BetRateRow {
  id:        BetTypeId;
  label:     string;
  rate:      string;   // อัตราจ่าย เช่น "900"
  minAmount: number;
  maxAmount: number;
  isActive:  boolean;
}

/** ส่วนลด % ทั้งเว็บ อ่านจาก core_settings key = 'lottery.discount_pct' */
export async function getDiscountPct(): Promise<number> {
  const row = await prisma.core_settings.findUnique({
    where: { key: "lottery.discount_pct" },
  });
  return row ? Number(row.value_decimal ?? 0) : 0;
}

export async function getBetRates(lotteryTypeId: string): Promise<BetRateRow[]> {
  const rows = await prisma.betRate.findMany({
    where:   { lotteryTypeId, isActive: true },
    orderBy: { betType: "asc" },
  });

  // กำหนดลำดับ
  const ORDER: BetTypeId[] = ["3top", "3tod", "2top", "2bot", "run", "winlay", "6perm", "19door", "winnum"];

  const mapped = rows
    .map((r) => {
      const id = DB_TO_BET_TYPE_ID[r.betType];
      if (!id) return null;
      return {
        id,
        label:     BET_TYPE_LABEL[id] ?? id,
        rate:      Number(r.payRate).toString(),
        minAmount: Number(r.minAmount),
        maxAmount: Number(r.maxAmount),
        isActive:  r.isActive,
      } satisfies BetRateRow;
    })
    .filter(Boolean) as BetRateRow[];

  mapped.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  // append derived types (6perm → rate of 3top, 19door/winnum → rate of 2top)
  const rate3top = mapped.find((r) => r.id === "3top");
  const rate2top = mapped.find((r) => r.id === "2top");

  const derived: BetRateRow[] = [
    rate3top && { id: "6perm",  label: "6กลับ",   rate: rate3top.rate, minAmount: rate3top.minAmount, maxAmount: rate3top.maxAmount, isActive: true },
    rate2top && { id: "19door", label: "19ประตู", rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
    rate2top && { id: "winnum", label: "วินเลข",  rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
  ].filter(Boolean) as BetRateRow[];

  return [...mapped, ...derived];
}

export interface NumberLimitRow {
  number:    string;
  betType:   BetType | null;  // null = ทุกประเภท
  maxAmount: number | null;   // null = ปิดรับ
  isClosed:  boolean;
  note:      string | null;
}

/** ดึงเลขอั้นของ round ที่ open ล่าสุดของ lotteryTypeId นั้น */
export async function getNumberLimits(lotteryTypeId: string): Promise<NumberLimitRow[]> {
  const round = await prisma.lotteryRound.findFirst({
    where:   { lotteryTypeId, status: "open" },
    orderBy: { closeAt: "asc" },
  });
  if (!round) return [];

  const limits = await prisma.numberLimit.findMany({
    where:   { roundId: round.id },
    orderBy: [{ isClosed: "desc" }, { number: "asc" }],
  });

  return limits.map((l) => ({
    number:    l.number,
    betType:   l.betType,
    maxAmount: l.maxAmount ? Number(l.maxAmount) : null,
    isClosed:  l.isClosed,
    note:      l.note,
  }));
}

export interface PastResultRow {
  date:  string;   // "16-03-2026"
  top3:  string;
  bot2:  string;
}

export async function getPastResults(lotteryTypeId: string, limit = 5): Promise<PastResultRow[]> {
  const rounds = await prisma.lotteryRound.findMany({
    where:   { lotteryTypeId, status: "resulted" },
    orderBy: { closeAt: "desc" },
    take:    limit,
    include: { result: true },
  });

  return rounds
    .filter((r) => r.result)
    .map((r) => ({
      date: r.closeAt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      top3: r.result!.top3,
      bot2: r.result!.bot2,
    }));
}

export async function getLotteryCategories(): Promise<Category[]> {
  const rows = await prisma.lotteryCategory.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      lotteryTypes: {
        where:   { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          rounds: {
            where:   { status: { in: ["open", "closed", "resulted"] } },
            orderBy: { closeAt: "desc" },
            take:    1,
            include: { result: true },
          },
        },
      },
    },
  });

  return rows.map((cat) => ({
    id:       cat.id,
    label:    cat.name,
    emoji:    cat.emoji,
    gradient: cat.gradient,
    badge:    cat.badge,
    items:    cat.lotteryTypes.map((lt): SubItem => {
      const round  = lt.rounds[0] ?? null;
      const isOpen = round?.status === "open";
      const resulted = round?.status === "resulted";

      return {
        id:       lt.id,
        name:     lt.name,
        flag:     lt.flag,
        sub:      lt.description ?? "",
        barClass: lt.barClass,
        href:     `/bet?lottery=${lt.id}`,
        isOpen,
        closeAt:   isOpen ? toUtcIso(round!.closeAt) : undefined,
        result:    resulted && round?.result
          ? { top3: round.result.top3, bot2: round.result.bot2 }
          : undefined,
      };
    }),
  }));
}

export async function getLotteryCategory(id: string): Promise<Category | null> {
  const cat = await prisma.lotteryCategory.findUnique({
    where:   { id, isActive: true },
    include: {
      lotteryTypes: {
        where:   { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          rounds: {
            where:   { status: { in: ["open", "closed", "resulted"] } },
            orderBy: { closeAt: "desc" },
            take:    1,
            include: { result: true },
          },
        },
      },
    },
  });

  if (!cat) return null;

  return {
    id:       cat.id,
    label:    cat.name,
    emoji:    cat.emoji,
    gradient: cat.gradient,
    badge:    cat.badge,
    items:    cat.lotteryTypes.map((lt): SubItem => {
      const round  = lt.rounds[0] ?? null;
      const isOpen = round?.status === "open";
      const resulted = round?.status === "resulted";

      return {
        id:       lt.id,
        name:     lt.name,
        flag:     lt.flag,
        sub:      lt.description ?? "",
        barClass: lt.barClass,
        href:     `/bet?lottery=${lt.id}`,
        isOpen,
        closeAt:   isOpen ? toUtcIso(round!.closeAt) : undefined,
        result:    resulted && round?.result
          ? { top3: round.result.top3, bot2: round.result.bot2 }
          : undefined,
      };
    }),
  };
}
