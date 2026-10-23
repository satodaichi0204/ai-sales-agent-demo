"use client";
// S4 連絡文の下書き（03 アプローチ）＋その場の品質チェック。止める項目が0件のときだけ承認待ちへ
import { BookOpen, Check, Loader2, Mail, MessageCircle, MousePointerClick, Phone, RefreshCw, Send, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CheckPanel, { Highlighted } from "@/components/CheckPanel";
import { Empty, PageHeader, RoleBox, Thumb } from "@/components/ui";
import { CHANNEL_LABEL, PLAYBOOKS, addressee, companyById, sourcesOf, type Channel } from "@/lib/data";
import { activeRules } from "@/lib/knowledge";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { getResearch } from "@/lib/research";
import { useAppState } from "@/lib/store";
import { checkOf, companiesForList, createDrafts, submitForApproval, updateDraft } from "@/lib/state";

const STATUS: Record<string, { t: string; c: string }> = {
  draft: { t: "下書き", c: "bg-paper text-sub" },
  pending: { t: "承認待ち", c: "bg-found-soft text-found" },
  approved: { t: "承認済み", c: "bg-ok-soft text-ok" },
  rejected: { t: "差し戻し", c: "bg-human-soft text-human" },
  sent: { t: "送付済み", c: "bg-ai-soft text-ai" },
};
const CH_ICON: Record<Channel, typeof Mail> = { email: Mail, form: MousePointerClick, dm: MessageCircle, phone: Phone };
const ROLE = {
  ai: ["下調べにもとづき、相手に合わせた文面を3案作る", "手引きの強み、ひな形、言い換えのルールを使う", "書き直すたびに、品質チェックをやり直す"],
  human: ["3案から1つを選び、言い回しを直す", "DMと電話は、人が自分で送る・話す（AIは下書きとメモまで）"],
};

/** AIが書いている様子（見本モードでは、手順を順に見せる） */
function Writing({ steps }: { steps: string[] }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, steps.length)), 320);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="card mb-6 overflow-hidden p-0" role="status" aria-live="polite">
      <div className="h-1 bg-paper">
        <div className="h-1 bg-gradient-to-r from-ai to-found transition-all duration-300" style={{ width: `${(n / steps.length) * 100}%` }} />
      </div>
      <div className="flex items-start gap-4 p-6">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#3b6ef0] to-[#6a4bd6] text-white">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="font-bold">AI社員が連絡文を書いています…</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {steps.map((s, i) => (
              <li key={s} className={`flex items-center gap-2 transition ${i < n ? "text-ink" : i === n ? "text-ai" : "text-mute"}`}>
                {i < n ? <Check size={15} className="text-ok" strokeWidth={3} /> : i === n ? <Loader2 size={15} className="animate-spin" /> : <span className="h-[15px] w-[15px] rounded-full border border-line" />}
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Drafts() {
  const [state, update] = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const b = state.business;
  const list = companiesForList(state, b);
  const company = companyById(params.get("c") ?? "") ?? list[0];
  const [msg, setMsg] = useState("");
  const [vSel, setVSel] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);

  if (!company) {
    return (
      <>
        <PageHeader no="03" title="連絡文の下書き" lead="下調べにもとづいて、一人ひとりに合わせた文面を3案作ります。" photo={PHOTOS.deskAi} />
        <RoleBox ai={ROLE.ai} human={ROLE.human} />
        <Empty photo={PHOTOS.deskAi}>
          まだ営業リストが確定していません。<Link href="/list" className="font-bold text-ai underline">営業リストへ</Link>
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
  const generate = () => {
    setWriting(true);
    setTimeout(() => {
      update((s) => createDrafts(s, company.id, b, ch, new Date()));
      setVSel(null);
      setWriting(false);
    }, 1400);
  };
  const steps = [`下調べのカードと出典${sourcesOf(company.id).length}件を読む`, `事業ごとの手引き（${pb.short}）と共通のルールを読む`, ch === "phone" ? "電話で話す内容のメモを書く" : `${CHANNEL_LABEL[ch]}の文面を3案書く`, "品質チェックの8項目で採点する"];

  return (
    <>
      <PageHeader no="03" title="連絡文の下書き" lead="下調べの事実と、事業ごとの手引き（強み、ひな形、言ってはいけない表現）から、1社ごとに3案を作ります。書き直すと、その場で品質チェックをやり直します。" photo={PHOTOS.deskAi}>
        <Link href={`/research?c=${company.id}`} className="btn">
          ← 下調べを見る
        </Link>
      </PageHeader>
      <RoleBox ai={ROLE.ai} human={ROLE.human} />

      {list.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {list.map((c) => (
            <button key={c.id} onClick={() => go(c.id, "email")} className={`flex shrink-0 items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-sm transition ${c.id === company.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-ai/40"}`}>
              <Thumb photo={industryPhoto(c.industry)} size={28} className="rounded-lg" />
              {c.name.replace("（架空）", "")}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-white p-1.5 shadow-card" role="tablist" aria-label="連絡の手段">
          {channels.map((c) => {
            const Icon = CH_ICON[c];
            return (
              <button key={c} role="tab" aria-selected={c === ch} onClick={() => go(company.id, c)} className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ${c === ch ? "bg-ai text-white shadow-[0_6px_14px_-6px_rgb(42_91_215/0.7)]" : "text-sub hover:bg-paper"}`}>
                <Icon size={15} />
                {c === "phone" ? "電話（話す内容のメモ）" : c === "dm" ? "SNSのDM（下書きのみ）" : CHANNEL_LABEL[c]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Thumb photo={industryPhoto(company.industry)} size={32} className="rounded-lg" />
          <b>{company.name}</b>
          {research.mode === "sample" ? <span className="chip bg-ok-soft text-ok">見本（完成形）</span> : <span className="chip bg-warn-soft text-warn">簡易作成（本番ではAIで作成）</span>}
        </div>
      </div>

      {ch === "dm" && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-human/30 bg-human-soft p-4 text-sm" data-testid="dm-note">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-human" />
          <div>
            <b>DMは下書きまで。送付は人が手で行います。</b>多くのSNSの利用規約で、DMの自動送信は禁止されているため、AI社員はDMを送りません。
          </div>
        </div>
      )}

      {writing ? (
        <Writing steps={steps} />
      ) : editable.length === 0 ? (
        <div className="card mb-6 flex flex-col items-center gap-3 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#3b6ef0] to-[#6a4bd6] text-white">
            <Sparkles size={26} />
          </div>
          <p className="text-sm text-sub">{CHANNEL_LABEL[ch]}の下書きはまだありません。下調べと手引きから、AI社員が作ります。</p>
          <button className="btn btn-primary px-5 py-2.5" onClick={generate}>
            <Sparkles size={16} />
            下書きを作る{ch === "phone" ? "" : "（3案）"}
          </button>
        </div>
      ) : (
        current &&
        result && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist" aria-label="案">
              {editable.map((d) => {
                const r = checkOf(state, d);
                const on = d.id === current.id;
                return (
                  <button key={d.id} role="tab" aria-selected={on} onClick={() => setVSel(d.variant)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition ${on ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-ai/40"}`}>
                    {d.label}
                    <span className={`rounded-full px-2 py-px text-xs font-bold ${on ? "bg-white/15" : r.pass ? "bg-ok-soft text-ok" : "bg-human-soft text-human"}`}>{r.score}点</span>
                  </button>
                );
              })}
              <button className="btn ml-auto text-xs" onClick={generate}>
                <RefreshCw size={13} />
                作り直す
              </button>
            </div>
            <div className="mb-8 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
              {/* メールの作成画面のような枠 */}
              <div className="card flex flex-col overflow-hidden p-0">
                <div className="flex items-center gap-2 border-b border-line bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-sub">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2">{ch === "phone" ? "電話で話す内容のメモ" : `新しい${CHANNEL_LABEL[ch]}（下書き）`}</span>
                </div>
                <div className="divide-y divide-line text-sm">
                  {ch !== "phone" && (
                    <div className="flex gap-3 px-4 py-2.5">
                      <span className="w-14 shrink-0 text-xs font-bold text-mute">宛先</span>
                      <span>
                        {company.name}　{addressee(company.department)}
                      </span>
                    </div>
                  )}
                  {ch !== "phone" && (
                    <div className="flex gap-3 px-4 py-2.5">
                      <span className="w-14 shrink-0 text-xs font-bold text-mute">差出人</span>
                      <span>
                        {PLAYBOOKS.sender.company}　{PLAYBOOKS.sender.person}
                      </span>
                    </div>
                  )}
                  {(ch === "email" || ch === "form") && (
                    <label className="flex items-center gap-3 px-4 py-1.5">
                      <span className="w-14 shrink-0 text-xs font-bold text-mute">件名</span>
                      <input className="w-full rounded-lg px-2 py-1.5 font-bold outline-none focus:bg-ai-soft" value={current.subject} onChange={(e) => update((s) => updateDraft(s, current.id, e.target.value, current.body))} aria-label="件名" />
                    </label>
                  )}
                </div>
                <label className="flex flex-1 flex-col border-t border-line">
                  <span className="sr-only">本文</span>
                  <textarea className="block min-h-[420px] w-full flex-1 resize-y px-4 py-3 text-sm leading-7 outline-none focus:bg-[#fbfcff]" value={current.body} onChange={(e) => update((s) => updateDraft(s, current.id, current.subject, e.target.value))} aria-label="本文" />
                </label>
                <div className="flex flex-wrap items-center gap-3 border-t border-line bg-[#f8fafc] px-4 py-3">
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
                    <Send size={15} />
                    承認待ちへ回す
                  </button>
                  {!result.pass ? <span className="text-xs font-bold text-human">止める項目を直すと、回せるようになります</span> : <span className="text-xs text-mute">送付はまだしません。人の承認のあとで送ります</span>}
                </div>
              </div>
              <div className="space-y-4">
                <CheckPanel result={result} />
                <div>
                  <div className="mb-1.5 flex items-center gap-3 text-xs font-bold text-sub">
                    印を付けた本文
                    <span className="inline-flex items-center gap-1">
                      <mark className="good">青</mark>出典と結び付いた記述
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <mark className="flag">赤</mark>止める箇所
                    </span>
                  </div>
                  <Highlighted text={current.body} result={result} companyId={company.id} />
                </div>
              </div>
            </div>
          </>
        )
      )}

      {msg && (
        <p className="rise mb-6 flex items-center gap-2 rounded-2xl border border-ok/30 bg-ok-soft p-3.5 text-sm font-bold text-ok" role="status">
          <Check size={17} strokeWidth={3} />
          {msg}
          <Link href="/approvals" className="ml-1 underline">
            承認待ちを見る
          </Link>
        </p>
      )}

      {mine.filter((d) => d.status !== "draft").length > 0 && (
        <section className="card mb-6">
          <h2 className="h2 text-base">この会社に、すでに回した下書き</h2>
          <ul className="space-y-1.5 text-sm">
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

      <h2 className="h2">
        <BookOpen size={18} className="text-found" />
        使った手引き（ナレッジ）
      </h2>
      <div className="grid gap-4 text-sm md:grid-cols-3">
        <section className="card">
          <h3 className="mb-2 font-bold">事業ごとの手引き：{pb.short}</h3>
          <ul className="space-y-1">
            {pb.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">「（例）」の数字は架空の例です。</p>
        </section>
        <section className="card">
          <h3 className="mb-2 font-bold">共通のルール</h3>
          <ul className="space-y-1">
            {[...PLAYBOOKS.common.tone, PLAYBOOKS.common.senderRule].map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-found" />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3 className="mb-2 font-bold">言ってはいけない表現</h3>
          <ul className="flex flex-wrap gap-1.5">
            {activeRules(b, state.addedRules).map((r) => (
              <li key={r.phrase} className={`chip ${r.origin === "approval" ? "bg-found-soft text-found" : "bg-paper text-sub"}`} title={r.reason}>
                {r.phrase}
                {r.replace && <span className="font-medium text-mute">→{r.replace}</span>}
                {r.origin === "approval" && "（承認の修正から追加）"}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
