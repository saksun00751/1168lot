import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompleteProfileModal from "@/components/profile/CompleteProfileModal";
import RefreshButton from "@/components/dashboard/RefreshButton";
import { requireAuth } from "@/lib/session/auth";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "หน้าหลัก — Lotto" };

const payoutRates = [
  { label: "3 ตัวบน", rate: "900", emoji: "🏆" },
  { label: "3 ตัวโต๊ด", rate: "150", emoji: "🎲" },
  { label: "2 ตัวบน", rate: "95", emoji: "⭐" },
  { label: "2 ตัวล่าง", rate: "95", emoji: "✨" },
  { label: "วิ่งบน", rate: "3.5", emoji: "💨" },
  { label: "วิ่งล่าง", rate: "4.5", emoji: "💫" },
];

// ─── Groupings ─────────────────────────────────────────────────────────────────
const LOTTO_IDS    = ["thai", "foreign", "thai_stock", "foreign_stock"];
const YEEKEE_IDS   = ["yeekee_speed", "yeekee_super"];
const GAME_IDS     = ["slot", "casino", "sport"];

function byIds(ids: string[]) {
  return ids.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);
}

// ─── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, size = "md" }: { cat: Category; size?: "md" | "lg" }) {
  const openCount = cat.items.filter((i) => i.isOpen).length;

  return (
    <Link
      href={`/category/${cat.id}`}
      className={`bg-white rounded-2xl text-ap-primary relative overflow-hidden group hover:shadow-card-hover active:scale-[0.98] transition-all shadow-card border border-ap-border ${
        size === "lg" ? "p-5" : "p-4"
      }`}
    >
      <div className="relative">
        <div className={`${size === "lg" ? "text-[36px]" : "text-[28px]"} mb-2`}>{cat.emoji}</div>
        <div className={`font-bold tracking-tight leading-tight ${size === "lg" ? "text-[17px]" : "text-[15px]"}`}>
          {cat.label}
        </div>
        <div className={`text-ap-secondary mt-0.5 ${size === "lg" ? "text-[12px]" : "text-[11px]"}`}>
          {cat.badge}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 bg-ap-bg rounded-full px-3 py-1 text-[11px] font-semibold text-ap-secondary group-hover:bg-ap-blue group-hover:text-white transition-colors">
            เข้าเล่น →
          </span>
          {openCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-ap-bg rounded-full px-2 py-0.5 text-ap-green">
              <span className="w-1.5 h-1.5 rounded-full bg-ap-green animate-pulse inline-block" />
              {openCount} Live
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const user = await requireAuth();
  const needsProfile = !user.bankAccount;
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  const lottoCategories  = byIds(LOTTO_IDS);
  const yeekeeCategories = byIds(YEEKEE_IDS);
  const gameCategories   = byIds(GAME_IDS);

  const totalOpen = CATEGORIES.flatMap((c) => c.items).filter((i) => i.isOpen).length;

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <CompleteProfileModal open={needsProfile} currentDisplayName={user.displayName} />
      <Navbar balance={user.balance} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">

        {/* Balance Card */}
        <div className="bg-ap-blue rounded-3xl overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />

          {/* Header */}
          <div className="relative flex items-center gap-2.5 px-4 pt-4 pb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 flex-1 min-w-0">
              <div className="bg-white/15 rounded-full px-3 py-1 self-start">
                <span className="text-white font-bold text-[18px] tracking-wider tabular-nums">{user.phone}</span>
              </div>
              {user.displayName && (
                <h3 className="sm:ml-auto text-white font-bold text-[18px] truncate">
                  {user.displayName}
                </h3>
              )}
            </div>
          </div>

          {/* Updated time */}
          <div className="relative px-4 pb-3">
            <span className="text-white/60 text-[14px]">
              ข้อมูลอัพเดทเมื่อ{" "}
              {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })}
              {" "}
              {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
          </div>

          {/* 4-quadrant grid */}
          <div className="relative grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            {/* Center refresh button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <RefreshButton />
            </div>

            {/* Top-left: เครดิต */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">{user.balance.toFixed(2)}</span>
              <span className="text-white/70 text-[11px]">เครดิต</span>
            </div>

            {/* Top-right: Diamond */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">0</span>
              <span className="text-white/70 text-[11px]">Diamond</span>
            </div>

            {/* Bottom-left: คืนยอดเสีย */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">0.00</span>
              <span className="text-white/70 text-[11px]">คืนยอดเสีย</span>
            </div>

            {/* Bottom-right: แนะนำ / ยอดเดือนนี้ */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5">
              <span className="text-white/70 text-[14px]">แนะนำ <span className="text-white font-bold">0</span></span>
              <span className="text-white/70 text-[14px]">ยอดเดือนนี้ <span className="text-white font-bold">0.00</span></span>
            </div>
          </div>
        </div>

        {/* Payout rates */}
        {/* <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">อัตราจ่าย</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {payoutRates.map((r) => (
              <div key={r.label} className="bg-white rounded-2xl p-3 text-center border border-ap-border shadow-card">
                <div className="text-[20px] mb-1">{r.emoji}</div>
                <div className="text-[18px] font-bold text-ap-primary tabular-nums">{r.rate}</div>
                <div className="text-[11px] text-ap-tertiary mt-0.5">{r.label}</div>
              </div>
            ))}
          </div>
        </section> */}

        {/* หวย */}
        <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">หวย</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lottoCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} size="lg" />
            ))}
          </div>
        </section>

        {/* หวยยี่กี */}
        <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">หวยยี่กี</h2>
          <div className="grid grid-cols-2 gap-3">
            {yeekeeCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} size="lg" />
            ))}
          </div>
        </section>

        {/* เกมและกีฬา */}
        <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">เกมและกีฬา</h2>
          <div className="grid grid-cols-3 gap-3">
            {gameCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
