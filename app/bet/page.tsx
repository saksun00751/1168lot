import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import BetPage from "@/components/bet/BetPage";
import { requireAuth } from "@/lib/session/auth";

export const metadata: Metadata = { title: "แทงหวย — Lotto" };

interface Props {
  searchParams?: Promise<{ lottery?: string }>;
}

export default async function BetRoute({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireAuth(), searchParams]);
  const lottery = params?.lottery ?? "hanoi_1700";
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} userName={user.displayName ?? undefined} userPhone={phone} />
      <BetPage defaultLottery={lottery} />
    </div>
  );
}
