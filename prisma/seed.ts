/**
 * prisma/seed.ts
 * Seeds a demo admin user for local development.
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where:  { phone: "0812345678" },
    update: {},
    create: {
      phone:        "0812345678",
      passwordHash: hash,
      displayName:  "Demo User",
      balance:      100.00,
      // level:        "Silver",
    },
  });

  console.log("✅ Seed complete — demo user:", user.phone, "/ password: demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
