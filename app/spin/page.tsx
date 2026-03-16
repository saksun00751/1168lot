import type { Metadata } from "next";
import SpinPage from "@/components/spin/SpinPage";
import { requireAuth } from "@/lib/session/auth";

export const metadata: Metadata = { title: "หมุนวงล้อ — Lotto" };

export default async function SpinRoute() {
  const user = await requireAuth();
  return <SpinPage user={user} />;
}
