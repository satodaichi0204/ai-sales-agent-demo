"use client";
// S5 品質チェック（14 土台）。わざと問題を入れた下書きで止まる様子と、作った下書きの一覧
import Link from "next/link";
import CheckPanel, { Highlighted } from "@/components/CheckPanel";
import { PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, PROBLEMS, companyById } from "@/lib/data";
import { CHECKS } from "@/lib/quality";
import { useAppState } from "@/lib/store";
import { checkOf } from "@/lib/state";

export default function Check() {
  const [state] = useAppState();
  const mine = state.drafts.filter((d) => d.status === "draft" || d.status === "pending");

  return (
    <>
      <PageHeader no="14" title="品質チェック" lead="すべての下書きを、送付の前に自動で採点します。止める項目が1つでもあれば、承認待ちに進めません。点数は100点から、止める項目1つで20点、注意1つで5点を引きます。" />
      <RoleBox
        ai={["8つの項目で、すべての下書きを自動で採点する", "問題の箇所に印を付け、理由を書く", "止める項目があれば、承認待ちに進めない"]}
        human={["チェックを通った下書きでも、最後は人が読んで承認する（次の画面）", "チェックの項目やルールが足りなければ、手引きに加える"]}
      />

      <section className="card mb-6 overflow-x-auto p-0">
        <table className="tbl min-w-[640px]">
          <thead>
            <tr>
              <th>項目</th>
              <th>見ること</th>
              <th>結果</th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map((c) => (
              <tr key={c.id}>
                <td className="font-bold whitespace-nowrap">{c.label}</td>
                <td>{c.detail}</td>
                <td>{c.id === "length" ? <span className="chip bg-warn-soft text-warn">注意</span> : <span className="chip bg-human text-white">止める</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="h2">わざと問題を入れた下書き（見本の{PROBLEMS.length}件）</h2>
      <p className="mb-3 text-sm text-sub">AIが作る下書きでも、このような間違いは起こりえます。品質チェックで止まり、承認待ちには進めないことを確かめられます。</p>
      <div className="mb-8 space-y-4">
        {PROBLEMS.map((p) => {
          const r = checkOf(state, { ...p, companyId: p.companyId });
          const c = companyById(p.companyId)!;
          return (
            <article key={p.id} className="card" data-testid={`problem-${p.id}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold">{p.title}</h3>
                  <div className="text-xs text-sub">
                    宛先：{c.name}（{c.department}）／{CHANNEL_LABEL[p.channel]}
                    {p.channel === "dm" && `／送り方：${p.sendMode === "auto" ? "自動で送る" : "人が手で送る"}`}
                  </div>
                </div>
                <button className="btn" disabled>
                  承認待ちへ回す（止める項目があるため不可）
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  {p.subject && <div className="mb-1 text-sm">件名：{p.subject}</div>}
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
          まだありません。<Link href="/drafts" className="text-ai underline">連絡文の下書きへ</Link>
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
                return (
                  <tr key={d.id}>
                    <td>{companyById(d.companyId)?.name}</td>
                    <td>
                      {CHANNEL_LABEL[d.channel]}／{d.label}
                    </td>
                    <td className="font-bold">{r.score}</td>
                    <td>
                      {d.status === "pending" ? <span className="chip bg-[#efe7fa] text-[#6b4a9b]">承認待ち</span> : r.pass ? <span className="chip bg-ok-soft text-ok">通過</span> : <span className="chip bg-human text-white">止める {r.issues.filter((i) => i.severity === "stop").length}件</span>}
                      <Link href={`/drafts?c=${d.companyId}&ch=${d.channel}`} className="ml-2 text-xs text-ai underline">
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
