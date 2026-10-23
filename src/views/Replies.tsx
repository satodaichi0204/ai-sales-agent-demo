"use client";
// S8 返信の仕分け（03 アプローチ）。AIが分類し、次の行動を提案。配信停止とお断りは自動で除外リストへ
import { PageHeader, RoleBox } from "@/components/ui";
import { REPLIES, companyById, type ReplyCategory } from "@/lib/data";
import { AUTO_EXCLUDE, CATEGORY_LABEL, NEXT_ACTION, POSITIVE } from "@/lib/replies";
import { useAppState } from "@/lib/store";
import { receiveReplies, setReplyCategory } from "@/lib/state";

const CAT_CLS = (c: ReplyCategory) => (POSITIVE.includes(c) ? "bg-ok-soft text-ok" : AUTO_EXCLUDE.includes(c) ? "bg-human text-white" : c === "other" ? "bg-warn-soft text-warn" : "bg-paper text-sub");

function withKeyword(text: string, kw: string | null) {
  if (!kw || !text.includes(kw)) return text;
  const [a, ...rest] = text.split(kw);
  return (
    <>
      {a}
      <mark className="good" title="分類の決め手">
        {kw}
      </mark>
      {rest.join(kw)}
    </>
  );
}

export default function Replies() {
  const [state, update] = useAppState();
  const replies = state.replies;
  const counts = replies ? (Object.keys(CATEGORY_LABEL) as ReplyCategory[]).map((c) => [c, replies.filter((r) => r.category === c).length] as const).filter(([, n]) => n > 0) : [];
  const fromDemo = replies?.filter((r) => state.sends.some((x) => x.id === r.sendId)).length ?? 0;

  return (
    <>
      <PageHeader no="03" title="返信の仕分け" lead="届いた返信をAIが分類し、次の行動を提案します。配信停止とお断りは、自動で除外リストに入り、今後は連絡しません。">
        <button className="btn btn-primary" disabled={!!replies} onClick={() => update((s) => receiveReplies(s, new Date()))}>
          {replies ? "返信を受け取りました" : "返信を受け取る（デモ：架空の12件）"}
        </button>
      </PageHeader>
      <RoleBox
        ai={["返信を7つに分類し、決め手の言葉を示す", "次の行動を提案する（商談の候補、資料、日程、宛先の変更、再連絡の予定）", "配信停止とお断りを除外リストに入れ、追いかけを止める"]}
        human={["分類を確かめ、違っていれば直す", "興味あり・日程の調整には、人が自分で返事をし、商談を行う"]}
      />

      {!replies ? (
        <div className="card text-sm">
          <p>上のボタンを押すと、架空の返信12件が届きます。デモで送った連絡文があれば、新しく送ったものから順に返信が届き、その会社の追いかけが止まります。</p>
          <p className="mt-2 text-sub">内訳：興味あり3、資料がほしい2、日程の調整2、担当者が違う1、今は不要2、お断り1、配信停止1</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2" data-testid="reply-counts">
            {counts.map(([c, n]) => (
              <span key={c} className={`chip px-3 py-1 text-sm ${CAT_CLS(c)}`}>
                {CATEGORY_LABEL[c]} {n}件
              </span>
            ))}
          </div>
          {fromDemo > 0 && <p className="mb-3 text-sm text-sub">デモで送った{fromDemo}件に返信が届き、その会社の追いかけの予定を止めました。</p>}
          <div className="card overflow-x-auto p-0">
            <table className="tbl min-w-[900px]" data-testid="replies">
              <thead>
                <tr>
                  <th className="w-48">差出人</th>
                  <th>返信</th>
                  <th className="w-40">AIの分類</th>
                  <th className="w-64">次の行動（提案）</th>
                </tr>
              </thead>
              <tbody>
                {replies.map((r) => {
                  const rep = REPLIES.find((x) => x.id === r.replyId)!;
                  return (
                    <tr key={r.replyId} data-id={r.replyId} data-category={r.category}>
                      <td>
                        <div className="font-bold">{companyById(r.companyId)?.name}</div>
                        <div className="text-xs text-sub">{rep.person}</div>
                      </td>
                      <td className="text-sm">{withKeyword(rep.text, r.keyword)}</td>
                      <td>
                        <span className={`chip ${CAT_CLS(r.category)}`}>{CATEGORY_LABEL[r.category]}</span>
                        {r.byHuman && <span className="chip ml-1 bg-warn-soft text-warn">人が修正</span>}
                        <select className="field mt-1 py-1 text-xs" value={r.category} onChange={(e) => update((s) => setReplyCategory(s, r.replyId, e.target.value as ReplyCategory, new Date()))} aria-label="分類を直す">
                          {(Object.keys(CATEGORY_LABEL) as ReplyCategory[]).map((c) => (
                            <option key={c} value={c}>
                              {CATEGORY_LABEL[c]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-sm">{NEXT_ACTION[r.category]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <section className="card mt-4">
            <h2 className="h2">除外リスト（返信から自動で追加）</h2>
            <ul className="space-y-1 text-sm" data-testid="exclusions">
              {state.exclusions.map((e) => (
                <li key={e.companyId + e.reason}>
                  <span className="chip mr-2 bg-human text-white">{e.reason === "unsubscribed" ? "配信停止" : "お断り"}</span>
                  {companyById(e.companyId)?.name}（営業リストに出なくなります）
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
