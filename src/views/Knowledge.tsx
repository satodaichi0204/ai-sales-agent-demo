"use client";
// S10 ナレッジ（14 土台）。共通のルール＋事業ごとの手引き。承認の修正から加わったルールには印
import { BookOpen, Layers, Megaphone, ShieldBan, Sparkles, Target, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { PageHeader, RoleBox } from "@/components/ui";
import { BUSINESS_IDS, EVENT_LABEL, PLAYBOOKS, SIZE_LABEL, type BusinessId, type EventType } from "@/lib/data";
import { emailFooter } from "@/lib/generate";
import { BUSINESS_PHOTO, PHOTOS } from "@/lib/photos";
import { useAppState } from "@/lib/store";
import { removeRule } from "@/lib/state";

function Block({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 flex items-center gap-2 text-sm font-bold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-ai-soft text-ai">
          <Icon size={13} />
        </span>
        {title}
      </dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export default function Knowledge() {
  const [state, update] = useAppState();
  const [tab, setTab] = useState<BusinessId>(state.business);
  const pb = PLAYBOOKS.businesses[tab];
  const added = state.addedRules;
  const photo = BUSINESS_PHOTO[tab];

  return (
    <>
      <PageHeader no="14" title="ナレッジ（社内の手引き）" lead="すべての事業で使う「共通のルール」と、事業ごとに差し替える「事業ごとの手引き」の2段の構成です。新しい事業を始めるときは、事業ごとの手引きを1つ足すだけで、同じAI社員が使えます。" photo={PHOTOS.notePc} />
      <RoleBox
        ai={["下書きを作るとき、品質チェックのときに、必ず手引きを読む", "人の修正の理由を、ルールとして手引きに加える"]}
        human={["手引きの中身（強み、実績、言ってはいけない表現）を決め、月に1回見直す", "承認の修正から加わったルールを確かめ、不要なら消す"]}
      />

      {/* 2段の構成の図 */}
      <section className="card mb-6">
        <h2 className="h2 text-base">
          <Layers size={18} className="text-found" />
          手引きの構成（共通＋事業ごと）
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {BUSINESS_IDS.map((b) => (
            <div key={b} className="relative h-24 overflow-hidden rounded-xl">
              <Image src={BUSINESS_PHOTO[b].src} alt={BUSINESS_PHOTO[b].alt} fill sizes="33vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
              <div className="absolute bottom-2 left-3 text-sm font-bold text-white">事業ごと：{PLAYBOOKS.businesses[b].name}</div>
            </div>
          ))}
        </div>
        <div className="my-2 text-center text-xs font-bold text-mute">▲ 差し替える部分 ／ ▼ すべての事業で使い回す部分</div>
        <div className="rounded-xl bg-navy p-3 text-center text-sm font-bold text-white">共通のルール：言葉づかい・送信者の表示と配信停止・言ってはいけない表現・長さの目安</div>
      </section>

      <section className="card mb-6 border-found/25" data-testid="added-rules-section">
        <h2 className="h2 text-base">
          <Sparkles size={18} className="text-found" />
          承認の修正から追加されたルール（{added.length}件）
        </h2>
        {added.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-sub">まだありません。承認待ちの画面で「修正して承認」か「差し戻し」を選び、理由と「今後使わない表現」を入れると、ここに加わります。</p>
        ) : (
          <ul className="space-y-2">
            {added.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-found/20 bg-found-soft p-3 text-sm">
                <div>
                  <span className="chip mr-2 bg-found text-white">承認の修正から追加</span>
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
                  <Trash2 size={13} />
                  このルールを消す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section className="card">
          <div className="mb-3 flex items-center gap-2">
            <span className="chip bg-navy text-white">共通</span>
            <h2 className="text-lg font-bold">{PLAYBOOKS.common.name}</h2>
          </div>
          <dl className="space-y-4">
            <Block icon={BookOpen} title="言葉づかい">
              <ul className="list-disc space-y-0.5 pl-5">
                {PLAYBOOKS.common.tone.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Block>
            <Block icon={Megaphone} title="送信者の表示と配信停止の案内">
              <p className="mb-1.5">{PLAYBOOKS.common.senderRule}</p>
              <pre className="rounded-xl bg-paper p-3 text-xs leading-relaxed whitespace-pre-wrap">{emailFooter()}</pre>
            </Block>
            <Block icon={ShieldBan} title="言ってはいけない表現（全事業）">
              <ul className="space-y-1">
                {PLAYBOOKS.common.ng.map((r) => (
                  <li key={r.phrase}>
                    <span className="chip bg-human-soft text-human">{r.phrase}</span> <span className="text-xs text-sub">{r.reason}</span>
                  </li>
                ))}
                {added
                  .filter((r) => r.scope === "common" && r.phrase)
                  .map((r) => (
                    <li key={r.id}>
                      <span className="chip bg-human-soft text-human">{r.phrase}</span> <span className="chip bg-found-soft text-found">承認の修正から追加</span>
                    </li>
                  ))}
              </ul>
            </Block>
            <Block icon={Layers} title="長さの目安">
              件名 {PLAYBOOKS.common.limits.subjectMax}文字、メールの本文 {PLAYBOOKS.common.limits.emailBodyMax}文字、DM {PLAYBOOKS.common.limits.dmBodyMax}文字、1文 {PLAYBOOKS.common.limits.sentenceMax}文字まで
            </Block>
          </dl>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="relative h-40">
            <Image src={photo.src} alt={photo.alt} fill sizes="60vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/5" />
            <div className="absolute bottom-3 left-5 flex items-center gap-2 text-white">
              <span className="chip bg-ai text-white">事業ごと</span>
              <h2 className="text-xl font-black">{pb.name}の手引き</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-line p-3" role="tablist">
            {BUSINESS_IDS.map((b) => (
              <button key={b} role="tab" aria-selected={b === tab} onClick={() => setTab(b)} className={`rounded-xl px-3.5 py-1.5 text-sm font-bold transition ${b === tab ? "bg-ai text-white" : "text-sub hover:bg-paper"}`}>
                {PLAYBOOKS.businesses[b].name}
              </button>
            ))}
          </div>
          <dl className="space-y-4 p-5">
            <Block icon={Sparkles} title="提案すること">
              {pb.offer}
            </Block>
            <Block icon={Target} title="狙う相手（営業リストの初期値）">
              業種：{pb.targets.industries.join("、")}
              <br />
              規模：{pb.targets.sizes.map((s) => SIZE_LABEL[s]).join("、")}
              <br />
              きっかけ：{pb.targets.triggers.map((t) => EVENT_LABEL[t]).join("、")}
            </Block>
            <Block icon={BookOpen} title="強みと実績（「（例）」は架空の例）">
              <ul className="list-disc space-y-0.5 pl-5">
                {pb.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Block>
            <Block icon={Layers} title="提案の切り口のひな形（出来事ごと）">
              <ul className="space-y-1">
                {Object.entries(pb.angles).map(([k, v]) => (
                  <li key={k}>
                    <span className="chip mr-1 bg-paper text-sub">{EVENT_LABEL[k as EventType]}</span>
                    {v}
                  </li>
                ))}
              </ul>
            </Block>
            <Block icon={Megaphone} title="お願いの文（ひな形）">
              {pb.cta}
            </Block>
            <Block icon={ShieldBan} title="言ってはいけない表現（この事業）">
              <ul className="space-y-1">
                {pb.ng.map((r) => (
                  <li key={r.phrase}>
                    <span className="chip bg-human-soft text-human">{r.phrase}</span> <span className="text-xs text-sub">{r.reason}</span>
                  </li>
                ))}
                {added
                  .filter((r) => r.scope === tab && r.phrase)
                  .map((r) => (
                    <li key={r.id}>
                      <span className="chip bg-human-soft text-human">{r.phrase}</span>
                      {r.replace && <span className="text-xs text-sub"> →「{r.replace}」</span>} <span className="chip bg-found-soft text-found">承認の修正から追加</span>
                    </li>
                  ))}
              </ul>
            </Block>
          </dl>
        </section>
      </div>
    </>
  );
}
