"use server";

/**
 * lib/actions.ts
 * Next.js Server Actions — auth & betting, powered by Prisma + MariaDB.
 */

import bcrypt         from "bcryptjs";
import { redirect }   from "next/navigation";
import { headers }    from "next/headers";

import { findUserByPhone, createUser, phoneExists, updateUserProfile, updatePasswordHash, findUserById, findUserByReferralCode } from "@/lib/db/users";
import { createReferral } from "@/lib/db/referrals";
import { createOtp, verifyOtp }                     from "@/lib/db/otp";
import { createSession, destroySession }            from "@/lib/db/sessions";
import { setSessionCookie, getSessionToken, clearSessionCookie } from "@/lib/session/cookies";
import { sendOtpSms }                               from "@/lib/otp-sender";

import { getCurrentUser }                             from "@/lib/session/auth";

import type {
  LoginState, OtpState, RegisterState, PlaceBetState,
} from "@/types/auth";
import { prisma } from "./db/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-]/g, "");
}
function isValidThaiPhone(phone: string): boolean {
  return /^0[6-9]\d{8}$/.test(phone);
}

async function getSessionMetadata() {
  const head = await headers();
  const userAgent = head.get("user-agent");
  const ipAddress = head.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
  return { userAgent, ipAddress };
}

/**
 * Ensures a user has a referral code. If not, generates a unique one and
 * assigns it to them. This is called on any successful login or registration.
 */
async function assignReferralCodeOnLogin(user: { id: string; referralCode?: string | null }) {
  if (user.referralCode) return;

  let isUnique = false;
  while (!isUnique) {
    // Generate 6-char uppercase alphanumeric code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userWithCode = await findUserByReferralCode(newCode);
    if (!userWithCode) {
      isUnique = true;
      await prisma.user.update({ where: { id: user.id }, data: { referralCode: newCode } });
    }
  }
}
// ─── OTP Login — Step 1: Request OTP ─────────────────────────────────────────
export async function requestOtpAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const phone = normalizePhone((formData.get("phone") as string) ?? "");

  if (!phone)                   return { error: "กรุณากรอกเบอร์โทรศัพท์" };
  if (!isValidThaiPhone(phone)) return { error: "เบอร์โทรศัพท์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)" };

  const user = await findUserByPhone(phone);
  if (!user) return { error: "ไม่พบบัญชีนี้ กรุณาสมัครสมาชิกก่อน" };

  // const code = await createOtp(phone, "login");
  // await sendOtpSms(phone, code);

  return { success: true, phone };
}

// ─── OTP Login — Step 2: Verify OTP ──────────────────────────────────────────
export async function verifyOtpAction(
  prevState: OtpState,
  formData: FormData
): Promise<OtpState> {
  const otp   = (formData.get("otp")   as string) ?? "";
  const phone = (formData.get("phone") as string) ?? "";

  if (!/^\d{6}$/.test(otp)) return { error: "กรุณากรอก OTP 6 หลัก" };

  // const valid = await verifyOtp(phone, otp, "login");
  // if (!valid) return { error: "รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่" };

  const user = await findUserByPhone(phone);
  if (!user) return { error: "ไม่พบบัญชีในระบบ" };

  // Assign referral code if needed
  await assignReferralCodeOnLogin(user);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(user.id, userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true };
}

// ─── Login with Password ──────────────────────────────────────────────────────
export interface LoginPasswordState {
  error?: string;
  fieldErrors?: { phone?: string; password?: string };
  success?: boolean;
  phone?: string;
}

