"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions";

interface NavbarProps {
  balance?: number;
  userName?: string;
  userPhone?: string;
}

export default function Navbar({
  balance = 6.19,
  userName = "สมาชิก",
  userPhone = "098-7XX-XXXX",
}: NavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [profileOpen]);

  const navLinks = [
    { href: "/dashboard", label: "หน้าแรก",  icon: "🏠" },
    { href: "/deposit",   label: "เติมเงิน",  icon: "💰" },
    { href: "/bet",       label: "แทงหวย",   icon: "🎯" },
    { href: "/withdraw",  label: "ถอนเงิน",  icon: "💸" },
    { href: "/profile",   label: "สมาชิก",   icon: "👤" },
  ];

  const profileMenuItems = [
    { icon: "👤", label: "ข้อมูลสมาชิก",    href: "/profile" },
    { icon: "🎁", label: "แนะนำเพื่อน",     href: "/referral" },
    { icon: "🔔", label: "การแจ้งเตือน",     href: "/notifications" },
    { icon: "📋", label: "ประวัติการแทง",    href: "/history" },
    { icon: "💳", label: "ประวัติการเงิน",   href: "/transactions" },
    { icon: "🔐", label: "เปลี่ยนรหัสผ่าน",  href: "/change-password" },
    { icon: "💫", label: "หมุนวงล้อ",        href: "/spin" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-ap-border">
        <div className="max-w-5xl mx-auto px-5 h-[56px] flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-[10px] bg-ap-blue flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="white" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[16px] font-bold text-ap-primary tracking-tight">Lotto</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href}
                  className={["flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all",
                    active ? "bg-ap-blue/10 text-ap-blue" : "text-ap-secondary hover:bg-ap-bg hover:text-ap-primary"].join(" ")}>
                  <span className="text-[14px]">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Balance chip */}
            <Link href="/deposit"
              className="flex items-center gap-2 bg-ap-bg border border-ap-border rounded-full px-3.5 py-1.5 hover:border-ap-blue/30 transition-colors">
              <span className="text-[13px]">💰</span>
              <span className="text-[13px] font-semibold text-ap-primary tabular-nums">฿{balance.toFixed(2)}</span>
              <span className="text-[11px] text-ap-blue font-medium">+ เติม</span>
            </Link>

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={["w-8 h-8 rounded-full bg-ap-blue flex items-center justify-center text-white text-[13px] font-bold shadow-sm transition-all",
                  profileOpen ? "ring-2 ring-ap-blue/30 shadow-md" : "hover:shadow-md"].join(" ")}
              >
                {userName.slice(0, 1).toUpperCase()}
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white rounded-2xl shadow-card-xl border border-ap-border overflow-hidden animate-pop-in z-50">
                  {/* User info header */}
                  <div className="px-4 py-3.5 border-b border-ap-border bg-ap-bg/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ap-blue flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
                        {userName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-ap-primary truncate">{userName}</p>
                        <p className="text-[12px] text-ap-tertiary">{userPhone}</p>
                      </div>
                    </div>
                    {/* Balance in dropdown */}
                    <div className="mt-3 flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-ap-border">
                      <span className="text-[12px] text-ap-secondary">ยอดคงเหลือ</span>
                      <span className="text-[14px] font-bold text-ap-blue tabular-nums">฿{balance.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-ap-primary hover:bg-ap-bg"
                      >
                        <span className="text-[16px] w-5 text-center flex-shrink-0">{item.icon}</span>
                        {item.label}
                        {item.href === "/referral" && (
                          <span className="ml-auto text-[10px] font-bold text-white bg-ap-red rounded-full px-1.5 py-0.5">ใหม่</span>
                        )}
                        {item.href !== "/referral" && (
                          <svg className="ml-auto w-3.5 h-3.5 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </Link>
                    ))}
                    {/* Logout */}
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-ap-red hover:bg-ap-red/5"
                      >
                        <span className="text-[16px] w-5 text-center flex-shrink-0">🚪</span>
                        ออกจากระบบ
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-ap-border z-40">
        <div className="flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} href={l.href}
                className={["flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-ap-blue" : "text-ap-tertiary"].join(" ")}>
                <span className="text-[20px] leading-none">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
