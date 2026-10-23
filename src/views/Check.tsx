"use client";
// S5 品質チェック（14 土台）。わざと問題を入れた下書きで止まる様子と、作った下書きの一覧
import { AtSign, BadgeAlert, FileSearch, Lock, Megaphone, OctagonX, Ruler, ShieldBan, UserX } from "lucide-react";
import Link from "next/link";
import CheckPanel, { Highlighted } from "@/components/CheckPanel";
import { PageHeader, RoleBox, Thumb } from "@/components/ui";
import { CHANNEL_LABEL, PROBLEMS, companyById } from "@/lib/data";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { CHECKS, type CheckId } from "@/lib/quality";
import { useAppState } from "@/lib/store";
import { checkOf } from "@/lib/state";

const ICON: Record<CheckId, typeof AtSign> = { grounding: FileSearch, hype: Megaphone, sender: AtSign, recipient: UserX, privacy: Lock, ng: ShieldBan, length: Ruler, channel: BadgeAlert };

export default function Check() {
  const [state] = useAppState();
  const mine = state.drafts.filter((d) => d.status === "draft" || d.status === "pending");

  return (
    <>
      <PageHeader no="14" title="品質チェック" lead="すべての下書きを、送付の前に自動で採点します。止める項目が1つでもあれば、承認待ちに進めません。点数は100点から、止める項目1つで20点、注意1つで5点を引きます。" photo={PHOTOS.notePc} />
      <RoleBox
        ai={["8つの項目で、すべての下書きを自動で採点する", "問題の箇所に印を付け、理由を書く", "止める項目があれば、承認待ちに進めない"]}
        human={["チェックを通った下書きでも、最後は人が読んで承認する（次の画面）", "チェックの項目やルールが足りなければ、手引きに加える"]}
      />

      <h2 className="h2">チェックする8つの項目</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHECKS.map((c) => {
          const Icon = ICON[c.id];
          const stop = c.id !== "length";
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${stop ? "bg-human-soft text-human" : "bg-warn-soft text-warn"}`}>
                  <Icon size={18} />
                </span>
                {stop ? <span className="chip bg-human text-white">止める</span> : <span className="chip bg-warn-soft text-warn">注意</span>}
              </div>
              <div className="mt-2 font-bold">{c.label}</div>
              <p className="text-[13px] leading-relaxed text-sub">{c.detail}</p>
            </div>
          );
        })}
      </div>

      <h2 className="h2">
        <OctagonX size={19} className="text-human" />
        わざと問題を入れた下書き（見本の{PROBLEMS.length}件）
      </h2>
      <p className="mb-4 text-sm text-sub">AIが作る下書きでも、このような間違いは起こりえます。品質チェックで止まり、承認待ちには進めないことを確かめられます。</p>
      <div className="mb-10 space-y-5">
        {PROBLEMS.map((p, k) => {
          const r = checkOf(state, { ...p, companyId: p.companyId });
          const c = companyById(p.companyId)!;
          return (
            <article key={p.id} className="card overflow-hidden p-0" data-testid={`problem-${p.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#fbfcfe] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Thumb photo={industryPhoto(c.industry)} size={44} />
                  <div>
                    <div className="eyebrow">問題の見本 {k + 1}</div>
                    <h3 className="font-bold">{p.title}</h3>
                    <div className="text-xs text-sub">
                      宛先：{c.name}（{c.department}）／{CHANNEL_LABEL[p.channel]}
                      {p.channel === "dm" && `／送り方：${p.sendMode === "auto" ? "自動で送る" : "人が手で送る"}`}
                    </div>
                  </div>
                </div>
                <button className="btn" disabled>
                  承認待ちへ回す（止める項目があるため不可）
                </button>
              </div>
              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <div>
                  {p.subject && (
                    <div className="mb-2 text-sm">
                      <span className="text-xs font-bold text-mute">件名</span>　{p.subject}
                    </div>
                  )}
                  <Highlighted text={p.body} result={r} companyId={c.id} />
                </div>
                <CheckPanel result={r} />
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="h2">作った下書き（{mine.length}件）</h2>
      {mine.length === 0 ? (
        <div className="card text-sm text-sub">
          まだありません。<Link href="/drafts" className="font-bold text-ai underline">連絡文の下書きへ</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="tbl min-w-[640px]">
            <thead>
              <tr>
                <th>会社</th>
                <th>手段と案</th>
                <th>点数</th>
                <th>結果</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((d) => {
                const r = checkOf(state, d);
                const c = companyById(d.companyId)!;
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Thumb photo={industryPhoto(c.industry)} size={32} className="rounded-lg" />
                        {c.name}
                      </div>
                    </td>
                    <td className="align-middle">
                      {CHANNEL_LABEL[d.channel]}／{d.label}
                    </td>
                    <td className="align-middle font-black tabular-nums">{r.score}</td>
                    <td className="align-middle">
                      {d.status === "pending" ? <span className="chip bg-found-soft text-found">承認待ち</span> : r.pass ? <span className="chip bg-ok-soft text-ok">通過</span> : <span className="chip bg-human text-white">止める {r.issues.filter((i) => i.severity === "stop").length}件</span>}
                      <Link href={`/drafts?c=${d.companyId}&ch=${d.channel}`} className="ml-2 text-xs font-bold text-ai underline">
                        開く
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
