"use client";
// S9 効果測定（03 アプローチ）。最初の1か月のKPIの実物
import { Clock, MailOpen, PenLine, Send, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { PageHeader, RoleBox, Stat } from "@/components/ui";
import { CHANNEL_LABEL, HISTORY, PLAYBOOKS, type BusinessId, type Channel } from "@/lib/data";
import type { Variant } from "@/lib/generate";
import { fmtSec, type Rate } from "@/lib/metrics";
import { PHOTOS } from "@/lib/photos";
import { useAppState } from "@/lib/store";
import { metricsOf } from "@/lib/state";

const VARIANT_SHORT: Record<Variant, string> = { A: "A：出来事から", B: "B：強みから", C: "C：短く" };
const SERIES = "#2a78d6";

/** 日ごとの送付数（1系列の縦棒。マウスを乗せると数字） */
function DailyChart({ days }: { days: { label: string; value: number; today?: boolean }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 220;
  const pad = { l: 34, r: 8, t: 16, b: 28 };
  const max = Math.max(4, ...days.map((d) => d.value));
  const top = Math.ceil((max + 1) / 2) * 2;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / days.length;
  const bw = Math.min(22, slot - 8);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const ticks = [0, top / 2, top];
  const h = hover !== null ? days[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`日ごとの送付数：${days.map((d) => `${d.label} ${d.value}件`).join("、")}`} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e8ecf2" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#8a94a6">
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.l + i * slot + (slot - bw) / 2;
          const yy = y(d.value);
          const r = Math.min(4, (pad.t + ih - yy) / 2);
          const path = d.value === 0 ? "" : `M${x},${pad.t + ih} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${pad.t + ih} Z`;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={ih} fill={hover === i ? "#f1f5fb" : "transparent"} />
              {path && <path d={path} fill={d.today ? "#6250d6" : SERIES} opacity={hover === null || hover === i ? 1 : 0.55} />}
              <text x={pad.l + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={10.5} fill={d.today ? "#6250d6" : "#8a94a6"} fontWeight={d.today ? 700 : 400}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-navy px-2.5 py-1.5 text-xs text-white shadow-lift" style={{ left: `${((pad.l + hover * slot + slot / 2) / W) * 100}%`, top: 0 }}>
          <b>{h.label}</b>　送付 {h.value}件
        </div>
      )}
    </div>
  );
}

/** 返信率の比較（横棒、値はそのまま表示） */
function Compare({ title, rows, label }: { title: string; rows: Record<string, Rate>; label: (k: string) => string }) {
  const max = Math.max(1, ...Object.values(rows).map((r) => r.replyRate));
  return (
    <section className="card">
      <h3 className="mb-1 font-bold">{title}</h3>
      <p className="mb-3 text-xs text-mute">返信率（棒）と、前向きな返信の率</p>
      <ul className="space-y-3">
        {Object.entries(rows).map(([k, r]) => (
          <li key={k} title={`送付 ${r.sends}件／返信 ${r.replies}件／前向き ${r.positive}件`}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium whitespace-nowrap">{label(k)}</span>
              <span className="text-xs text-sub tabular-nums">
                送付 {r.sends}・返信 {r.replies}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 rounded-full bg-paper">
                <div className="h-2.5 rounded-full" style={{ width: `${(r.replyRate / max) * 100}%`, background: SERIES }} />
              </div>
              <span className="w-12 text-right text-sm font-bold tabular-nums">{r.replyRate}%</span>
            </div>
            <div className="mt-0.5 text-right text-[11px] text-mute tabular-nums">前向き {r.positiveRate}%</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Metrics() {
  const [state] = useAppState();
  const m = metricsOf(state);
  const demoSends = state.sends.length;
  const byDay = new Map<string, number>();
  for (const h of HISTORY) byDay.set(h.date, (byDay.get(h.date) ?? 0) + 1);
  const days: { label: string; value: number; today?: boolean }[] = [...byDay.entries()].sort().map(([d, v]) => ({ label: `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`, value: v }));
  if (demoSends > 0) days.push({ label: "今日", value: demoSends, today: true });

  return (
    <>
      <PageHeader no="03" title="効果測定" lead="最初の1か月の成功を判断する数字です。土台は過去2週間の架空の記録（48件）で、デモで送ったものと、受け取った返信が加わると数字が変わります。" photo={PHOTOS.court} />
      <RoleBox
        ai={["送付、返信、承認の記録から、数字を毎日集計する", "事業、手段、文面の案ごとに比べる"]}
        human={["数字を見て、狙う相手の条件、手引き、文面の案を見直す（週1回）", "修正率が高い部分の手引きを直す"]}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="kpis">
        <Stat label="送付数" value={<span className="kpi">{m.sends}件</span>} note={`うちデモで送った ${demoSends}件`} icon={<Send size={16} />} />
        <Stat label="返信率" value={<span className="kpi">{m.replyRate}%</span>} note={`返信 ${m.replies}件`} icon={<MailOpen size={16} />} />
        <Stat label="前向きな返信の率" value={<span className="kpi">{m.positiveRate}%</span>} note="興味あり、資料、日程の調整" icon={<ThumbsUp size={16} />} />
        <Stat label="承認のときの修正率" value={<span className="kpi">{m.editRate}%</span>} note="人が直した、または差し戻した割合" icon={<PenLine size={16} />} />
        <Stat label="1件あたりの作成時間" value={<span className="kpi">{fmtSec(m.totalSec)}</span>} note={`AIのみ ${fmtSec(m.aiSec)}／人の確認込み`} icon={<Clock size={16} />} />
      </div>

      <section className="card mb-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="h2 mb-0 text-base">日ごとの送付数</h2>
          <span className="text-xs text-mute">過去2週間（架空の記録）{demoSends > 0 && "＋今日、デモで送った数（紫）"}</span>
        </div>
        <DailyChart days={days} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Compare title="事業ごと" rows={m.by.business} label={(k) => PLAYBOOKS.businesses[k as BusinessId].short} />
        <Compare title="手段ごと" rows={m.by.channel} label={(k) => CHANNEL_LABEL[k as Channel]} />
        <Compare title="文面の案ごと" rows={m.by.variant} label={(k) => VARIANT_SHORT[k as Variant]} />
      </div>
      <section className="card mt-6 text-sm">
        <h2 className="h2 text-base">最初の1か月の目安（KPIの定義）</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {[
            "返信率と前向きな返信の率：送付数に対する割合。文面の案ごとに比べ、良い案を手引きのひな形に戻す",
            "承認のときの修正率：1か月で下がっていけば、手引きが育っている証拠（目安：最初の週から半分に）",
            "1件あたりの作成時間：人が下調べから書く場合と比べる（人の確認込みで、1件5分以内が目安）",
            "品質チェックで止まった件数と理由：ルールの追加が必要な場所を見つける",
          ].map((t) => (
            <li key={t} className="rounded-xl bg-paper p-3">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">見本モードのため、AIのみの時間は、過去の記録（架空）の値が中心です。デモでの人の確認の時間は、承認の画面を開いてから判断するまでを実際に測っています。</p>
      </section>
    </>
  );
}
