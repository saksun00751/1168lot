"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { placeBetAction } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import type { SubItem } from "@/lib/categories";
import type { BetItem, BetType } from "@/types/auth";

// ─── Submit button ──────────────────────────────────────────────────────────────
function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full bg-ap-blue text-white rounded-full py-3.5 text-[15px] font-semibold disabled:opacity-40 hover:bg-ap-blue-h transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กำลังส่งโพย…
        </>
      ) : (
        <>
          <span>ยืนยันแทงหวย</span>
          <span className="text-white/80">→</span>
        </>
      )}
    </button>
  );
}

// ─── Bet type config ────────────────────────────────────────────────────────────
const BET_TYPES: { id: BetType; label: string; digits: number; rate: number; color: string; dot: string }[] = [
  { id: "3top",    label: "3 ตัวบน",  digits: 3, rate: 900, color: "text-purple-600 bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  { id: "3tod",    label: "3 ตัวโต๊ด",digits: 3, rate: 150, color: "text-pink-600 bg-pink-50 border-pink-200",       dot: "bg-pink-500" },
  { id: "2top",    label: "2 ตัวบน",  digits: 2, rate: 95,  color: "text-ap-blue bg-blue-50 border-blue-200",        dot: "bg-blue-500" },
  { id: "2bot",    label: "2 ตัวล่าง",digits: 2, rate: 95,  color: "text-ap-green bg-green-50 border-green-200",     dot: "bg-green-500" },
  { id: "run_top", label: "วิ่งบน",   digits: 1, rate: 3.5, color: "text-ap-orange bg-orange-50 border-orange-200",  dot: "bg-orange-500" },
  { id: "run_bot", label: "วิ่งล่าง", digits: 1, rate: 4.5, color: "text-yellow-600 bg-yellow-50 border-yellow-200", dot: "bg-yellow-500" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 8); }

function findLotteryAndCategory(id: string) {
  for (const cat of CATEGORIES) {
    const item = cat.items.find((i) => i.id === id);
    if (item) return { item, category: cat };
  }
  return null;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];

// ─── Numpad ─────────────────────────────────────────────────────────────────────
function Numpad({ value, onChange, maxDigits }: { value: string; onChange: (v: string) => void; maxDigits: number }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            if (k === "⌫") onChange(value.slice(0, -1));
            else if (k === "clear") onChange("");
            else if (value.length < maxDigits) onChange(value + k);
          }}
          className={[
            "h-13 rounded-xl text-[17px] font-semibold transition-all active:scale-95 active:bg-ap-border",
            k === "⌫"     ? "bg-ap-red/10 text-ap-red h-[52px]" :
            k === "clear"  ? "bg-ap-orange/10 text-ap-orange text-[12px] h-[52px]" :
            "bg-ap-bg hover:bg-ap-border text-ap-primary h-[52px]",
          ].join(" ")}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── Lottery header card ─────────────────────────────────────────────────────────
