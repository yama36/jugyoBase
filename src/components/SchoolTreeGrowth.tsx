"use client";

import { useEffect, useState, useRef } from "react";

const MILESTONES = [10, 20, 30, 50, 70, 100] as const;

function getStage(total: number) {
  if (total === 0) return { stage: 0, label: "土", description: "最初の1件を共有してみましょう" };
  if (total < 10) return { stage: 1, label: "芽吹", description: "小さな芽が顔を出しました" };
  if (total < 20) return { stage: 2, label: "苗木", description: "少しずつ幹が伸びています" };
  if (total < 30) return { stage: 3, label: "若木", description: "着実に根を張っています" };
  if (total < 50) return { stage: 4, label: "成木", description: "学校の知恵の木が育っています" };
  if (total < 70) return { stage: 5, label: "大木", description: "大きく枝を広げた大木です" };
  if (total < 100) return { stage: 6, label: "森", description: "豊かな知恵の森が広がっています" };
  return            { stage: 7, label: "学びの里", description: "学びの文化が里全体に根づいています" };
}

function getProgress(total: number) {
  const next = MILESTONES.find((m) => m > total);
  if (!next) return { next: null, percent: 100, remaining: 0 };
  const prev = [...MILESTONES].reverse().find((m) => m <= total) ?? 0;
  const percent = Math.round(((total - prev) / (next - prev)) * 100);
  return { next, percent, remaining: next - total };
}

// ── SVG trees ──────────────────────────────────────────────────────────────

function Soil() {
  return (
    <>
      <ellipse cx="50" cy="85" rx="36" ry="12" fill="#92400e" />
      <ellipse cx="50" cy="81" rx="28" ry="9"  fill="#b45309" />
    </>
  );
}

function TreeStage0() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <Soil />
    </svg>
  );
}

function TreeStage1() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <rect x="47" y="52" width="6" height="30" rx="3" fill="#65a30d" />
      <ellipse cx="37" cy="50" rx="13" ry="8" fill="#86efac" transform="rotate(-25 37 50)" />
      <ellipse cx="63" cy="50" rx="13" ry="8" fill="#86efac" transform="rotate(25 63 50)" />
    </svg>
  );
}

function TreeStage2() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <rect x="45" y="56" width="10" height="26" rx="4" fill="#92400e" />
      <circle cx="50" cy="46" r="22" fill="#4ade80" />
      <circle cx="50" cy="40" r="17" fill="#86efac" />
    </svg>
  );
}

function TreeStage3() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <rect x="43" y="53" width="14" height="28" rx="5" fill="#78350f" />
      <ellipse cx="50" cy="50" rx="30" ry="20" fill="#16a34a" />
      <ellipse cx="50" cy="38" rx="24" ry="18" fill="#22c55e" />
      <ellipse cx="50" cy="27" rx="16" ry="13" fill="#4ade80" />
    </svg>
  );
}

function TreeStage4() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <path d="M42 81 Q38 65 40 52 L50 48 L60 52 Q62 65 58 81 Z" fill="#78350f" />
      <line x1="50" y1="55" x2="28" y2="40" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="55" x2="72" y2="40" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="38" ry="24" fill="#15803d" />
      <ellipse cx="50" cy="37" rx="30" ry="22" fill="#16a34a" />
      <ellipse cx="30" cy="39" rx="17" ry="14" fill="#22c55e" />
      <ellipse cx="70" cy="39" rx="17" ry="14" fill="#22c55e" />
      <ellipse cx="50" cy="24" rx="20" ry="17" fill="#4ade80" />
    </svg>
  );
}

function TreeStage5() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <path d="M42 81 Q38 65 40 52 L50 48 L60 52 Q62 65 58 81 Z" fill="#78350f" />
      <line x1="50" y1="55" x2="28" y2="40" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="55" x2="72" y2="40" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="38" ry="24" fill="#15803d" />
      <ellipse cx="50" cy="37" rx="30" ry="22" fill="#16a34a" />
      <ellipse cx="30" cy="39" rx="17" ry="14" fill="#22c55e" />
      <ellipse cx="70" cy="39" rx="17" ry="14" fill="#22c55e" />
      <ellipse cx="50" cy="24" rx="20" ry="17" fill="#4ade80" />
    </svg>
  );
}

