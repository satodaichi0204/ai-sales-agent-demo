"use client";
// S6 承認待ち（14 土台）。人が承認、修正して承認、差し戻し。修正の理由は手引きに記録され、次の下書きに反映される
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CheckPanel, { Highlighted } from "@/components/CheckPanel";
import { Empty, PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, PLAYBOOKS, companyById } from "@/lib/data";
import { useAppState } from "@/lib/store";
import { checkOf, decide, type DecideInput, type DraftRec } from "@/lib/state";

function Detail({ d, onDone }: { d: DraftRec; onDone: (m: string) => void }) {
  const [state, update] = useAppState();
  const [subject, setSubject] = useState(d.subject);
  const [body, setBody] = useState(d.body);
  const [reasonId, setReasonId] = useState("");
  const [phrase, setPhrase] = useState("");
  const [replace, setReplace] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const opened = useRef(0);
  useEffect(() => {
    opened.current = Date.now();
  }, []);
  const company = companyById(d.companyId)!;
  const result = checkOf(state, { ...d, subject, body });
  const changed = subject !== d.subject || body !== d.body;
  const preset = PLAYBOOKS.reasons.find((r) => r.id === reasonId);

  const act = (kind: DecideInput["kind"]) => {
    let r = { ok: false, message: "" };
    update((s) => {
      const out = decide(s, d.id, { kind, subject, body, reasonId: reasonId || undefined, note, phrase, replace, humanMs: Date.now() - opened.current }, new Date());
      r = out;
      return out.state;
    });
    if (r.ok) onDone(r.message);
    else setError(r.message);
  };

  return (
    <div className="space-y-4" data-testid="approval-detail">
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold">{company.name}</div>
            <div className="text-xs text-sub">
              {CHANNEL_LABEL[d.channel]}／{d.label}／{PLAYBOOKS.businesses[d.business].name}
            </div>
          </div>
          {changed && <span className="chip bg-warn-soft text-warn">人が修正中</span>}
        </div>
        {(d.channel === "email" || d.channel === "form") && <input className="field mb-2" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="件名" />}
        <textarea className="field min-h-[300px] leading-7" value={body} onChange={(e) => setBody(e.target.value)} aria-label="本文" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CheckPanel result={result} compact />
        <Highlighted text={body} result={result} companyId={company.id} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold">修正・差し戻しの理由（手引きに記録し、次の下書きに反映）</h3>
        <select
          className="field"
          value={reasonId}
          onChange={(e) => {
            const p = PLAYBOOKS.reasons.find((r) => r.id === e.target.value);
            setReasonId(e.target.value);
            setPhrase(p?.phrase ?? "");
            setReplace(p?.replace ?? "");
          }}
          aria-label="理由"
        >
          <option value="">（承認するときは選ばなくてよい）</option>
          {PLAYBOOKS.reasons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        {reasonId && (
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-bold text-sub">今後使わない表現（手引きに追加）</span>
              <input className="field" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="例：トップアスリートが多数所属する" aria-label="今後使わない表現" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-bold text-sub">代わりの表現（次の下書きで自動で置き換え）</span>
              <input className="field" value={replace} onChange={(e) => setReplace(e.target.value)} aria-label="代わりの表現" />
            </label>
            {preset?.sentenceMax && <p className="text-xs text-sub md:col-span-2">この理由を選ぶと、1文の長さの上限を{preset.sentenceMax}文字に下げるルールが加わります。</p>}
            {reasonId === "other" && <input className="field md:col-span-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="理由を書く" aria-label="理由のメモ" />}
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-human-soft p-2 text-sm text-human" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ok" disabled={changed || !result.pass} onClick={() => act("approve")}>
            このまま承認
          </button>
          <button className="btn btn-primary" disabled={!changed || !reasonId} onClick={() => act("approve_edit")}>
            修正して承認
          </button>
          <button className="btn btn-danger" disabled={!reasonId} onClick={() => act("reject")}>
            差し戻し
          </button>
        </div>
        <p className="text-xs text-sub">「修正して承認」と「差し戻し」は理由が必要です。理由と「今後使わない表現」は、ナレッジに「承認の修正から追加」として記録されます。</p>
      </div>
    </div>
  );
}

export default function Approvals() {
  const [state] = useAppState();
  const pending = state.drafts.filter((d) => d.status === "pending");
  const [selId, setSelId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const sel = pending.find((d) => d.id === selId) ?? pending[0];
  const decided = state.drafts.filter((d) => d.decision).sort((a, b) => (b.decision!.at > a.decision!.at ? 1 : -1));
  const recentRules = [...state.addedRules].reverse().slice(0, 5);

  return (
    <>
      <PageHeader no="14" title="承認待ち" lead="品質チェックを通った下書きが、ここに集まります。送付の前に、必ず人が読んで判断します。" />
      <RoleBox
        ai={["品質チェックを通った下書きを、1か所に集める", "人の修正の理由を手引き（ナレッジ）に記録し、次の下書きとチェックに反映する", "人が確認にかけた時間を記録する（効果測定に使う）"]}
        human={["すべての連絡文を読み、承認、修正して承認、差し戻しを選ぶ", "修正したときは理由を選ぶ（AIの育て方になる）"]}
      />
      {msg && (
        <p className="mb-4 rounded-lg bg-ok-soft p-3 text-sm text-ok" role="status" data-testid="approval-msg">
          {msg}
          {msg.includes("ルール") && (
            <Link href="/knowledge" className="ml-2 underline">
              ナレッジを見る
            </Link>
          )}
        </p>
      )}
      {pending.length === 0 ? (
        <Empty>
          承認待ちの下書きはありません。<Link href="/drafts" className="text-ai underline">連絡文の下書きへ</Link>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <ul className="space-y-2" aria-label="承認待ちの一覧">
            {pending.map((d) => (
              <li key={d.id}>
                <button onClick={() => setSelId(d.id)} className={`card w-full p-3 text-left text-sm ${sel?.id === d.id ? "border-2 border-[#6b4a9b]" : ""}`}>
                  <div className="font-bold">{companyById(d.companyId)?.name}</div>
                  <div className="text-xs text-sub">
                    {CHANNEL_LABEL[d.channel]}／{d.label}
                  </div>
                  <div className="mt-1 text-xs font-bold text-ok">{checkOf(state, d).score}点</div>
                </button>
              </li>
            ))}
          </ul>
          {sel && <Detail key={sel.id} d={sel} onDone={(m) => setMsg(m)} />}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">承認の修正から、手引きに加わったルール</h2>
          {recentRules.length === 0 ? (
            <p className="text-sm text-sub">まだありません。差し戻しや修正の理由を選ぶと、ここに加わります。</p>
          ) : (
            <ul className="space-y-1.5 text-sm" data-testid="added-rules">
              {recentRules.map((r) => (
                <li key={r.id} className="rounded-lg bg-[#efe7fa] p-2">
                  <span className="chip mr-1 bg-[#6b4a9b] text-white">承認の修正から追加</span>
                  {r.phrase ? (
                    <>
                      「{r.phrase}」を使わない{r.replace && <>→「{r.replace}」</>}
                    </>
                  ) : (
                    <>1文を{r.sentenceMax}文字以内にする</>
                  )}
                  <span className="text-xs text-sub">（理由：{r.reason}）</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="h2">判断の記録</h2>
          {decided.length === 0 ? (
            <p className="text-sm text-sub">まだありません。</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {decided.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <span className={`chip mr-1 ${d.decision!.kind === "reject" ? "bg-human-soft text-human" : d.decision!.kind === "approve_edit" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}>{{ approve: "承認", approve_edit: "修正して承認", reject: "差し戻し" }[d.decision!.kind]}</span>
                  {companyById(d.companyId)?.name}（{Math.round(d.decision!.humanMs / 1000)}秒）
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
