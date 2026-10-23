// S11 AI社員の設計図（全体）。全15段階を、役割ごとのAI社員と共通の土台に分けた図
import { RoleBox, PageHeader } from "@/components/ui";
import { AGENTS, BASE, NOT_AUTOMATED, STAGES, WHY } from "@/lib/blueprint";
import { BUSINESS_IDS, PLAYBOOKS } from "@/lib/data";

export default function Blueprint() {
  const color = (owner: string) => AGENTS.find((a) => a.id === owner)?.color ?? "#6b4a9b";
  return (
    <>
      <PageHeader no="全体" title="AI社員の設計図" lead="業務の全15段階を、役割ごとの7体のAI社員と、共通の土台に分けました。人が承認する場所を赤、自動化しないものを灰色で示します。このデモは「営業」のAI社員（02、03）と、土台の一部です。" />
      <RoleBox
        ai={["各段階の下書き、集計、分類、予定の管理", "土台：手引きの適用、品質の検査、利用料の見張り"]}
        human={["赤の場所（承認）はすべて人が判断する", "灰色の業務は、AIに最終判断をさせない"]}
      />

      <section className="card mb-6" data-testid="stages">
        <h2 className="h2">業務の15段階と、担当するAI社員</h2>
        <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
          {STAGES.map((s) => {
            const demo = s.no === "02" || s.no === "03";
            return (
              <li key={s.no} className={`rounded-lg p-2 text-center text-white ${demo ? "ring-4 ring-ai/30" : ""}`} style={{ background: color(s.owner) }}>
                <div className="text-lg leading-none font-bold">{s.no}</div>
                <div className="mt-1 text-[11px] leading-tight">{s.name}</div>
                {demo && <div className="mt-1 rounded bg-white text-[10px] font-bold text-ai">このデモ</div>}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="agents">
        {AGENTS.map((a) => (
          <section key={a.id} className={`card border-t-4 ${a.demo ? "border-2 shadow-md" : ""}`} style={{ borderTopColor: a.color, ...(a.demo ? { borderColor: a.color } : {}) }}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-bold">AI社員：{a.name}</h3>
              {a.demo && <span className="chip bg-ai text-white">このデモ</span>}
            </div>
            <div className="mb-2 text-xs text-sub">担当：{a.stages}</div>
            <ul className="mb-2 list-disc space-y-0.5 pl-4 text-sm">
              {a.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="rounded-lg border border-human/40 bg-human-soft p-2 text-sm">
              <div className="text-xs font-bold text-human">人が承認する場所</div>
              {a.approve.join("、")}
            </div>
          </section>
        ))}
        <section className="card border-2 border-dashed border-off bg-[#eef0f3]">
          <h3 className="mb-2 font-bold text-off">自動化しない（AIに最終判断をさせない）</h3>
          <ul className="list-disc space-y-0.5 pl-4 text-sm text-[#4b5360]">
            {NOT_AUTOMATED.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mb-6 rounded-xl border-2 border-[#6b4a9b] bg-[#f4effb] p-5">
        <h2 className="mb-2 text-lg font-bold text-[#6b4a9b]">{BASE.name}：すべてのAI社員が使う</h2>
        <div className="flex flex-wrap gap-2">
          {BASE.parts.map((p) => (
            <span key={p} className="rounded-lg border border-[#6b4a9b]/30 bg-white px-3 py-1.5 text-sm">
              {p}
            </span>
          ))}
        </div>
        <div className="mt-3 text-sm">
          事業ごとの手引き：
          {BUSINESS_IDS.map((b) => (
            <span key={b} className="chip mr-1 ml-1 bg-white text-ink">
              {PLAYBOOKS.businesses[b].name}
            </span>
          ))}
          を差し替えて、同じAI社員が3つの事業の営業を行います。
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {WHY.map((w) => (
          <section key={w.title} className="card">
            <h3 className="mb-1 font-bold">{w.title}</h3>
            <p className="text-sm">{w.text}</p>
          </section>
        ))}
      </div>
    </>
  );
}
