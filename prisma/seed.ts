/**
 * prisma/seed.ts
 * Seeds demo user + LotteryCategory, LotteryType, BetRate
 * Run: npm run db:seed
 */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { CATEGORIES } from "../lib/categories";

dotenv.config({ path: ".env" });

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host:            dbUrl.hostname,
  port:            Number(dbUrl.port || 3306),
  user:            dbUrl.username,
  password:        dbUrl.password,
  database:        dbUrl.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

// ─── อัตราจ่ายเริ่มต้น ────────────────────────────────────────────────────────
const DEFAULT_RATES = [
  { betType: "top3" as const, payRate: 900,  minAmount: 1, maxAmount: 1000 },
  { betType: "tod3" as const, payRate: 150,  minAmount: 1, maxAmount: 1000 },
  { betType: "top2" as const, payRate: 95,   minAmount: 1, maxAmount: 1000 },
  { betType: "bot2" as const, payRate: 95,   minAmount: 1, maxAmount: 1000 },
  { betType: "run_top" as const, payRate: 3.5,  minAmount: 1, maxAmount: 1000 },
  { betType: "run_bot" as const, payRate: 4.5,  minAmount: 1, maxAmount: 1000 },
];

// แยก "ออกผล 17:00" → "17:00" / "ตลาดเช้า 11:00" → "11:00"
function parseResultTime(sub: string): string | null {
  const m = sub.match(/\b(\d{1,2}:\d{2})\b/);
  return m ? m[1] : null;
}

// intervalMinutes สำหรับยี่กี
function getInterval(categoryId: string, itemId: string): number | null {
  if (categoryId === "yeekee_speed") return 5;
  if (categoryId === "yeekee_super") {
    return itemId === "yeekee_vip" ? 15 : 5;
  }
  return null;
}

async function seedLottery() {
  console.log("🎰 Seeding lottery categories and types...");

  for (const [sortOrder, cat] of CATEGORIES.entries()) {
    // ── upsert LotteryCategory ──────────────────────────────────────────────
    await prisma.lotteryCategory.upsert({
      where:  { id: cat.id },
      update: { name: cat.label, emoji: cat.emoji, gradient: cat.gradient, badge: cat.badge, sortOrder },
      create: { id: cat.id, name: cat.label, emoji: cat.emoji, gradient: cat.gradient, badge: cat.badge, sortOrder },
    });

    // ── upsert LotteryType + BetRate ────────────────────────────────────────
    for (const [typeOrder, item] of cat.items.entries()) {
      await prisma.lotteryType.upsert({
        where:  { id: item.id },
        update: {
          categoryId:      cat.id,
          name:            item.name,
          flag:            item.flag,
          description:     item.sub,
          resultTime:      parseResultTime(item.sub),
          intervalMinutes: getInterval(cat.id, item.id),
          barClass:        item.barClass,
          sortOrder:       typeOrder,
        },
        create: {
          id:              item.id,
          categoryId:      cat.id,
          name:            item.name,
          flag:            item.flag,
          description:     item.sub,
          resultTime:      parseResultTime(item.sub),
          intervalMinutes: getInterval(cat.id, item.id),
          barClass:        item.barClass,
          sortOrder:       typeOrder,
        },
      });

      // upsert BetRate แต่ละประเภทการแทง
      for (const rate of DEFAULT_RATES) {
        await prisma.betRate.upsert({
          where:  { lotteryTypeId_betType: { lotteryTypeId: item.id, betType: rate.betType } },
          update: { payRate: rate.payRate, minAmount: rate.minAmount, maxAmount: rate.maxAmount },
          create: { lotteryTypeId: item.id, ...rate },
        });
      }

      console.log(`  ✓ ${cat.label} › ${item.name}`);
    }

    if (cat.items.length === 0) {
      console.log(`  ✓ ${cat.label} (ไม่มีประเภทย่อย)`);
    }
  }

  console.log("✅ Lottery seed complete");
}

async function seedDemoUser() {
  console.log("👤 Seeding demo user...");

  const hash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where:  { phone: "0812345678" },
    update: {},
    create: {
      phone:        "0812345678",
      passwordHash: hash,
      displayName:  "Demo User",
      balance:      100.00,
    },
  });

  console.log(`✅ Demo user: ${user.phone} / password: demo1234`);
}

async function main() {
  await seedDemoUser();
  await seedLottery();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
