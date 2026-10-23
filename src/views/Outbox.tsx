"use client";
// S7 送付と追いかけ（03 アプローチ）。承認したものだけ送れる（再現）。追いかけは返信が来たら止まる
import { CalendarClock, CircleCheck, Hand, Mail, PauseCircle, Send, Settings2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Empty, PageHeader, RoleBox, Thumb } from "@/components/ui";
import { CHANNEL_LABEL, companyById } from "@/lib/data";
import { capReached } from "@/lib/followups";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { useAppState } from "@/lib/store";
import { send, type Settings } from "@/lib/state";

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function Outbox() {
  const [state, update] = useAppState();
  const [msg, setMsg] = useState("");
  const approved = state.drafts.filter((d) => d.status === "approved");
  const reached = capReached(state.sends, new Date(), state.settings);
  const today = state.sends.filter((x) => new Date(x.sentAt).toDateString() === new Date().toDateString()).length;
  const setSettings = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const doSend = (id: string) => {
    let m = "";
    update((s) => {
      const r = send(s, id, new Date());
      m = r.message;
      return r.state;
    });
    setMsg(m);
  };

  return (
    <>
      <PageHeader no="03" title="送付と追いかけ" lead="人が承認した連絡文だけを送れます。送ると、追いかけの予定（3営業日後、7日後）を自動で作り、返信が来たら止めます。" photo={PHOTOS.dslr} />
      <RoleBox
        ai={["承認済みの連絡文だけを、送付の時間帯と1日の上限を守って送る（デモでは再現）", "追いかけの予定を作り、返信が来たら自動で止める"]}
        human={["送付の上限と時間帯を決める", "DMと電話は、人が自分で送る・かける（AIは記録だけ）"]}
      />

      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_330px]">
        <section className="card">
          <h2 className="h2 text-base">
            <CircleCheck size={18} className="text-ok" />
            承認済み（送付を待っている連絡文）
          </h2>
          {msg && (
            <p className="rise mb-3 flex items-center gap-2 rounded-xl bg-ok-soft p-3 text-sm font-bold text-ok" role="status" data-testid="send-msg">
              <Send size={15} />
              {msg}
            </p>
          )}
          {approved.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-sub">
              ありません。<Link href="/approvals" className="font-bold text-ai underline">承認待ちへ</Link>
            </p>
          ) : (
            <ul className="space-y-2.5">
              {approved.map((d) => {
                const manual = d.channel === "dm" || d.channel === "phone";
                const c = companyById(d.companyId)!;
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-3" data-testid="approved-item" data-channel={d.channel}>
                    <div className="flex items-center gap-3 text-sm">
                      <Thumb photo={industryPhoto(c.industry)} size={44} />
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-xs text-sub">
                          {CHANNEL_LABEL[d.channel]}／{d.label}
                          {d.decision?.kind === "approve_edit" && <span className="chip ml-1 bg-warn-soft text-warn">人が修正</span>}
                        </div>
                      </div>
                    </div>
                    {manual ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-human">{d.channel === "dm" ? "DMは自動で送りません" : "電話は人がかけます"}</span>
                        <button className="btn" onClick={() => doSend(d.id)} disabled={reached}>
                          <Hand size={15} />
                          人が{d.channel === "dm" ? "送った" : "かけた"}ことを記録する
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => doSend(d.id)} disabled={reached}>
                        <Send size={15} />
                        送付する（再現）
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {reached && <p className="mt-2 text-sm font-bold text-human">今日の送付の上限に達しました。</p>}
        </section>
        <section className="card space-y-4 text-sm">
          <h2 className="h2 text-base">
            <Settings2 size={18} className="text-ai" />
            送付の設定
          </h2>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-sub">1日の送付の上限（今日 {today}件）</span>
            <input type="number" min={1} max={200} className="field" value={state.settings.dailyCap} onChange={(e) => setSettings({ dailyCap: Math.max(1, Number(e.target.value) || 1) })} />
          </label>
          <div className="h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-2 rounded-full bg-ai" style={{ width: `${Math.min(100, (today / state.settings.dailyCap) * 100)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block text-xs font-bold text-sub">送付の時間帯（開始）</span>
              <select className="field" value={state.settings.windowStart} onChange={(e) => setSettings({ windowStart: Number(e.target.value) })}>
                {[7, 8, 9, 10].map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold text-sub">（終わり）</span>
              <select className="field" value={state.settings.windowEnd} onChange={(e) => setSettings({ windowEnd: Number(e.target.value) })}>
                {[17, 18, 19, 20].map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs leading-relaxed text-sub">追いかけは、この時間帯の平日にだけ予定します。上限は、相手への迷惑と、迷惑メールと判定されることを防ぐためのものです。</p>
        </section>
      </div>

      <h2 className="h2">
        <CalendarClock size={19} className="text-ai" />
        送付の記録と、追いかけの予定
      </h2>
      {state.sends.length === 0 ? (
        <Empty photo={PHOTOS.dslr}>まだ送っていません。</Empty>
      ) : (
        <ul className="space-y-3" data-testid="sends">
          {state.sends.map((x) => {
            const c = companyById(x.companyId)!;
            return (
              <li key={x.id} className="card p-4" data-company={x.companyId}>
                <div className="flex flex-wrap items-center gap-3">
                  <Thumb photo={industryPhoto(c.industry)} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-sub">
                      {CHANNEL_LABEL[x.channel]}・{fmt(x.sentAt)}・{x.manual ? "人が手で送付" : "送付済み（デモ：実際には送信していません）"}
                    </div>
                  </div>
                </div>
                {x.followUps.length > 0 && (
                  <ol className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-3">
                    <li className="flex items-center gap-2 text-xs">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-ai text-white">
                        <Mail size={13} />
                      </span>
                      <span>
                        <b className="block">送付</b>
                        {fmt(x.sentAt)}
                      </span>
                    </li>
                    {x.followUps.map((f) => (
                      <li key={f.label} className="flex items-center gap-2 text-xs">
                        <span className={`grid h-7 w-7 place-items-center rounded-full ${f.status === "stopped" ? "bg-paper text-mute" : "bg-ai-soft text-ai"}`}>{f.status === "stopped" ? <PauseCircle size={14} /> : <CalendarClock size={13} />}</span>
                        <span>
                          <b className="block">{f.label}</b>
                          {fmt(f.due)}
                          <span className={`chip ml-1 px-2 py-0 ${f.status === "stopped" ? "bg-paper text-sub" : "bg-ai-soft text-ai"}`} data-testid="followup">
                            {f.status === "stopped" ? "停止（返信あり）" : "予定"}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
