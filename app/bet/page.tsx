import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BetPage from "@/components/bet/BetPage";
import { requireAuth } from "@/lib/session/auth";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/categories";

export const metadata: Metadata = { title: "แทงหวย — Lotto" };

interface Props {
  searchParams?: Promise<{ lottery?: string }>;
}

const LOTTO_IDS  = ["thai", "foreign", "thai_stock", "foreign_stock"];
const YEEKEE_IDS = ["yeekee_speed", "yeekee_super"];
const GAME_IDS   = ["slot", "casino", "sport"];

function byIds(ids: string[]) {
  return ids.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);
}

function CategoryCard({ cat }: { cat: Category }) {
  const openCount = cat.items.filter((i) => i.isOpen).length;
  return (
    <Link
      href={`/category/${cat.id}`}
      className="bg-white rounded-2xl text-ap-primary relative overflow-hidden group hover:shadow-card-hover active:scale-[0.98] transition-all shadow-card border border-ap-border p-4"
    >
      <div className="text-[28px] mb-2">{cat.emoji}</div>
      <div className="font-bold tracking-tight leading-tight text-[15px]">{cat.label}</div>
      <div className="text-ap-secondary mt-0.5 text-[11px]">{cat.badge}</div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 bg-ap-bg rounded-full px-3 py-1 text-[11px] font-semibold text-ap-secondary group-hover:bg-ap-blue group-hover:text-white transition-colors">
          เลือก →
        </span>
        {openCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-ap-bg rounded-full px-2 py-0.5 text-ap-green">
            <span className="w-1.5 h-1.5 rounded-full bg-ap-green animate-pulse inline-block" />
            {openCount} Live
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function BetRoute({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireAuth(), searchParams]);
  const lottery = params?.lottery;
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  // มี lottery param → แสดงหน้าแทงหวย
  if (lottery) {
    return (
      <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
        <Navbar balance={user.balance} userName={user.displayName ?? undefined} userPhone={phone} />
        <BetPage defaultLottery={lottery} />
      </div>
    );
  }

  // ไม่มี lottery param → แสดงหน้าเลือกหมวดหมู่
  const lottoCategories  = byIds(LOTTO_IDS);
  const yeekeeCategories = byIds(YEEKEE_IDS);
  const gameCategories   = byIds(GAME_IDS);

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">

        <div>
          <h1 className="text-[22px] font-bold text-ap-primary mb-1 tracking-tight">แทงหวย</h1>
          <p className="text-[14px] text-ap-secondary">เลือกประเภทหวยที่ต้องการแทง</p>
        </div>

        {/* หวย */}
        <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">หวย</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lottoCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>

        {/* หวยยี่กี */}
        <section>
          <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">หวยยี่กี</h2>
          <div className="grid grid-cols-2 gap-3">
            {yeekeeCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
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