export async function loginWithPasswordAction(
  prevState: LoginPasswordState,
  formData: FormData
): Promise<LoginPasswordState> {
  const phone    = normalizePhone((formData.get("phone")    as string) ?? "");
  const password = (formData.get("password") as string) ?? "";

  const fieldErrors: LoginPasswordState["fieldErrors"] = {};
  if (!phone)                    fieldErrors.phone    = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!isValidThaiPhone(phone)) fieldErrors.phone = "เบอร์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)";
  if (!password)                 fieldErrors.password = "กรุณากรอกรหัสผ่าน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const user = await findUserByPhone(phone);

  // Constant-time comparison even when user not found (prevent timing attacks)
  const hashToCheck = user?.passwordHash ?? "$2b$10$invalidhashforcomparisononlyXXXXXXXXXXXX";
  const match = await bcrypt.compare(password, hashToCheck);

  if (!user || !match) return { error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" };
  if (!user.passwordHash) return { error: "บัญชีนี้ไม่มีรหัสผ่าน กรุณาใช้ OTP แทน" };

  // Assign referral code if needed
  await assignReferralCodeOnLogin(user);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(user.id, userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true, phone };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const phone           = normalizePhone((formData.get("phone")           as string) ?? "");
  const password        = (formData.get("password")        as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";
  const refCode         = ((formData.get("referralCode")   as string) ?? "").trim().toUpperCase();

  const fieldErrors: RegisterState["fieldErrors"] = {};

  if (!phone)                        fieldErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!isValidThaiPhone(phone)) fieldErrors.phone = "เบอร์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)";

  if (!password)                fieldErrors.password = "กรุณากรอกรหัสผ่าน";
  else if (password.length < 8) fieldErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
                                fieldErrors.password = "ต้องมีทั้งตัวอักษรและตัวเลข";

  if (!confirmPassword)                        fieldErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (confirmPassword !== password)       fieldErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // Check duplicate phone
  if (await phoneExists(phone)) return { fieldErrors: { phone: "เบอร์นี้ถูกใช้งานแล้ว" } };

  // Resolve referrer (optional — invalid code is silently ignored)
  let referrer: Awaited<ReturnType<typeof findUserByReferralCode>> = null;
  if (refCode) {
    referrer = await findUserByReferralCode(refCode);
  }

  // Create user
  const hash    = await bcrypt.hash(password, 12);
  const newUser = await createUser(phone, hash, undefined, referrer ? refCode : undefined);

  // Link referral record
  if (referrer) {
    await createReferral(referrer.id, newUser.id);
  }

  // Assign a referral code to the new user so they can refer others
  await assignReferralCodeOnLogin(newUser);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(newUser.id, userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true, phone };
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export interface UpdateProfileState {
  error?: string;
  fieldErrors?: { displayName?: string; bankName?: string; bankAccount?: string };
  success?: boolean;
}

export async function updateProfileAction(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const displayName  = (formData.get("displayName")  as string ?? "").trim();
  const bankName     = (formData.get("bankName")      as string ?? "").trim();
  const bankAccount  = (formData.get("bankAccount")   as string ?? "").trim().replace(/\D/g, "");

  const fieldErrors: UpdateProfileState["fieldErrors"] = {};
  if (!displayName)                          fieldErrors.displayName = "กรุณากรอกชื่อที่แสดง";
  if (!bankName)                             fieldErrors.bankName    = "กรุณาเลือกธนาคาร";
  if (!bankAccount)                          fieldErrors.bankAccount = "กรุณากรอกเลขบัญชี";
  else if (bankAccount.length < 10 || bankAccount.length > 12)
                                             fieldErrors.bankAccount = "เลขบัญชีต้องมี 10–12 หลัก";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  await updateUserProfile(user.id, { displayName, bankName, bankAccount });
  return { success: true };
}

// ─── Change Password ───────────────────────────────────────────────────────────
export interface ChangePasswordState {
  error?: string;
  fieldErrors?: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  success?: boolean;
}

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const oldPassword     = (formData.get("oldPassword")     as string) ?? "";
  const newPassword     = (formData.get("newPassword")     as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  const fieldErrors: ChangePasswordState["fieldErrors"] = {};
  if (!oldPassword) fieldErrors.oldPassword = "กรุณากรอกรหัสผ่านเดิม";
  if (!newPassword) fieldErrors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
  else if (newPassword.length < 8) fieldErrors.newPassword = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
    fieldErrors.newPassword = "ต้องมีทั้งตัวอักษรและตัวเลข";
  if (!confirmPassword) fieldErrors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
  else if (confirmPassword !== newPassword) fieldErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const fullUser = await findUserById(user.id);
  if (!fullUser?.passwordHash) return { error: "บัญชีนี้ไม่มีรหัสผ่าน กรุณาใช้ OTP แทน" };

  const match = await bcrypt.compare(oldPassword, fullUser.passwordHash);
  if (!match) return { fieldErrors: { oldPassword: "รหัสผ่านเดิมไม่ถูกต้อง" } };

  if (oldPassword === newPassword) return { fieldErrors: { newPassword: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม" } };

  const hash = await bcrypt.hash(newPassword, 12);
  await updatePasswordHash(user.id, hash);
  return { success: true };
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await destroySession(token);
    await clearSessionCookie();
  }
  redirect("/login");
}

// ─── Place Bet ────────────────────────────────────────────────────────────────

// Frontend BetType → Prisma enum
const BET_TYPE_MAP: Record<string, "top3" | "tod3" | "top2" | "bot2" | "run_top" | "run_bot"> = {
  "3top":    "top3",
  "3tod":    "tod3",
  "2top":    "top2",
  "2bot":    "bot2",
  "run_top": "run_top",
  "run_bot": "run_bot",
};

export async function placeBetAction(
  prevState: PlaceBetState,
  formData: FormData
): Promise<PlaceBetState> {
  const betsJson  = formData.get("bets")      as string;
  const lotteryId = formData.get("lotteryId") as string;

  if (!betsJson || !lotteryId) return { error: "ข้อมูลไม่ครบ" };

  let bets: Array<{ number: string; type: string; amount: number }>;
  try { bets = JSON.parse(betsJson); }
  catch { return { error: "ข้อมูลโพยไม่ถูกต้อง" }; }

  if (!bets.length) return { error: "กรุณาเพิ่มตัวเลขก่อนส่งโพย" };

  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  // ตรวจสอบงวดเปิด
  const round = await prisma.lotteryRound.findFirst({
    where: { lotteryTypeId: lotteryId, status: "open" },
  });
  if (!round) return { error: "หวยนี้ปิดรับแทงแล้ว" };

  // ดึง BetRate ทั้งหมดสำหรับ lotteryType นี้ (query เดียว)
  const rates = await prisma.betRate.findMany({
    where: { lotteryTypeId: lotteryId },
  });
  const rateMap = Object.fromEntries(rates.map((r) => [r.betType, r]));

  // ตรวจสอบทุก bet
  for (const bet of bets) {
    if (bet.amount < 1) return { error: `ยอดแทงขั้นต่ำ 1 บาท (เลข ${bet.number})` };
    const dbType = BET_TYPE_MAP[bet.type];
    if (!dbType) return { error: `ประเภทการแทงไม่ถูกต้อง: ${bet.type}` };
    const rate = rateMap[dbType];
    if (!rate) return { error: `ไม่มีอัตราจ่ายสำหรับประเภท ${bet.type}` };
    if (bet.amount > Number(rate.maxAmount)) return { error: `ยอดแทงสูงสุด ฿${rate.maxAmount} (เลข ${bet.number})` };
  }

  const total = bets.reduce((s, b) => s + b.amount, 0);
  if (user.balance < total) return { error: `ยอดเงินไม่เพียงพอ (มี ฿${user.balance.toFixed(2)})` };

  const slipNo = `SLP${Date.now().toString(36).toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data:  { balance: { decrement: total } },
    });

    await tx.betSlip.create({
      data: {
        slipNo,
        userId:      user.id,
        roundId:     round.id,
        totalAmount: total,
        totalPayout: bets.reduce((s, bet) => {
          const dbType = BET_TYPE_MAP[bet.type]!;
          return s + bet.amount * Number(rateMap[dbType].payRate);
        }, 0),
        status:      "confirmed",
        confirmedAt: new Date(),
        items: {
          create: bets.map((bet) => {
            const dbType = BET_TYPE_MAP[bet.type]!;
            const payRate = Number(rateMap[dbType].payRate);
            return {
              number:  bet.number,
              betType: dbType,
              amount:  bet.amount,
              payRate,
              payout:  bet.amount * payRate,
            };
          }),
        },
      },
    });

    await tx.transaction.create({
      data: {
        userId:        user.id,
        type:          "bet",
        amount:        -total,
        balanceBefore: user.balance,
        balanceAfter:  user.balance - total,
        referenceId:   slipNo,
        note:          `แทงหวย ${bets.length} รายการ`,
        status:        "completed",
      },
    });
  });

  return { success: true, slipId: slipNo, totalAmount: total };
}

// ─── Spin Wheel ──────────────────────────────────────────────────────────────
export async function spinWheelAction(): Promise<{
  error?: string;
  prize?: number;
  diamond?: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };
  if (user.diamond < 1) return { error: "Diamond ไม่เพียงพอ" };

  const PRIZES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const prize  = PRIZES[Math.floor(Math.random() * PRIZES.length)];

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: {
        diamond: { decrement: 1 },
        balance: { increment: prize },
      },
    });

    await tx.transaction.create({
      data: {
        userId:        user.id,
        type:          "win",
        amount:        prize,
        balanceBefore: Number(user.balance),
        balanceAfter:  Number(user.balance) + prize,
        referenceId:   "spin",
        note:          `หมุนวงล้อ ได้รับ ฿${prize}`,
        status:        "completed",
      },
    });

    return u;
  });

  return { prize, diamond: updated.diamond };
}

// ─── Security & Login History ────────────────────────────────────────────────
export async function getLoginHistoryAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20, // ดึงมาแสดง 20 รายการล่าสุด
  });
}
