"use client";
// S4 連絡文の下書き（03 アプローチ）＋その場の品質チェック。止める項目が0件のときだけ承認待ちへ
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import CheckPanel, { Highlighted } from "@/components/CheckPanel";
import { Empty, PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, PLAYBOOKS, companyById, type Channel } from "@/lib/data";
import { activeRules } from "@/lib/knowledge";
import { getResearch } from "@/lib/research";
import { useAppState } from "@/lib/store";
import { checkOf, companiesForList, createDrafts, submitForApproval, updateDraft } from "@/lib/state";

const STATUS: Record<string, { t: string; c: string }> = {
  draft: { t: "下書き", c: "bg-paper text-sub" },
  pending: { t: "承認待ち", c: "bg-[#efe7fa] text-[#6b4a9b]" },
  approved: { t: "承認済み", c: "bg-ok-soft text-ok" },
  rejected: { t: "差し戻し", c: "bg-human-soft text-human" },
  sent: { t: "送付済み", c: "bg-ai-soft text-ai" },
};

export default function Drafts() {
  const [state, update] = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const b = state.business;
  const list = companiesForList(state, b);
  const company = companyById(params.get("c") ?? "") ?? list[0];
  const [msg, setMsg] = useState("");
  const [vSel, setVSel] = useState<string | null>(null);

  if (!company) {
    return (
      <>
        <PageHeader no="03" title="連絡文の下書き" lead="下調べにもとづいて、一人ひとりに合わせた文面を3案作ります。" />
        <RoleBox
          ai={["下調べにもとづき、相手に合わせた文面を3案作る", "手引きの強み、ひな形、言い換えのルールを使う", "書き直すたびに、品質チェックをやり直す"]}
          human={["3案から1つを選び、言い回しを直す", "DMと電話は、人が自分で送る・話す（AIは下書きとメモまで）"]}
        />
        <Empty>
          まだ営業リストが確定していません。<Link href="/list" className="text-ai underline">営業リストへ</Link>
        </Empty>
      </>
    );
  }
  const channels: Channel[] = ["email", ...(company.channels.includes("form") ? (["form"] as const) : []), ...(company.channels.includes("sns") ? (["dm"] as const) : []), "phone"];
  const chParam = params.get("ch") as Channel | null;
  const ch: Channel = chParam && channels.includes(chParam) ? chParam : "email";
  const research = getResearch(company, b);
  const pb = PLAYBOOKS.businesses[b];
  const mine = state.drafts.filter((d) => d.companyId === company.id && d.channel === ch);
  const editable = mine.filter((d) => d.status === "draft");
  const current = editable.find((d) => d.variant === vSel) ?? editable[0];
  const result = current ? checkOf(state, current) : null;
  const go = (c: string, channel: Channel) => {
    setVSel(null);
    setMsg("");
    router.replace(`/drafts?c=${c}&ch=${channel}`);
  };

  return (
    <>
      <PageHeader no="03" title="連絡文の下書き" lead="下調べの事実と、事業ごとの手引き（強み、ひな形、言ってはいけない表現）から、1社ごとに3案を作ります。書き直すと、その場で品質チェックをやり直します。">
        <Link href={`/research?c=${company.id}`} className="btn">
          ← 下調べを見る
        </Link>
      </PageHeader>
      <RoleBox
        ai={["下調べにもとづき、相手に合わせた文面を3案作る", "手引きの強み、ひな形、言い換えのルールを使う", "書き直すたびに、品質チェックをやり直す"]}
        human={["3案から1つを選び、言い回しを直す", "DMと電話は、人が自分で送る・話す（AIは下書きとメモまで）"]}
      />

      {list.length > 0 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {list.map((c) => (
            <button key={c.id} onClick={() => go(c.id, "email")} className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${c.id === company.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:bg-paper"}`}>
              {c.name.replace("（架空）", "")}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="連絡の手段">
          {channels.map((c) => (
            <button key={c} role="tab" aria-selected={c === ch} onClick={() => go(company.id, c)} className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${c === ch ? "border-ai bg-ai text-white" : "border-line bg-white"}`}>
              {c === "phone" ? "電話（話す内容のメモ）" : c === "dm" ? "SNSのDM（下書きのみ）" : CHANNEL_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="text-sm">
          <b>{company.name}</b>　{research.mode === "sample" ? <span className="chip bg-ok-soft text-ok">見本（完成形）</span> : <span className="chip bg-warn-soft text-warn">簡易作成（本番ではAIで作成）</span>}
        </div>
      </div>

      {ch === "dm" && (
        <div className="mb-4 rounded-xl border border-human/40 bg-human-soft p-3 text-sm" data-testid="dm-note">
          <b>DMは下書きまで。送付は人が手で行います。</b>多くのSNSの利用規約で、DMの自動送信は禁止されているため、AI社員はDMを送りません。
        </div>
      )}

      {editable.length === 0 ? (
        <div className="card mb-6 text-center">
          <p className="mb-3 text-sm text-sub">{CHANNEL_LABEL[ch]}の下書きはまだありません。</p>
          <button className="btn btn-primary" onClick={() => update((s) => createDrafts(s, company.id, b, ch, new Date()))}>
            下書きを作る{ch === "phone" ? "" : "（3案）"}
          </button>
        </div>
      ) : (
        current &&
        result && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="案">
              {editable.map((d) => {
                const r = checkOf(state, d);
                return (
                  <button key={d.id} role="tab" aria-selected={d.id === current.id} onClick={() => setVSel(d.variant)} className={`rounded-lg border px-3 py-1.5 text-sm ${d.id === current.id ? "border-navy bg-navy text-white" : "border-line bg-white"}`}>
                    {d.label}
                    <span className={`ml-2 font-bold ${d.id === current.id ? "" : r.pass ? "text-ok" : "text-human"}`}>{r.score}点</span>
                  </button>
                );
              })}
              <button className="btn ml-auto text-xs" onClick={() => update((s) => createDrafts(s, company.id, b, ch, new Date()))}>
                作り直す
              </button>
            </div>
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="card space-y-3">
                {(ch === "email" || ch === "form") && (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-bold text-sub">件名</span>
                    <input className="field" value={current.subject} onChange={(e) => update((s) => updateDraft(s, current.id, e.target.value, current.body))} />
                  </label>
                )}
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-bold text-sub">{ch === "phone" ? "話す内容のメモ" : "本文"}（直接書き直せます）</span>
                  <textarea className="field min-h-[380px] leading-7" value={current.body} onChange={(e) => update((s) => updateDraft(s, current.id, current.subject, e.target.value))} aria-label="本文" />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn btn-primary"
                    disabled={!result.pass}
                    onClick={() => {
                      let ok = false;
                      update((s) => {
                        const r = submitForApproval(s, current.id, new Date());
                        ok = r.ok;
                        return r.state;
                      });
                      setVSel(null);
                      setMsg(ok ? "承認待ちに回しました。人の承認を待ちます。" : "止める項目があるため、承認待ちに回せません。");
                    }}
                  >
                    承認待ちへ回す
                  </button>
                  {!result.pass && <span className="text-xs text-human">止める項目を直すと、回せるようになります</span>}
                </div>
                {msg && (
                  <p className="rounded-lg bg-ok-soft p-2 text-sm text-ok" role="status">
                    {msg} <Link href="/approvals" className="underline">承認待ちを見る</Link>
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <CheckPanel result={result} />
                <div>
                  <div className="mb-1 text-xs font-bold text-sub">印を付けた本文（青：出典と結び付いた記述、赤：止める箇所）</div>
                  <Highlighted text={current.body} result={result} companyId={company.id} />
                </div>
              </div>
            </div>
          </>
        )
      )}

      {mine.filter((d) => d.status !== "draft").length > 0 && (
        <section className="card mb-6">
          <h2 className="h2">この会社に、すでに回した下書き</h2>
          <ul className="space-y-1 text-sm">
            {mine
              .filter((d) => d.status !== "draft")
              .map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className={`chip ${STATUS[d.status].c}`}>{STATUS[d.status].t}</span>
                  {d.label}
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="h2">使った手引き（ナレッジ）</h2>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <h3 className="mb-1 font-bold">事業ごとの手引き：{pb.short}</h3>
            <ul className="list-disc space-y-0.5 pl-5">
              {pb.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-sub">「（例）」の数字は架空の例です。</p>
          </div>
          <div>
            <h3 className="mb-1 font-bold">共通のルール</h3>
            <ul className="list-disc space-y-0.5 pl-5">
              {PLAYBOOKS.common.tone.map((s) => (
                <li key={s}>{s}</li>
              ))}
              <li>{PLAYBOOKS.common.senderRule}</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-1 font-bold">言ってはいけない表現</h3>
            <ul className="space-y-0.5">
              {activeRules(b, state.addedRules).map((r) => (
                <li key={r.phrase}>
                  「{r.phrase}」{r.replace && <span className="text-sub">→「{r.replace}」</span>}
                  {r.origin === "approval" && <span className="chip ml-1 bg-[#efe7fa] text-[#6b4a9b]">承認の修正から追加</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
