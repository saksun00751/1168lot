"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction } from "@/lib/actions";

const THAI_BANKS = [
  { code: "BBL",   name: "ธนาคารกรุงเทพ",              logo: "🏦" },
  { code: "KBANK", name: "ธนาคารกสิกรไทย",             logo: "🟢" },
  { code: "SCB",   name: "ธนาคารไทยพาณิชย์",           logo: "🟣" },
  { code: "KTB",   name: "ธนาคารกรุงไทย",              logo: "🔵" },
  { code: "BAY",   name: "ธนาคารกรุงศรีอยุธยา",        logo: "🟡" },
  { code: "TTB",   name: "ธนาคารทหารไทยธนชาต",         logo: "🔷" },
  { code: "GSB",   name: "ธนาคารออมสิน",               logo: "💛" },
  { code: "GHB",   name: "ธนาคารอาคารสงเคราะห์",       logo: "🟠" },
  { code: "BAAC",  name: "ธนาคารเพื่อการเกษตร (ธ.ก.ส.)", logo: "🌾" },
  { code: "UOB",   name: "ธนาคารยูโอบี",               logo: "🔴" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ap-blue text-white rounded-full py-3 text-[14px] font-semibold disabled:opacity-40 hover:bg-ap-blue-h transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กำลังบันทึก…
        </>
      ) : "บันทึกข้อมูล"}
    </button>
  );
}

function formatAccountInput(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 12);
}

interface Props {
  /** ส่ง true เมื่อ user ยังไม่มีข้อมูลธนาคาร */
  open: boolean;
  currentDisplayName?: string | null;
}

export default function CompleteProfileModal({ open, currentDisplayName }: Props) {
  const [visible, setVisible] = useState(open);
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [done, setDone] = useState(false);

  const [state, action] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      setDone(true);
      setTimeout(() => {
        setVisible(false);
        // รีโหลดหน้าเพื่อให้ Server Component ดึงข้อมูลใหม่
        window.location.reload();
      }, 1200);
    }
  }, [state.success]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-up">

        {/* Header */}
        <div className="bg-ap-blue px-6 pt-6 pb-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] mb-3 border border-white/20">
              🏦
            </div>
            <h2 className="text-[20px] font-bold leading-tight">ตั้งค่าข้อมูลบัญชี</h2>
            <p className="text-[13px] text-white/70 mt-1">กรุณากรอกข้อมูลเพื่อรับรางวัลจากการแทง</p>
          </div>
        </div>

        {/* Success state */}
        {done ? (
          <div className="px-6 py-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-bold text-ap-primary">บันทึกสำเร็จ!</p>
            <p className="text-[13px] text-ap-secondary mt-1">กำลังโหลดข้อมูลใหม่…</p>
          </div>
        ) : (
          <form action={action} className="px-6 py-5 space-y-4">

            {/* Global error */}
            {state.error && (
              <div className="flex items-start gap-2.5 bg-ap-red/5 border border-ap-red/20 rounded-2xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-ap-red flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-[13px] text-ap-red">{state.error}</p>
              </div>
            )}

            {/* Display Name */}
            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                ชื่อที่แสดง
              </label>
              <input
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className={[
                  "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary placeholder-ap-tertiary outline-none transition-all",
                  "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                  state.fieldErrors?.displayName ? "border-ap-red bg-ap-red/5" : "border-ap-border bg-white",
                ].join(" ")}
              />
              {state.fieldErrors?.displayName && (
                <p className="text-[12px] text-ap-red mt-1">{state.fieldErrors.displayName}</p>
              )}
            </div>

            {/* Bank selector */}
            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                ธนาคาร
              </label>
              <select
                name="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={[
                  "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary outline-none transition-all appearance-none bg-white",
                  "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                  state.fieldErrors?.bankName ? "border-ap-red bg-ap-red/5" : "border-ap-border",
                  !bankName ? "text-ap-tertiary" : "",
                ].join(" ")}
              >
                <option value="" disabled>เลือกธนาคาร…</option>
                {THAI_BANKS.map((b) => (
                  <option key={b.code} value={b.name}>
                    {b.logo} {b.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.bankName && (
                <p className="text-[12px] text-ap-red mt-1">{state.fieldErrors.bankName}</p>
              )}
            </div>

            {/* Bank account */}
            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                เลขที่บัญชี
              </label>
              <input
                name="bankAccount"
                inputMode="numeric"
                value={bankAccount}
                onChange={(e) => setBankAccount(formatAccountInput(e.target.value))}
                placeholder="กรอกเลขบัญชี 10–12 หลัก"
                className={[
                  "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary placeholder-ap-tertiary outline-none transition-all font-mono tracking-wider",
                  "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                  state.fieldErrors?.bankAccount ? "border-ap-red bg-ap-red/5" : "border-ap-border bg-white",
                ].join(" ")}
              />
              {state.fieldErrors?.bankAccount ? (
                <p className="text-[12px] text-ap-red mt-1">{state.fieldErrors.bankAccount}</p>
              ) : (
                <p className="text-[11px] text-ap-tertiary mt-1">ตัวเลขเท่านั้น ไม่ต้องใส่ขีด</p>
              )}
            </div>

            <div className="pt-1">
              <SubmitButton />
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