function LotteryHeader({
  item,
  backCategoryId,
  backLabel,
}: {
  item: SubItem;
  backCategoryId: string;
  backLabel: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
      <div className={`h-[4px] bg-gradient-to-r ${item.barClass}`} />
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Back */}
        <Link
          href={`/category/${backCategoryId}`}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-ap-bg border border-ap-border text-ap-secondary hover:bg-ap-border transition-colors text-[18px]"
        >
          ←
        </Link>

        {/* Flag + info */}
        <span className="text-[32px] leading-none flex-shrink-0">{item.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-ap-primary truncate">{item.name}</div>
          <div className="text-[11px] text-ap-tertiary mt-0.5">{item.sub}</div>
        </div>

        {/* Status */}
        {item.isOpen ? (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-medium text-ap-red bg-ap-red/8 px-2 py-0.5 rounded-full border border-ap-red/15 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ap-red animate-pulse inline-block" />
              Live
            </span>
            <span className="text-[13px] font-bold text-ap-primary tabular-nums">{item.countdown}</span>
          </div>
        ) : (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[10px] font-medium text-ap-green bg-ap-green/8 px-2 py-0.5 rounded-full border border-ap-green/15 mb-1">
              ✓ ออกแล้ว
            </span>
            {item.result && (
              <span className="text-[12px] font-bold text-ap-primary tabular-nums">
                {item.result.top3} / {item.result.bot2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Back label breadcrumb */}
      <div className="px-4 pb-2.5 flex items-center gap-1 text-[11px] text-ap-tertiary">
        <Link href="/dashboard" className="hover:text-ap-primary transition-colors">หน้าหลัก</Link>
        <span>/</span>
        <Link href={`/category/${backCategoryId}`} className="hover:text-ap-primary transition-colors">{backLabel}</Link>
        <span>/</span>
        <span className="text-ap-secondary font-medium">{item.name}</span>
      </div>
    </div>
  );
}

// ─── In-category switcher ────────────────────────────────────────────────────────
function CategorySwitcher({
  items,
  selectedId,
  onSelect,
}: {
  items: SubItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length <= 1) return null;
  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card p-3">
      <p className="text-[11px] font-semibold text-ap-tertiary uppercase tracking-wide px-1 mb-2">เลือกหวย</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!item.isOpen}
            onClick={() => item.isOpen && onSelect(item.id)}
            className={[
              "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
              !item.isOpen
                ? "opacity-40 cursor-not-allowed border-ap-border bg-ap-bg"
                : item.id === selectedId
                ? "border-ap-blue bg-ap-blue/5 shadow-focus-blue"
                : "border-ap-border bg-ap-bg hover:border-ap-blue/40",
            ].join(" ")}
          >
            <span className="text-[18px]">{item.flag}</span>
            <div className="text-left">
              <div className={`text-[12px] font-semibold whitespace-nowrap ${item.id === selectedId ? "text-ap-blue" : "text-ap-primary"}`}>
                {item.name}
              </div>
              <div className="text-[10px] mt-0.5">
                {item.isOpen
                  ? <span className="text-ap-red font-medium">● {item.countdown}</span>
                  : <span className="text-ap-tertiary">ปิดรับแล้ว</span>}
              </div>
            </div>
            {item.id === selectedId && (
              <svg className="w-3.5 h-3.5 text-ap-blue flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────
export default function BetPage({ defaultLottery = "hanoi_1700" }: { defaultLottery?: string }) {
  const [state, action] = useActionState(placeBetAction, {});

  // Resolve lottery + category
  const resolved   = findLotteryAndCategory(defaultLottery);
  const allOpen    = CATEGORIES.flatMap((c) => c.items).filter((i) => i.isOpen);
  const fallback   = resolved?.category.items.find((i) => i.isOpen) ?? allOpen[0] ?? resolved?.item;

  const [selectedId, setSelectedId] = useState<string>(
    (resolved?.item?.isOpen ? resolved.item.id : fallback?.id) ?? defaultLottery
  );

  const categoryItems  = resolved?.category.items ?? [];
  const currentItem    = categoryItems.find((i) => i.id === selectedId) ?? resolved?.item ?? allOpen[0];
  const backCategoryId = resolved?.category.id ?? "foreign";
  const backLabel      = resolved?.category.label ?? "หวย";

  const [betType, setBetType]       = useState<BetType>("3top");
  const [inputNumber, setInputNumber] = useState("");
  const [amount, setAmount]         = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [betList, setBetList]       = useState<BetItem[]>([]);
  const [showSlip, setShowSlip]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(10);

  const currentType      = BET_TYPES.find((t) => t.id === betType)!;
  const isNumberComplete = inputNumber.length === currentType.digits;
  const totalAmount      = betList.reduce((s, b) => s + b.amount, 0);

  useEffect(() => { setInputNumber(""); }, [betType]);
  useEffect(() => { if (state.success) setShowSlip(true); }, [state]);

  const addBet = useCallback(() => {
    if (!isNumberComplete) return;
    const exists = betList.find((b) => b.number === inputNumber && b.type === betType);
    if (exists) {
      setBetList((prev) => prev.map((b) => b.id === exists.id ? { ...b, amount: b.amount + amount } : b));
    } else {
      setBetList((prev) => [...prev, {
        id: genId(), number: inputNumber, type: betType, amount, payout: currentType.rate,
      }]);
    }
    setInputNumber("");
  }, [isNumberComplete, inputNumber, betType, betList, amount, currentType.rate]);

  const removeBet = (id: string) => setBetList((prev) => prev.filter((b) => b.id !== id));
  const clearAll  = () => { setBetList([]); setInputNumber(""); };

  const betTypeLabel = (type: BetType) => BET_TYPES.find((t) => t.id === type)?.label ?? type;
  const betTypeColor = (type: BetType) => BET_TYPES.find((t) => t.id === type)?.color ?? "";

  // ── Success slip overlay ─────────────────────────────────────────────────────
  if (state.success && showSlip) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-[28px] w-full max-w-sm p-7 shadow-card-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-ap-primary">ส่งโพยสำเร็จ! 🎉</h2>
            <p className="text-[13px] text-ap-secondary mt-1">
              เลขโพย: <span className="font-mono font-bold text-ap-primary">{state.slipId}</span>
            </p>
          </div>

          <div className="bg-ap-bg rounded-2xl p-4 mb-5 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-ap-secondary">หวย</span>
              <span className="font-medium text-ap-primary">{currentItem?.flag} {currentItem?.name}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-ap-secondary">จำนวนรายการ</span>
              <span className="font-medium text-ap-primary">{betList.length} รายการ</span>
            </div>
            <div className="h-px bg-ap-border" />
            <div className="flex justify-between text-[15px]">
              <span className="font-semibold text-ap-primary">ยอดรวม</span>
              <span className="font-bold text-ap-blue tabular-nums">฿{state.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => { setBetList([]); setShowSlip(false); }}
              className="w-full bg-ap-blue text-white rounded-full py-3 text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              แทงรอบถัดไป
            </button>
            <Link
              href="/dashboard"
              className="w-full text-center text-ap-secondary text-[14px] py-2 hover:text-ap-primary transition-colors"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not open notice ──────────────────────────────────────────────────────────
  if (currentItem && !currentItem.isOpen) {
    return (
      <div className="max-w-md mx-auto px-4 pt-8">
        <LotteryHeader item={currentItem} backCategoryId={backCategoryId} backLabel={backLabel} />
        <div className="mt-6 bg-white rounded-2xl border border-ap-border shadow-card p-8 text-center">
          <div className="text-[48px] mb-3">🔒</div>
          <h2 className="text-[17px] font-bold text-ap-primary mb-2">ปิดรับแทงแล้ว</h2>
          {currentItem.result && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-ap-bg rounded-xl p-3 text-center">
                <div className="text-[24px] font-bold text-ap-primary tabular-nums">{currentItem.result.top3}</div>
                <div className="text-[11px] text-ap-tertiary">3 ตัวบน</div>
              </div>
              <div className="bg-ap-bg rounded-xl p-3 text-center">
                <div className="text-[24px] font-bold text-ap-primary tabular-nums">{currentItem.result.bot2}</div>
                <div className="text-[11px] text-ap-tertiary">2 ตัวล่าง</div>
              </div>
            </div>
          )}
          <Link
            href={`/category/${backCategoryId}`}
            className="mt-5 inline-block text-[13px] text-ap-blue font-semibold hover:underline"
          >
            ← ดูหวยอื่นในหมวดนี้
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-5 pb-32 sm:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

        {/* ─── LEFT ────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Lottery header */}
          {currentItem && (
            <LotteryHeader item={currentItem} backCategoryId={backCategoryId} backLabel={backLabel} />
          )}

          {/* In-category switcher */}
          <CategorySwitcher items={categoryItems} selectedId={selectedId} onSelect={setSelectedId} />

          {/* Bet type */}
          <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4">
            <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide mb-3">ประเภทการแทง</p>
            <div className="grid grid-cols-3 gap-2">
              {BET_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBetType(t.id)}
                  className={[
                    "flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all",
                    betType === t.id
                      ? `border-current ${t.color} font-semibold shadow-sm`
                      : "border-ap-border bg-ap-bg text-ap-secondary hover:border-ap-blue/30",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${betType === t.id ? t.dot : "bg-ap-border"}`} />
                    <span className="text-[13px] font-semibold">{t.label}</span>
                  </div>
                  <span className="text-[11px] opacity-70">จ่าย {t.rate}x</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number input */}
          <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4">
            <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide mb-3">
              กรอกตัวเลข ({currentType.digits} หลัก)
            </p>

            {/* Number display */}
            <div className="flex justify-center mb-5">
              <div className="flex gap-2.5">
                {Array.from({ length: currentType.digits }).map((_, i) => (
                  <div
                    key={i}
                    className={[
                      "w-[58px] h-[68px] rounded-2xl flex items-center justify-center text-[34px] font-bold transition-all",
                      inputNumber[i]
                        ? `bg-ap-primary text-white shadow-md`
                        : "bg-ap-bg border-2 border-dashed border-ap-border text-ap-tertiary",
                    ].join(" ")}
                  >
                    {inputNumber[i] ?? "·"}
                  </div>
                ))}
              </div>
            </div>

            <Numpad value={inputNumber} onChange={setInputNumber} maxDigits={currentType.digits} />
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4">
            <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide mb-3">ยอดแทง (บาท)</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={[
                    "py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all",
                    amount === a && !customAmount
                      ? "border-ap-blue bg-ap-blue/8 text-ap-blue shadow-focus-blue"
                      : "border-ap-border bg-ap-bg text-ap-secondary hover:border-ap-blue/30",
                  ].join(" ")}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-ap-secondary flex-shrink-0">กำหนดเอง:</span>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v > 0) setAmount(v);
                }}
                placeholder="ระบุจำนวน"
                className="flex-1 bg-ap-bg border border-ap-border rounded-xl px-3 py-2 text-[14px] text-ap-primary outline-none focus:border-ap-blue focus:shadow-focus-blue"
              />
              <span className="text-[13px] text-ap-secondary flex-shrink-0">บาท</span>
            </div>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={addBet}
            disabled={!isNumberComplete}
            className={[
              "w-full rounded-2xl py-4 text-[15px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
              isNumberComplete
                ? "bg-ap-primary text-white hover:bg-black shadow-md"
                : "bg-ap-bg border-2 border-dashed border-ap-border text-ap-tertiary cursor-not-allowed",
            ].join(" ")}
          >
            {isNumberComplete ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" strokeLinecap="round" />
                </svg>
                เพิ่ม {inputNumber} ({currentType.label}) ฿{amount}
              </>
            ) : (
              <>กรอกเลข {currentType.digits} หลักก่อน</>
            )}
          </button>
        </div>

        {/* ─── RIGHT: Bet slip ──────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-[72px] lg:self-start">
          <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">

            {/* Slip header */}
            <div className="px-5 py-4 border-b border-ap-border flex items-center justify-between bg-ap-bg/40">
              <div>
                <h2 className="text-[15px] font-bold text-ap-primary">📋 โพยหวย</h2>
                <p className="text-[12px] text-ap-secondary mt-0.5">
                  {currentItem?.flag} {currentItem?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-ap-blue text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tabular-nums">
                  {betList.length} รายการ
                </span>
                {betList.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[12px] text-ap-red hover:opacity-70 transition-opacity"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>
            </div>

            {/* Slip items */}
            <div className="divide-y divide-ap-border max-h-[400px] overflow-y-auto">
              {betList.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-[40px] mb-2">📋</div>
                  <p className="text-[13px] font-medium text-ap-secondary">ยังไม่มีรายการ</p>
                  <p className="text-[12px] text-ap-tertiary mt-1">กรอกตัวเลขแล้วกดเพิ่ม</p>
                </div>
              ) : (
                betList.map((bet) => (
                  <div key={bet.id} className="px-4 py-3 flex items-center gap-3 group hover:bg-ap-bg/50 transition-colors">
                    {/* Number box */}
                    <div className="w-12 h-12 rounded-xl bg-ap-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-[15px] tabular-nums tracking-wider">{bet.number}</span>
                    </div>

                    {/* Type + amount */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${betTypeColor(bet.type)}`}>
                        {betTypeLabel(bet.type)}
                      </span>
                      {editingId === bet.id ? (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <input
                            type="number"
                            min="1"
                            value={editAmount}
                            onChange={(e) => setEditAmount(parseInt(e.target.value) || 1)}
                            className="w-20 bg-ap-bg border border-ap-blue rounded-lg px-2 py-1 text-[13px] outline-none"
                            autoFocus
                          />
                          <button type="button" onClick={() => {
                            setBetList((prev) => prev.map((b) => b.id === bet.id ? { ...b, amount: editAmount } : b));
                            setEditingId(null);
                          }} className="text-[11px] text-ap-blue font-semibold">✓</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-[11px] text-ap-tertiary">✕</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingId(bet.id); setEditAmount(bet.amount); }}
                          className="block mt-1 text-[13px] font-semibold text-ap-primary hover:text-ap-blue transition-colors"
                        >
                          ฿{bet.amount.toLocaleString()}
                          <span className="text-[10px] text-ap-tertiary font-normal ml-1">แตะแก้ไข</span>
                        </button>
                      )}
                    </div>

                    {/* Payout */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-ap-tertiary">ชนะสูงสุด</div>
                      <div className="text-[13px] font-bold text-ap-green tabular-nums">
                        ฿{(bet.amount * bet.payout).toLocaleString()}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeBet(bet.id)}
                      className="w-7 h-7 rounded-full bg-ap-red/8 text-ap-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Slip footer */}
            {betList.length > 0 && (
              <div className="border-t border-ap-border px-5 py-4 bg-ap-bg/50">
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ap-secondary">จำนวนรายการ</span>
                    <span className="font-medium text-ap-primary">{betList.length} รายการ</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ap-secondary">ยอดรวมแทง</span>
                    <span className="font-bold text-ap-primary tabular-nums">฿{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ap-secondary">ชนะสูงสุด</span>
                    <span className="font-bold text-ap-green tabular-nums">
                      ฿{betList.reduce((s, b) => s + b.amount * b.payout, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {state.error && (
                  <p className="text-[12px] text-ap-red bg-ap-red/5 border border-ap-red/20 rounded-xl px-3 py-2 mb-3">
                    ⚠ {state.error}
                  </p>
                )}

                <form action={action}>
                  <input type="hidden" name="lotteryId" value={selectedId} />
                  <input type="hidden" name="bets" value={JSON.stringify(
                    betList.map(({ number, type, amount }) => ({ number, type, amount }))
                  )} />
                  <SubmitButton disabled={betList.length === 0} />
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
