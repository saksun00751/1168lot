"use client";
import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompleteProfileModal from "@/components/profile/CompleteProfileModal";

const NUM_SEGMENTS = 10;
const segmentAngle = 360 / NUM_SEGMENTS;

const BASE_COLORS = [
  "#FFC107",
  "#FF5722",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#795548",
  "#607D8B",
  "#F44336",
];

const shuffleArray = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Format 10-digit phone → 0XX-XXX-XXXX */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const amounts = Array.from({ length: NUM_SEGMENTS }, (_, i) => (i + 1) * 100);
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function SpinPage({ user }: { user: any }) {
  const displayName = user.displayName ?? "สมาชิก";
  const phone = formatPhone(user.phone);
  const needsProfile = !user.bankAccount;

  const [colors, setColors] = useState(() => shuffleArray(BASE_COLORS).slice(0, NUM_SEGMENTS));
  const [prizes] = useState(amounts);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const index = Math.floor(Math.random() * NUM_SEGMENTS);
    const rounds = getRandomInt(3, 5);

    // คำนวณองศาให้ตรงกับ pointer ที่อยู่ตำแหน่ง 12 นาฬิกา
    const landingDegree = (18 - index * segmentAngle) % 360;
    const targetMod = landingDegree >= 0 ? landingDegree : landingDegree + 360;
    const currentMod = rotation % 360;
    const normalizedCurrent = currentMod >= 0 ? currentMod : currentMod + 360;

    let diff = normalizedCurrent - targetMod;
    if (diff <= 0) diff += 360; // บังคับให้หมุนไปข้างหน้าเสมอ

    const target = rotation - (360 * rounds) - diff;
    setRotation(target);

    const duration = 4200;
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(index);
      alert(`ยินดีด้วย! คุณได้รับ: ฿${prizes[index]}`);
    }, duration);
  };

  return (
    <>
      <CompleteProfileModal open={needsProfile} currentDisplayName={user.displayName} />
      <Navbar balance={user.balance} userName={displayName} userPhone={phone} />
      <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5 pt-6">
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-ap-primary">วงล้อแห่งโชคลาภ</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card-xl border border-ap-border p-6 flex flex-col items-center">
          <div className="w-full mb-3 flex justify-start">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ap-bg border border-ap-border text-ap-primary hover:bg-ap-blue/5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="-rotate-90">
                <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              กลับไปหน้าหลัก
            </Link>
          </div>
          <div className="relative w-80 h-80 mb-10 mt-6">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
              <svg width="36" height="46" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 50L0 20L20 0L40 20L20 50Z" fill="#FF4136"/>
                <circle cx="20" cy="20" r="5" fill="white"/>
              </svg>
            </div>

            <div
              className="w-full h-full rounded-full border-4 border-ap-blue relative overflow-hidden"
              style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)'}}
            >
              {prizes.map((amt, i) => {
                const ang = segmentAngle * i;
                const bg = colors[i];
                return (
                  <div
                    key={i}
                    className="absolute w-1/2 h-1/2"
                    style={{
                      transform: `rotate(${ang}deg)`,
                      transformOrigin: '100% 100%',
                  left: '0',
                  top: '0',
                  clipPath: 'polygon(100% 100%, 100% 0, 27.35% 0)', // สร้างมุม 36 องศาเป๊ะๆ
                      background: bg,
                    }}
              />
                );
              })}

          {/* ข้อความบนวงล้อ */}
          {prizes.map((amt, i) => {
            const textAngle = i * segmentAngle - 18; // กึ่งกลางของแต่ละช่อง
            return (
              <div
                key={`text-${i}`}
                className="absolute w-14 h-6 flex items-center justify-center"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-1.75rem', // ครึ่งนึงของกว้าง
                  marginTop: '-0.75rem',  // ครึ่งนึงของสูง
                  transform: `rotate(${textAngle}deg) translateY(-100px) rotate(${-textAngle}deg)`,
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                <div className="text-sm font-bold">฿{amt}</div>
              </div>
            );
          })}
            </div>

            <div className="absolute w-14 h-14 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-ap-blue flex items-center justify-center font-bold text-ap-blue">
              Lotto
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full bg-ap-blue text-white font-bold py-3 rounded-lg disabled:opacity-60"
          >
            {isSpinning ? 'กำลังหมุน...' : 'หมุนเลย!'}
          </button>
        </div>
      </div>
    </main>
    </>
  );
}
