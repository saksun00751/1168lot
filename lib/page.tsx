import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/session/auth";
import { getLoginHistoryAction } from "@/lib/actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ความปลอดภัย — Lotto",
};

export default async function SecurityPage() {
  const user = await requireAuth();
  const history = await getLoginHistoryAction();

  // Helper สำหรับจัดฟอร์แมตวันที่
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-ap-bg">
      <Navbar 
        balance={user.balance} 
        userName={user.displayName ?? "สมาชิก"} 
        userPhone={user.phone} 
      />
      
      <main className="max-w-2xl mx-auto p-5 pt-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile" className="p-2 rounded-full hover:bg-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-ap-primary">ความปลอดภัย</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card-xl border border-ap-border overflow-hidden">
          <div className="p-5 border-b border-ap-border bg-gray-50/50">
            <h2 className="font-semibold text-ap-primary">ประวัติการเข้าใช้งานล่าสุด</h2>
            <p className="text-sm text-ap-tertiary">รายการอุปกรณ์ที่เข้าสู่ระบบบัญชีของคุณ</p>
          </div>

          <div className="divide-y divide-ap-border">
            {history.length > 0 ? (
              history.map((session: any) => (
                <div key={session.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-ap-blue/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ap-blue">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-ap-primary">เข้าสู่ระบบสำเร็จ</p>
                      <span className="text-[12px] text-ap-tertiary">{formatDate(session.createdAt)}</span>
                    </div>
                    <p className="text-sm text-ap-secondary mt-1">
                      {session.userAgent || "ไม่ระบุอุปกรณ์"}
                    </p>
                    {session.ipAddress && (
                      <p className="text-[12px] text-ap-tertiary mt-1">IP: {session.ipAddress}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-ap-tertiary">
                ไม่พบประวัติการเข้าใช้งาน
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center text-sm text-ap-tertiary mt-6">
          หากคุณพบรายการที่น่าสงสัย กรุณาเปลี่ยนรหัสผ่านทันที
        </p>
      </main>
    </div>
  );
}