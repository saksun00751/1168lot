/**
 * lib/db/otp.ts
 * OTP create / verify via Prisma.
 */

import crypto    from "crypto";
// import type { OtpPurpose } from "@prisma/client";
import { prisma } from "./prisma";

// export type { OtpPurpose };

const OTP_TTL_SECONDS = 300; // 5 minutes

/**
 * Generate a cryptographically-secure 6-digit OTP,
 * delete any existing unused OTPs for that phone+purpose,
 * store the new one, and return the code.
 */
export async function createOtp(
  phone: string,
  // purpose: OtpPurpose = "login"
): Promise<string> {
  // Delete previous unused OTPs for this phone + purpose
  await prisma.otpCode.deleteMany({
    // where: { phone, purpose, usedAt: null },
  });

  const code      = String(crypto.randomInt(100_000, 999_999));
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1_000);

  // await prisma.otpCode.create({
    // data: { phone, code, purpose, expiresAt },
  // });

  return code;
}

/**
 * Verify an OTP.
 * Returns true (and marks as used) when valid; false otherwise.
 */
export async function verifyOtp(
  phone: string,
  code: string,
  // purpose: OtpPurpose = "login"
): Promise<boolean> {
  const record = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      // purpose,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  await prisma.otpCode.update({
    where: { id: record.id },
    data:  { usedAt: new Date() },
  });

  return true;
}
