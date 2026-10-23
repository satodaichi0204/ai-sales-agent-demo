"use client";
// S10 ナレッジ（14 土台）。共通のルール＋事業ごとの手引き。承認の修正から加わったルールには印
import { useState } from "react";
import { PageHeader, RoleBox } from "@/components/ui";
import { BUSINESS_IDS, EVENT_LABEL, PLAYBOOKS, SIZE_LABEL, type BusinessId, type EventType } from "@/lib/data";
import { emailFooter } from "@/lib/generate";
import { useAppState } from "@/lib/store";
import { removeRule } from "@/lib/state";

export default function Knowledge() {
  const [state, update] = useAppState();
  const [tab, setTab] = useState<BusinessId>(state.business);
  const pb = PLAYBOOKS.businesses[tab];
  const added = state.addedRules;

  return (
    <>
      <PageHeader no="14" title="ナレッジ（社内の手引き）" lead="すべての事業で使う「共通のルール」と、事業ごとに差し替える「事業ごとの手引き」の2段の構成です。新しい事業を始めるときは、事業ごとの手引きを1つ足すだけで、同じAI社員が使えます。" />
      <RoleBox
        ai={["下書きを作るとき、品質チェックのときに、必ず手引きを読む", "人の修正の理由を、ルールとして手引きに加える"]}
        human={["手引きの中身（強み、実績、言ってはいけない表現）を決め、月に1回見直す", "承認の修正から加わったルールを確かめ、不要なら消す"]}
      />

      <section className="card mb-6" data-testid="added-rules-section">
        <h2 className="h2">承認の修正から追加されたルール（{added.length}件）</h2>
        {added.length === 0 ? (
          <p className="text-sm text-sub">まだありません。承認待ちの画面で「修正して承認」か「差し戻し」を選び、理由と「今後使わない表現」を入れると、ここに加わります。</p>
        ) : (
          <ul className="space-y-2">
            {added.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#efe7fa] p-3 text-sm">
                <div>
                  <span className="chip mr-2 bg-[#6b4a9b] text-white">承認の修正から追加</span>
                  {r.phrase ? (
                    <>
                      「{r.phrase}」を使わない{r.replace && <>（次の下書きでは「{r.replace}」に置き換え）</>}
                    </>
                  ) : (
                    <>1文を{r.sentenceMax}文字以内にする</>
                  )}
                  <div className="mt-0.5 text-xs text-sub">
                    理由：{r.reason}／対象：{r.scope === "common" ? "全事業" : PLAYBOOKS.businesses[r.scope].name}
                  </div>
                </div>
                <button className="btn px-3 py-1 text-xs" onClick={() => update((s) => removeRule(s, r.id))}>
                  このルールを消す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="card">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip bg-navy text-white">共通</span>
            <h2 className="text-lg font-bold">{PLAYBOOKS.common.name}</h2>
          </div>
          <h3 className="mt-3 mb-1 text-sm font-bold">言葉づかい</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {PLAYBOOKS.common.tone.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3 className="mt-3 mb-1 text-sm font-bold">送信者の表示と配信停止の案内</h3>
          <p className="mb-1 text-sm">{PLAYBOOKS.common.senderRule}</p>
          <pre className="rounded-lg bg-paper p-2 text-xs whitespace-pre-wrap">{emailFooter()}</pre>
          <h3 className="mt-3 mb-1 text-sm font-bold">言ってはいけない表現（全事業）</h3>
          <ul className="space-y-0.5 text-sm">
            {PLAYBOOKS.common.ng.map((r) => (
              <li key={r.phrase}>
                「{r.phrase}」<span className="text-xs text-sub">…{r.reason}</span>
              </li>
            ))}
            {added
              .filter((r) => r.scope === "common" && r.phrase)
              .map((r) => (
                <li key={r.id}>
                  「{r.phrase}」<span className="chip ml-1 bg-[#efe7fa] text-[#6b4a9b]">承認の修正から追加</span>
                </li>
              ))}
          </ul>
          <h3 className="mt-3 mb-1 text-sm font-bold">長さの目安</h3>
          <p className="text-sm">
            件名 {PLAYBOOKS.common.limits.subjectMax}文字、メールの本文 {PLAYBOOKS.common.limits.emailBodyMax}文字、DM {PLAYBOOKS.common.limits.dmBodyMax}文字、1文 {PLAYBOOKS.common.limits.sentenceMax}文字まで
          </p>
        </section>

        <section className="card">
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
            {BUSINESS_IDS.map((b) => (
              <button key={b} role="tab" aria-selected={b === tab} onClick={() => setTab(b)} className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${b === tab ? "border-ai bg-ai text-white" : "border-line bg-white"}`}>
                {PLAYBOOKS.businesses[b].name}
              </button>
            ))}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="chip bg-ai text-white">事業ごと</span>
            <h2 className="text-lg font-bold">{pb.name}の手引き</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-bold">提案すること</dt>
              <dd>{pb.offer}</dd>
            </div>
            <div>
              <dt className="font-bold">狙う相手（営業リストの初期値）</dt>
              <dd>
                業種：{pb.targets.industries.join("、")}／規模：{pb.targets.sizes.map((s) => SIZE_LABEL[s]).join("、")}／きっかけ：{pb.targets.triggers.map((t) => EVENT_LABEL[t]).join("、")}
              </dd>
            </div>
            <div>
              <dt className="font-bold">強みと実績（「（例）」は架空の例）</dt>
              <dd>
                <ul className="list-disc pl-5">
                  {pb.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-bold">提案の切り口のひな形（出来事ごと）</dt>
              <dd>
                <ul className="list-disc pl-5">
                  {Object.entries(pb.angles).map(([k, v]) => (
                    <li key={k}>
                      <span className="text-sub">{EVENT_LABEL[k as EventType]}：</span>
                      {v}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-bold">お願いの文（ひな形）</dt>
              <dd>{pb.cta}</dd>
            </div>
            <div>
              <dt className="font-bold">言ってはいけない表現（この事業）</dt>
              <dd>
                <ul className="space-y-0.5">
                  {pb.ng.map((r) => (
                    <li key={r.phrase}>
                      「{r.phrase}」<span className="text-xs text-sub">…{r.reason}</span>
                    </li>
                  ))}
                  {added
                    .filter((r) => r.scope === tab && r.phrase)
                    .map((r) => (
                      <li key={r.id}>
                        「{r.phrase}」{r.replace && <>→「{r.replace}」</>}
                        <span className="chip ml-1 bg-[#efe7fa] text-[#6b4a9b]">承認の修正から追加</span>
                      </li>
                    ))}
                </ul>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
