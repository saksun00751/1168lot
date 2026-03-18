import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/session/auth";

export const metadata: Metadata = { title: "ติดต่อเรา — Lotto" };

export default async function ContactPage() {
  const user = await requireAuth();
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-ap-primary tracking-tight">ติดต่อเรา</h1>
          <p className="text-[14px] text-ap-secondary mt-1">พร้อมให้บริการตลอด 24 ชั่วโมง</p>
        </div>

        {/* Line Card */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {/* Top bar */}
          <div className="h-2 bg-[#06C755]" />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#06C755] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-ap-primary">Line Official</h2>
                <p className="text-[13px] text-ap-secondary mt-0.5">ช่องทางหลักสำหรับติดต่อ</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">Line ID</span>
                <span className="text-[14px] font-bold text-ap-primary font-mono">@1168lot</span>
              </div>
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">เวลาทำการ</span>
                <span className="text-[14px] font-semibold text-ap-primary">ตลอด 24 ชม.</span>
              </div>
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">ตอบกลับภายใน</span>
                <span className="text-[14px] font-semibold text-ap-green">5 นาที</span>
              </div>
            </div>

            <a
              href="https://line.me/ti/p/~@1168lot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-[#06C755] text-white rounded-full py-3 text-[14px] font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z"/>
              </svg>
              เพิ่มเพื่อนใน Line
            </a>
          </div>
        </div>

        {/* Telegram Card */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {/* Top bar */}
          <div className="h-2 bg-[#2AABEE]" />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2AABEE] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-ap-primary">Telegram</h2>
                <p className="text-[13px] text-ap-secondary mt-0.5">รับข่าวสารและโปรโมชั่น</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">Username</span>
                <span className="text-[14px] font-bold text-ap-primary font-mono">@1168lot</span>
              </div>
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">เวลาทำการ</span>
                <span className="text-[14px] font-semibold text-ap-primary">ตลอด 24 ชม.</span>
              </div>
              <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                <span className="text-[13px] text-ap-secondary">ตอบกลับภายใน</span>
                <span className="text-[14px] font-semibold text-ap-green">10 นาที</span>
              </div>
            </div>

            <a
              href="https://t.me/1168lot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-[#2AABEE] text-white rounded-full py-3 text-[14px] font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              เปิด Telegram
            </a>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-[12px] text-ap-tertiary pb-2">
          หากมีปัญหาเร่งด่วน กรุณาติดต่อผ่าน Line เพื่อรับการตอบกลับที่รวดเร็วที่สุด
        </p>

      </div>
    </div>
  );
}
