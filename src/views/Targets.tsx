"use client";
// S1 狙う相手を決める（02 営業準備）。条件の初期値は「事業ごとの手引き」から入る
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, RoleBox } from "@/components/ui";
import { BUSINESS_IDS, EVENT_LABEL, INDUSTRIES, PLAYBOOKS, REGIONS, SIZES, SIZE_LABEL, type BusinessId, type Conditions, type EventType } from "@/lib/data";
import { useAppState } from "@/lib/store";
import { conditionsOf, setConditions } from "@/lib/state";

function Checks<T extends string>({ title, all, value, label, onChange, note }: { title: string; all: T[]; value: T[]; label?: (v: T) => string; onChange: (v: T[]) => void; note?: string }) {
  return (
    <fieldset className="card">
      <legend className="sr-only">{title}</legend>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        {note && <span className="text-xs text-sub">{note}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {all.map((v) => {
          const on = value.includes(v);
          return (
            <label key={v} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${on ? "border-ai bg-ai-soft font-bold text-ai" : "border-line bg-white"}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])} />
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

  return (
    <>
      <PageHeader no="02" title="狙う相手を決める" lead="事業を選ぶと、事業ごとの手引きにある「狙う相手」の条件が初期値として入ります。必要なら人が直します。" />
      <RoleBox
        ai={["事業ごとの手引きから、狙う相手の条件の初期値を入れる", "条件に合う会社を、次の画面で採点して並べる"]}
        human={["どの事業の営業をするかを決める", "条件（業種、規模、地域、きっかけの出来事）を確かめ、必要なら直す"]}
      />

      <h2 className="h2">1. 事業を選ぶ</h2>
      <div className="mb-6 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="事業">
        {BUSINESS_IDS.map((id: BusinessId) => {
          const p = PLAYBOOKS.businesses[id];
          const on = id === b;
          return (
            <button key={id} role="radio" aria-checked={on} onClick={() => update((s) => ({ ...s, business: id }))} className={`card text-left transition ${on ? "border-2 border-ai ring-2 ring-ai/15" : "hover:border-ai/50"}`}>
              <div className="font-bold">{p.name}</div>
              <div className="mt-1 text-sm text-sub">提案すること：{p.offer}</div>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="h2 mb-0">2. 狙う相手の条件</h2>
        <div className="flex items-center gap-2 text-xs">
          {custom ? <span className="chip bg-warn-soft text-warn">人が手引きの初期値から変更</span> : <span className="chip bg-ok-soft text-ok">手引きの初期値（{pb.short}）</span>}
          {custom && (
            <button className="btn px-3 py-1 text-xs" onClick={() => update((s) => setConditions(s, b, null))}>
              手引きの初期値に戻す
            </button>
          )}
        </div>
      </div>
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <Checks title="業種" all={INDUSTRIES} value={cond.industries} onChange={(industries) => set({ industries })} />
        <Checks title="きっかけになる出来事" all={triggers} value={cond.triggers} label={(t) => EVENT_LABEL[t]} onChange={(t) => set({ triggers: t })} note="最近の出来事は、話しかける理由になる" />
        <Checks title="従業員の規模" all={SIZES} value={cond.sizes} label={(s) => SIZE_LABEL[s]} onChange={(sizes) => set({ sizes })} />
        <Checks title="地域" all={REGIONS} value={cond.regions} onChange={(regions) => set({ regions })} note="選ばなければ全国" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
        <p className="text-sm text-sub">
          採点：業種 35点、きっかけの出来事 最大40点（最近のものは加点）、規模 15点、地域 10点。<Link href="/knowledge" className="text-ai underline">手引きを見る</Link>
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/list")}>
          この条件で営業リストを作る →
        </button>
      </div>
    </>
  );
}
