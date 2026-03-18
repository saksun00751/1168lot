import { prisma } from "./lib/db/prisma";

async function main() {
  // Get first open round
  const round = await prisma.lotteryRound.findFirst({ where: { status: "open" } });
  if (!round) { console.log("No open round"); return; }
  console.log("Round:", round.id, round.lotteryTypeId);

  // Clear existing
  await prisma.numberLimit.deleteMany({ where: { roundId: round.id } });

  // Insert random limits
  await prisma.numberLimit.createMany({
    data: [
      { roundId: round.id, number: "35", betType: "top2",    isClosed: true,  note: "อั้นมาก" },
      { roundId: round.id, number: "42", betType: "top2",    isClosed: true,  note: "ซื้อเต็ม" },
      { roundId: round.id, number: "77", betType: null,      isClosed: true,  note: "ปิดทุกประเภท" },
      { roundId: round.id, number: "99", betType: "bot2",    isClosed: true  },
      { roundId: round.id, number: "123",betType: "top3",    maxAmount: 100,  isClosed: false, note: "จำกัด 100 บาท" },
      { roundId: round.id, number: "456",betType: "top3",    maxAmount: 50,   isClosed: false },
      { roundId: round.id, number: "7",  betType: "run_top", maxAmount: 200,  isClosed: false },
    ],
  });
  console.log("Seeded number limits for round", round.id);
}

main().finally(() => prisma.$disconnect());
