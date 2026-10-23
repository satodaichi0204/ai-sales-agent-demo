"use client";
// S8 返信の仕分け（03 アプローチ）。AIが分類し、次の行動を提案。配信停止とお断りは自動で除外リストへ
import { ArrowRight, Ban, Download, Inbox } from "lucide-react";
import { Empty, PageHeader, RoleBox, Thumb } from "@/components/ui";
import { REPLIES, companyById, type ReplyCategory } from "@/lib/data";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { AUTO_EXCLUDE, CATEGORY_LABEL, NEXT_ACTION, POSITIVE } from "@/lib/replies";
import { useAppState } from "@/lib/store";
import { receiveReplies, setReplyCategory } from "@/lib/state";

// 分類の色：前向き＝緑の濃淡、中立＝灰、除外＝赤（色だけに頼らず、必ず文字の分類名と並べる）
const CAT_COLOR: Record<ReplyCategory, string> = {
  interested: "#148a55",
  materials: "#3aa877",
  schedule: "#76c79f",
  wrong_person: "#8a94a6",
  not_now: "#b8c0cc",
  decline: "#e0795f",
  unsubscribe: "#c0391f",
  other: "#eda100",
};
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
  const cats = Object.keys(CATEGORY_LABEL) as ReplyCategory[];
  const counts = replies ? cats.map((c) => [c, replies.filter((r) => r.category === c).length] as const).filter(([, n]) => n > 0) : [];
  const fromDemo = replies?.filter((r) => state.sends.some((x) => x.id === r.sendId)).length ?? 0;

  return (
    <>
      <PageHeader no="03" title="返信の仕分け" lead="届いた返信をAIが分類し、次の行動を提案します。配信停止とお断りは、自動で除外リストに入り、今後は連絡しません。" photo={PHOTOS.selfieEvent}>
        <button className="btn btn-primary" disabled={!!replies} onClick={() => update((s) => receiveReplies(s, new Date()))}>
          <Download size={16} />
          {replies ? "返信を受け取りました" : "返信を受け取る（デモ：架空の12件）"}
        </button>
      </PageHeader>
      <RoleBox
        ai={["返信を7つに分類し、決め手の言葉を示す", "次の行動を提案する（商談の候補、資料、日程、宛先の変更、再連絡の予定）", "配信停止とお断りを除外リストに入れ、追いかけを止める"]}
        human={["分類を確かめ、違っていれば直す", "興味あり・日程の調整には、人が自分で返事をし、商談を行う"]}
      />

      {!replies ? (
        <Empty photo={PHOTOS.selfieEvent}>
          <p>上のボタンを押すと、架空の返信12件が届きます。デモで送った連絡文があれば、新しく送ったものから順に返信が届き、その会社の追いかけが止まります。</p>
          <p className="mt-2 text-mute">内訳：興味あり3、資料がほしい2、日程の調整2、担当者が違う1、今は不要2、お断り1、配信停止1</p>
        </Empty>
      ) : (
        <>
          <section className="card mb-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="h2 mb-0 text-base">
                <Inbox size={18} className="text-ai" />
                受け取った返信 {replies.length}件の分類
              </h2>
              <span className="text-xs text-sub">前向き（興味あり・資料・日程）：{replies.filter((r) => POSITIVE.includes(r.category)).length}件</span>
            </div>
            <div className="mb-3 flex h-4 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={counts.map(([c, n]) => `${CATEGORY_LABEL[c]} ${n}件`).join("、")}>
              {counts.map(([c, n]) => (
                <span key={c} style={{ width: `${(n / replies.length) * 100}%`, background: CAT_COLOR[c] }} title={`${CATEGORY_LABEL[c]} ${n}件`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2" data-testid="reply-counts">
              {counts.map(([c, n]) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLOR[c] }} />
                  {CATEGORY_LABEL[c]} {n}件
                </span>
              ))}
            </div>
            {fromDemo > 0 && <p className="mt-3 text-sm text-sub">デモで送った{fromDemo}件に返信が届き、その会社の追いかけの予定を止めました。</p>}
          </section>

          <ul className="space-y-3" data-testid="replies">
            {replies.map((r) => {
              const rep = REPLIES.find((x) => x.id === r.replyId)!;
              const c = companyById(r.companyId)!;
              return (
                <li key={r.replyId} data-id={r.replyId} data-category={r.category} className="card grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="flex gap-3">
                    <Thumb photo={industryPhoto(c.industry)} size={46} className="rounded-full" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="font-bold" data-testid="reply-company">
                          {c.name}
                        </span>
                        <span className="text-xs text-mute">{rep.person}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{withKeyword(rep.text, r.keyword)}</p>
                      <p className="mt-2 flex items-start gap-1.5 text-[13px] text-sub">
                        <ArrowRight size={14} className="mt-1 shrink-0 text-ai" />
                        <span>
                          <b className="text-ink">次の行動（提案）：</b>
                          {NEXT_ACTION[r.category]}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 md:border-l md:border-line md:pl-4">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="eyebrow mr-1">AIの分類</span>
                      <span className={`chip ${CAT_CLS(r.category)}`}>{CATEGORY_LABEL[r.category]}</span>
                      {r.byHuman && <span className="chip bg-warn-soft text-warn">人が修正</span>}
                    </div>
                    <select className="field py-1.5 text-xs" value={r.category} onChange={(e) => update((s) => setReplyCategory(s, r.replyId, e.target.value as ReplyCategory, new Date()))} aria-label="分類を直す">
                      {cats.map((k) => (
                        <option key={k} value={k}>
                          {CATEGORY_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>

          <section className="card mt-5 border-human/25">
            <h2 className="h2 text-base">
              <Ban size={18} className="text-human" />
              除外リスト（返信から自動で追加）
            </h2>
            <ul className="space-y-2 text-sm" data-testid="exclusions">
              {state.exclusions.map((e) => {
                const c = companyById(e.companyId)!;
                return (
                  <li key={e.companyId + e.reason} className="flex items-center gap-2.5">
                    <Thumb photo={industryPhoto(c.industry)} size={30} className="rounded-lg grayscale" />
                    <span className="chip bg-human text-white">{e.reason === "unsubscribed" ? "配信停止" : "お断り"}</span>
                    {c.name}
                    <span className="text-xs text-mute">（営業リストに出なくなります）</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
