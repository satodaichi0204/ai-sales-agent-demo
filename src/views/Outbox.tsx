"use client";
// S7 送付と追いかけ（03 アプローチ）。承認したものだけ送れる（再現）。追いかけは返信が来たら止まる
import Link from "next/link";
import { useState } from "react";
import { PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, companyById } from "@/lib/data";
import { capReached } from "@/lib/followups";
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
      <PageHeader no="03" title="送付と追いかけ" lead="人が承認した連絡文だけを送れます。送ると、追いかけの予定（3営業日後、7日後）を自動で作り、返信が来たら止めます。" />
      <RoleBox
        ai={["承認済みの連絡文だけを、送付の時間帯と1日の上限を守って送る（デモでは再現）", "追いかけの予定を作り、返信が来たら自動で止める"]}
        human={["送付の上限と時間帯を決める", "DMと電話は、人が自分で送る・かける（AIは記録だけ）"]}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="card">
          <h2 className="h2">承認済み（送付を待っている連絡文）</h2>
          {msg && (
            <p className="mb-3 rounded-lg bg-ok-soft p-2 text-sm text-ok" role="status" data-testid="send-msg">
              {msg}
            </p>
          )}
          {approved.length === 0 ? (
            <p className="text-sm text-sub">
              ありません。<Link href="/approvals" className="text-ai underline">承認待ちへ</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {approved.map((d) => {
                const manual = d.channel === "dm" || d.channel === "phone";
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3" data-testid="approved-item" data-channel={d.channel}>
                    <div className="text-sm">
                      <div className="font-bold">{companyById(d.companyId)?.name}</div>
                      <div className="text-xs text-sub">
                        {CHANNEL_LABEL[d.channel]}／{d.label}
                        {d.decision?.kind === "approve_edit" && <span className="chip ml-1 bg-warn-soft text-warn">人が修正</span>}
                      </div>
                    </div>
                    {manual ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-human">{d.channel === "dm" ? "DMは自動で送りません" : "電話は人がかけます"}</span>
                        <button className="btn" onClick={() => doSend(d.id)} disabled={reached}>
                          人が{d.channel === "dm" ? "送った" : "かけた"}ことを記録する
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => doSend(d.id)} disabled={reached}>
                        送付する（再現）
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {reached && <p className="mt-2 text-sm text-human">今日の送付の上限に達しました。</p>}
        </section>
        <section className="card space-y-3 text-sm">
          <h2 className="h2">送付の設定</h2>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-sub">1日の送付の上限（今日 {today}件）</span>
            <input type="number" min={1} max={200} className="field" value={state.settings.dailyCap} onChange={(e) => setSettings({ dailyCap: Math.max(1, Number(e.target.value) || 1) })} />
          </label>
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
          <p className="text-xs text-sub">追いかけは、この時間帯の平日にだけ予定します。上限は、相手への迷惑と、迷惑メールと判定されることを防ぐためのものです。</p>
        </section>
      </div>

      <h2 className="h2">送付の記録と、追いかけの予定</h2>
      {state.sends.length === 0 ? (
        <div className="card text-sm text-sub">まだ送っていません。</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="tbl min-w-[720px]" data-testid="sends">
            <thead>
              <tr>
                <th>送付</th>
                <th>会社</th>
                <th>手段</th>
                <th>追いかけの予定</th>
              </tr>
            </thead>
            <tbody>
              {state.sends.map((x) => (
                <tr key={x.id} data-company={x.companyId}>
                  <td className="whitespace-nowrap">
                    {fmt(x.sentAt)}
                    <div className="text-xs text-sub">{x.manual ? "人が手で送付" : "送付済み（デモ：実際には送信していません）"}</div>
                  </td>
                  <td>{companyById(x.companyId)?.name}</td>
                  <td>{CHANNEL_LABEL[x.channel]}</td>
                  <td>
                    {x.followUps.length === 0 ? (
                      <span className="text-xs text-sub">なし</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {x.followUps.map((f) => (
                          <li key={f.label} className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`chip ${f.status === "stopped" ? "bg-paper text-off" : "bg-ai-soft text-ai"}`} data-testid="followup">
                              {f.status === "stopped" ? "停止（返信あり）" : "予定"}
                            </span>
                            {f.label}：{fmt(f.due)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