function TreeStage6() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      {/* left tree */}
      <rect x="17" y="66" width="6" height="18" rx="2" fill="#92400e" />
      <circle cx="20" cy="58" r="13" fill="#15803d" />
      <circle cx="20" cy="52" r="10" fill="#22c55e" />
      {/* right tree */}
      <rect x="77" y="66" width="6" height="18" rx="2" fill="#92400e" />
      <circle cx="80" cy="58" r="13" fill="#15803d" />
      <circle cx="80" cy="52" r="10" fill="#22c55e" />
      {/* center big tree */}
      <rect x="44" y="56" width="12" height="26" rx="4" fill="#78350f" />
      <ellipse cx="50" cy="51" rx="28" ry="20" fill="#166534" />
      <ellipse cx="50" cy="38" rx="22" ry="18" fill="#15803d" />
      <ellipse cx="50" cy="26" rx="16" ry="14" fill="#22c55e" />
      <ellipse cx="50" cy="16" rx="10" ry="10" fill="#4ade80" />
      {/* birds */}
      <path className="animate-bird-flutter" d="M14 22 Q17 19 20 22" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path className="animate-bird-flutter" d="M76 17 Q79 14 82 17" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function TreeStage7() {
  return (
    <svg viewBox="0 0 100 100" className="animate-tree-idle h-full w-full">
      <Soil />
      <path d="M17 83 C28 72 38 68 50 78 C62 68 74 72 85 83" fill="none" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
      <rect x="36" y="50" width="28" height="25" rx="3" fill="#fde68a" />
      <path d="M32 52 L50 36 L68 52 Z" fill="#b45309" />
      <rect x="47" y="62" width="7" height="13" rx="1" fill="#92400e" />
      <rect className="animate-village-light" x="40" y="57" width="6" height="6" rx="1" fill="#60a5fa" />
      <rect className="animate-village-light" x="55" y="57" width="6" height="6" rx="1" fill="#60a5fa" />
      <rect x="14" y="65" width="6" height="18" rx="2" fill="#92400e" />
      <circle cx="17" cy="58" r="13" fill="#15803d" />
      <circle cx="17" cy="52" r="9" fill="#22c55e" />
      <rect x="80" y="65" width="6" height="18" rx="2" fill="#92400e" />
      <circle cx="83" cy="58" r="13" fill="#15803d" />
      <circle cx="83" cy="52" r="9" fill="#22c55e" />
      <circle cx="28" cy="80" r="2" fill="#16a34a" />
      <circle cx="72" cy="80" r="2" fill="#16a34a" />
      <path className="animate-bird-flutter" d="M22 25 Q25 22 28 25" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path className="animate-bird-flutter" d="M70 21 Q73 18 76 21" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const TREE_COMPONENTS = [TreeStage0, TreeStage1, TreeStage2, TreeStage3, TreeStage4, TreeStage5, TreeStage6, TreeStage7];

// ── Confetti ────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: `${(i / 36) * 100 + Math.random() * 2.5}%`,
      delay: `${(Math.random() * 1.8).toFixed(2)}s`,
      duration: `${(2 + Math.random() * 2).toFixed(2)}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: `${6 + Math.floor(Math.random() * 6)}px`,
      height: `${4 + Math.floor(Math.random() * 4)}px`,
    })),
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute -top-2 animate-confetti rounded-sm"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

function FloatingLeaves({ stage }: { stage: number }) {
  if (stage === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${8 + i * 12 + ((i * 7) % 6)}%`,
        top: `${12 + ((i * 19) % 68)}%`,
        delay: `${((i * 0.47) % 4).toFixed(2)}s`,
        duration: `${(7 + ((i * 0.83) % 4)).toFixed(2)}s`,
      })).map((leaf) => (
        <span
          key={leaf.id}
          className="animate-floating-leaf absolute h-2 w-3 rounded-[70%_30%_70%_30%] bg-emerald-300/45"
          style={{
            left: leaf.left,
            top: leaf.top,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SchoolTreeGrowth({ total }: { total: number }) {
  const { stage, label, description } = getStage(total);
  const { next, percent, remaining } = getProgress(total);
  const isAtMilestone = (MILESTONES as readonly number[]).includes(total);

  const [showConfetti, setShowConfetti] = useState(isAtMilestone);

  useEffect(() => {
    if (!isAtMilestone) return;
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, [isAtMilestone]);

  const TreeComponent = TREE_COMPONENTS[stage];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-linear-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      <FloatingLeaves stage={stage} />
      {showConfetti && <Confetti />}

      {isAtMilestone && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm">
          <span>🎉</span>
          <span>
            {total}件達成！みんなで「{label}」ステージに到達しました
          </span>
        </div>
      )}

      <div className="flex items-end gap-6">
        <div key={stage} className="animate-tree-grow h-28 w-28 shrink-0">
          <TreeComponent />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{total.toLocaleString()}</span>
              <span className="text-base text-zinc-500">件</span>
              <span key={label} className="animate-stage-badge inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                {label}ステージ
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          </div>

          {next !== null ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>次のマイルストーン：{next}件</span>
                <span>あと{remaining}件</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="animate-progress-shine h-full rounded-full bg-linear-to-r from-green-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-green-700">
              全マイルストーン達成！「{label}」として学びが広がっています 🌳
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
