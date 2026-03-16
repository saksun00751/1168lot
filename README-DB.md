# 🗄️ Prisma + MariaDB Setup Guide

## 1. Install dependencies

```bash
npm install
# auto-runs: prisma generate (via postinstall)
```

## 2. Create MariaDB database & user

```sql
-- Run as MariaDB root
CREATE DATABASE lotto_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lotto_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON lotto_db.* TO 'lotto_user'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="mysql://lotto_user:your_strong_password@127.0.0.1:3306/lotto_db"
SESSION_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

## 4. Run Prisma migration (creates all tables)

```bash
# First time — creates migration + applies it
npx prisma migrate dev --name init

# Or just push schema without migration history
npx prisma db push
```

## 5. (Optional) Seed demo user

```bash
npm run db:seed
# Creates: phone=0812345678  password=demo1234
```

## 6. Start dev server

```bash
npm run dev   # → http://localhost:3000
```

---

## Useful Prisma Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Regenerate Prisma Client after schema change |
| `npm run db:migrate` | Create + apply new migration |
| `npm run db:push` | Push schema changes directly (no migration file) |
| `npm run db:studio` | Open Prisma Studio (GUI for the database) |
| `npx prisma migrate reset` | Drop DB and re-run all migrations |

---

## Schema Overview

```
User        — สมาชิก (phone, bcrypt hash, balance, level)
OtpCode     — OTP 6 หลัก (TTL 5 นาที, mark used_at เมื่อใช้)
Session     — session token (TTL 7 วัน, HTTP-only cookie)
```

## Auth Flows

### Register
1. Validate → `phoneExists()` check → `bcrypt.hash(password, 12)`
2. `prisma.user.create()` → return success

### Login — OTP
1. `findUserByPhone()` → error if not found
2. `createOtp()` → `crypto.randomInt()` → `prisma.otpCode.create()`
3. `sendOtpSms()` → console (dev) / Twilio (prod)
4. User submits → `verifyOtp()` → mark `usedAt`
5. `createSession()` → `prisma.session.create()` → set cookie

### Login — Password
1. `findUserByPhone()` → load hash
2. `bcrypt.compare()` constant-time even if user not found
3. `createSession()` → set cookie

### Logout
1. `destroySession()` → `prisma.session.deleteMany()`
2. `clearSessionCookie()`
3. `redirect("/login")`

## Security
- Passwords: bcrypt cost 12
- Sessions: `crypto.randomBytes(32)` — 64-char hex
- OTPs: `crypto.randomInt()` — cryptographically secure
- Cookie: `HttpOnly`, `Secure` (prod), `SameSite=Lax`
- Timing attack prevention: bcrypt.compare() runs even when user not found
