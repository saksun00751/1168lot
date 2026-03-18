"use client";
import { BetTypeId, BET_TYPE_BTNS } from "./types";
import type { BetRateRow } from "@/lib/db/lottery";

interface Props {
  betType:   BetTypeId;
  onChange:  (id: BetTypeId) => void;
  betRates?: BetRateRow[];
}

export default function BetTypeSelector({ betType, onChange, betRates = [] }: Props) {
  // ถ้ามี betRates จาก DB ใช้นั้น ถ้าไม่มีใช้ hardcode fallback
  const buttons = betRates.length > 0
    ? betRates.map((r) => ({ id: r.id, label: r.label, rate: r.rate }))
    : BET_TYPE_BTNS.map((b) => ({ id: b.id, label: b.label, rate: b.rate }));

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border p-4">
      <p className="text-[12px] font-semibold text-ap-secondary uppercase tracking-wider mb-3">ประเภทการแทง</p>
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((bt) => {
          const active = betType === bt.id;
          return (
            <button key={bt.id} onClick={() => onChange(bt.id)}
              className={[
                "flex items-center gap-2.5 px-3 py-3 rounded-2xl border-2 transition-all active:scale-95 text-left",
                active
                  ? "border-violet-400 bg-violet-50"
                  : "border-ap-border bg-ap-bg hover:border-ap-blue/30",
              ].join(" ")}>
              <span className={[
                "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all",
                active ? "border-violet-500 bg-violet-500" : "border-ap-border bg-white",
              ].join(" ")} />
              <div>
                <p className={`text-[13px] font-bold leading-tight ${active ? "text-violet-700" : "text-ap-primary"}`}>{bt.label}</p>
                <p className={`text-[11px] mt-0.5 ${active ? "text-violet-500" : "text-ap-secondary"}`}>จ่าย {bt.rate}x</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
