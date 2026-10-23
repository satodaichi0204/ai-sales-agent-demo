"use client";
// S1 狙う相手を決める（02 営業準備）。条件の初期値は「事業ごとの手引き」から入る
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader, RoleBox } from "@/components/ui";
import { BUSINESS_IDS, COMPANIES, EVENT_LABEL, INDUSTRIES, PLAYBOOKS, REGIONS, SIZES, SIZE_LABEL, type BusinessId, type Conditions, type EventType } from "@/lib/data";
import { BUSINESS_PHOTO, PHOTOS } from "@/lib/photos";
import { rankCompanies } from "@/lib/scoring";
import { useAppState } from "@/lib/store";
import { conditionsOf, setConditions } from "@/lib/state";

function Checks<T extends string>({ title, all, value, label, onChange, note }: { title: string; all: T[]; value: T[]; label?: (v: T) => string; onChange: (v: T[]) => void; note?: string }) {
  return (
    <fieldset className="card">
      <legend className="sr-only">{title}</legend>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        {note && <span className="text-xs text-mute">{note}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {all.map((v) => {
          const on = value.includes(v);
          return (
            <label key={v} className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-ai bg-ai text-white shadow-[0_4px_12px_-4px_rgb(42_91_215/0.6)]" : "border-line bg-white hover:border-ai/40"}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])} />
              {on && <Check size={13} strokeWidth={3} />}
              {label ? label(v) : v}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Targets() {
  const [state, update] = useAppState();
  const router = useRouter();
  const b = state.business;
  const cond = conditionsOf(state, b);
  const pb = PLAYBOOKS.businesses[b];
  const custom = state.conditions[b] !== null;
  const set = (patch: Partial<Conditions>) => update((s) => setConditions(s, b, { ...conditionsOf(s, b), ...patch }));
  const triggers = Object.keys(EVENT_LABEL) as EventType[];
  const preview = useMemo(() => rankCompanies(COMPANIES, cond, state.exclusions, new Date()), [cond, state.exclusions]);
  const fits = preview.ranked.filter((r) => r.score >= 70).length;

  return (
    <>
      <PageHeader no="02" title="狙う相手を決める" lead="事業を選ぶと、事業ごとの手引きにある「狙う相手」の条件が初期値として入ります。必要なら人が直します。" photo={PHOTOS.stretch} />
      <RoleBox
        ai={["事業ごとの手引きから、狙う相手の条件の初期値を入れる", "条件に合う会社を、次の画面で採点して並べる"]}
        human={["どの事業の営業をするかを決める", "条件（業種、規模、地域、きっかけの出来事）を確かめ、必要なら直す"]}
      />

      <h2 className="h2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-xs text-white">1</span>事業を選ぶ
      </h2>
      <div className="mb-8 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="事業">
        {BUSINESS_IDS.map((id: BusinessId) => {
          const p = PLAYBOOKS.businesses[id];
          const on = id === b;
          const photo = BUSINESS_PHOTO[id];
          return (
            <button
              key={id}
              role="radio"
              aria-checked={on}
              onClick={() => update((s) => ({ ...s, business: id }))}
              className={`group overflow-hidden rounded-2xl border-2 bg-white text-left shadow-card transition ${on ? "border-ai ring-4 ring-ai/15" : "border-transparent hover:-translate-y-0.5 hover:shadow-lift"}`}
            >
              <div className="relative h-36">
                <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                {on && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-ai px-2.5 py-1 text-xs font-bold text-white">
                    <Check size={13} strokeWidth={3} />
                    選択中
                  </span>
                )}
                <div className="absolute bottom-2.5 left-4 text-lg font-black text-white">{p.name}</div>
              </div>
              <div className="p-4 text-sm text-sub">提案すること：{p.offer}</div>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="h2 mb-0">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-xs text-white">2</span>狙う相手の条件
        </h2>
        <div className="flex items-center gap-2 text-xs">
          {custom ? <span className="chip bg-warn-soft text-warn">人が手引きの初期値から変更</span> : <span className="chip bg-ok-soft text-ok">手引きの初期値（{pb.short}）</span>}
          {custom && (
            <button className="btn px-3 py-1 text-xs" onClick={() => update((s) => setConditions(s, b, null))}>
              手引きの初期値に戻す
            </button>
          )}
        </div>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Checks title="業種" all={INDUSTRIES} value={cond.industries} onChange={(industries) => set({ industries })} />
        <Checks title="きっかけになる出来事" all={triggers} value={cond.triggers} label={(t) => EVENT_LABEL[t]} onChange={(t) => set({ triggers: t })} note="最近の出来事は、話しかける理由になる" />
        <Checks title="従業員の規模" all={SIZES} value={cond.sizes} label={(s) => SIZE_LABEL[s]} onChange={(sizes) => set({ sizes })} />
        <Checks title="地域" all={REGIONS} value={cond.regions} onChange={(regions) => set({ regions })} note="選ばなければ全国" />
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lift backdrop-blur">
        <div className="text-sm">
          <div>
            この条件で<b className="mx-1 text-xl text-ai tabular-nums">{fits}</b>社が70点以上（採点の対象 {preview.ranked.length}社、自動で除外 {preview.excluded.length}社）
          </div>
          <div className="text-xs text-mute">
            採点：業種 35点、きっかけの出来事 最大40点（最近のものは加点）、規模 15点、地域 10点。<Link href="/knowledge" className="text-ai underline">手引きを見る</Link>
          </div>
        </div>
        <button className="btn btn-primary px-5 py-2.5" onClick={() => router.push("/list")}>
          この条件で営業リストを作る
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
