// S11 AI社員の設計図（全体）。全15段階を、役割ごとのAI社員と共通の土台に分けた図
import { Ban, Briefcase, Clapperboard, Coins, Headset, Layers, LayoutGrid, Megaphone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import { PageHeader, RoleBox } from "@/components/ui";
import { AGENTS, BASE, NOT_AUTOMATED, STAGES, WHY } from "@/lib/blueprint";
import { BUSINESS_IDS, PLAYBOOKS } from "@/lib/data";
import { BUSINESS_PHOTO, PHOTOS } from "@/lib/photos";

const AGENT_ICON: Record<string, typeof Briefcase> = { sales: Briefcase, marketing: Megaphone, proposal: Sparkles, production: Clapperboard, accounting: Coins, support: Headset, platform: LayoutGrid };

export default function Blueprint() {
  const color = (owner: string) => AGENTS.find((a) => a.id === owner)?.color ?? "#6a4bd6";
  return (
    <>
      <PageHeader no="全体" title="AI社員の設計図" lead="業務の全15段階を、役割ごとの7体のAI社員と、共通の土台に分けました。人が承認する場所を赤、自動化しないものを灰色で示します。このデモは「営業」のAI社員（02、03）と、土台の一部です。" photo={PHOTOS.court} />
      <RoleBox
        ai={["各段階の下書き、集計、分類、予定の管理", "土台：手引きの適用、品質の検査、利用料の見張り"]}
        human={["赤の場所（承認）はすべて人が判断する", "灰色の業務は、AIに最終判断をさせない"]}
      />

      <section className="card mb-6" data-testid="stages">
        <h2 className="h2 text-base">業務の15段階と、担当するAI社員</h2>
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
          {STAGES.map((s) => {
            const demo = s.no === "02" || s.no === "03";
            return (
              <li key={s.no} className={`relative rounded-xl p-2 pt-2.5 text-center text-white shadow-card ${demo ? "ring-4 ring-[#f2b705]/70" : ""}`} style={{ background: color(s.owner) }}>
                <div className="text-lg leading-none font-black">{s.no}</div>
                <div className="mt-1 text-[11px] leading-tight">{s.name}</div>
                {demo && <div className="mt-1.5 rounded bg-white text-[10px] font-bold text-ai">このデモ</div>}
              </li>
            );
          })}
        </ol>
      </section>

      {/* 人（承認者）→ AI社員 → 土台 の3段 */}
      <section className="mb-6 overflow-hidden rounded-3xl border border-human/25 bg-gradient-to-r from-human-soft to-white shadow-card">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative h-36 md:h-auto">
            <Image src={PHOTOS.meeting.src} alt={PHOTOS.meeting.alt} fill sizes="220px" className="object-cover" />
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-human text-white">
              <UserRound size={24} />
            </span>
            <div>
              <div className="text-lg font-black">人（社長・担当者）が、赤の場所で承認する</div>
              <p className="text-sm text-sub">送付、公開、見積、契約、請求、支払い、クレームへの返答。すべての承認は「共通の土台」の承認待ちに集まり、人が見る場所は1か所だけです。</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="agents">
        {AGENTS.map((a) => {
          const Icon = AGENT_ICON[a.id] ?? Briefcase;
          return (
            <section key={a.id} className={`card relative overflow-hidden ${a.demo ? "ring-4 ring-ai/20" : ""}`}>
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: a.color }} />
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: a.color }}>
                  <Icon size={19} />
                </span>
                {a.demo && <span className="chip bg-ai text-white">このデモ</span>}
              </div>
              <h3 className="font-bold">AI社員：{a.name}</h3>
              <div className="mb-2 text-xs text-mute">担当：{a.stages}</div>
              <ul className="mb-3 space-y-0.5 text-[13px]">
                {a.does.map((d) => (
                  <li key={d} className="flex gap-1.5">
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-sub" />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-human/30 bg-human-soft p-2.5 text-[13px]">
                <div className="text-[11px] font-bold text-human">人が承認する場所</div>
                {a.approve.join("、")}
              </div>
            </section>
          );
        })}
        <section className="card border-2 border-dashed border-off bg-[#eef0f3] shadow-none">
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-off text-white">
            <Ban size={19} />
          </div>
          <h3 className="mb-2 font-bold text-[#4b5360]">自動化しない（AIに最終判断をさせない）</h3>
          <ul className="space-y-1 text-[13px] text-[#4b5360]">
            {NOT_AUTOMATED.map((n) => (
              <li key={n} className="flex gap-1.5">
                <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-off" />
                {n}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1f5c] to-[#47309a] p-6 text-white shadow-lift">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
          <Layers size={20} />
          {BASE.name}：すべてのAI社員が使う
        </h2>
        <div className="flex flex-wrap gap-2">
          {BASE.parts.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 rounded-xl bg-white/12 px-3 py-2 text-sm">
              <ShieldCheck size={14} />
              {p}
            </span>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {BUSINESS_IDS.map((b) => (
            <div key={b} className="relative h-24 overflow-hidden rounded-xl">
              <Image src={BUSINESS_PHOTO[b].src} alt={BUSINESS_PHOTO[b].alt} fill sizes="33vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
              <div className="absolute bottom-2 left-3 text-sm font-bold">手引き：{PLAYBOOKS.businesses[b].name}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/80">事業ごとの手引きを差し替えて、同じAI社員が3つの事業の営業を行います。</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {WHY.map((w, i) => (
          <section key={w.title} className="card">
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-navy text-sm font-black text-white">{i + 1}</div>
            <h3 className="mb-1 font-bold">{w.title}</h3>
            <p className="text-sm leading-relaxed text-sub">{w.text}</p>
          </section>
        ))}
      </div>
    </>
  );
}
