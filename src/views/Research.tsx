"use client";
// S3 下調べ（02 営業準備）。すべての記述に、架空の公開情報の出典を付け、クリックで元の文が見られる
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Empty, PageHeader, RoleBox } from "@/components/ui";
import { PLAYBOOKS, SIZE_LABEL, companyById, sourceById, sourcesOf } from "@/lib/data";
import { getResearch } from "@/lib/research";
import { useAppState } from "@/lib/store";
import { companiesForList } from "@/lib/state";

const KIND: Record<string, string> = { site: "会社のサイト", news: "ニュース", recruit: "採用ページ", sns: "公式のお知らせ" };

export default function Research() {
  const [state] = useAppState();
  const params = useSearchParams();
  const b = state.business;
  const list = companiesForList(state, b);
  const company = companyById(params.get("c") ?? "") ?? list[0];
  const [openId, setOpenId] = useState<string | null>(null);

  if (!company) {
    return (
      <>
        <PageHeader no="02" title="下調べ" lead="営業リストで選んだ会社の下調べです。" />
        <RoleBox
          ai={["公開情報（会社のサイト、ニュース、採用ページ）を読み、要点をまとめる", "すべての記述に出典を付ける。出典のない推測は書かない", "事業ごとの手引きから、提案の切り口を選ぶ"]}
          human={["出典の元の文を開き、内容が合っているかを確かめる（特に数字と日付）", "提案の切り口が、相手にとって失礼でないかを確かめる"]}
        />
        <Empty>
          まだ営業リストが確定していません。<Link href="/list" className="text-ai underline">営業リストへ</Link>
        </Empty>
      </>
    );
  }
  const research = getResearch(company, b);
  const sources = sourcesOf(company.id);
  const open = openId && sourceById(openId)?.companyId === company.id ? sourceById(openId) : null;

  return (
    <>
      <PageHeader no="02" title="下調べ" lead="会社の概要、最近の出来事、提案の切り口、話しかける相手。すべての記述に出典を付けます。出典のない推測は書きません。">
        <Link href={`/drafts?c=${company.id}`} className="btn btn-primary">
          この会社の連絡文を作る →
        </Link>
      </PageHeader>
      <RoleBox
        ai={["公開情報（会社のサイト、ニュース、採用ページ）を読み、要点をまとめる", "すべての記述に出典を付ける。出典のない推測は書かない", "事業ごとの手引きから、提案の切り口を選ぶ"]}
        human={["出典の元の文を開き、内容が合っているかを確かめる（特に数字と日付）", "提案の切り口が、相手にとって失礼でないかを確かめる"]}
      />

      {list.length > 0 && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="営業リストの会社">
          {list.map((c) => (
            <Link key={c.id} href={`/research?c=${c.id}`} className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${c.id === company.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:bg-paper"}`}>
              {c.name.replace("（架空）", "")}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <article className="card" data-testid="research-card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="text-xl font-bold">{company.name}</h2>
              <div className="text-sm text-sub">
                {company.industry}・{SIZE_LABEL[company.size]}・{company.region}　／　{PLAYBOOKS.businesses[b].name}の営業として
              </div>
            </div>
            {research.mode === "sample" ? <span className="chip bg-ok-soft text-ok">見本（完成形）</span> : <span className="chip bg-warn-soft text-warn">簡易作成（本番ではAIで作成）</span>}
          </div>
          <dl className="space-y-3">
            {research.statements.map((st, i) => (
              <div key={i} className="grid gap-1 sm:grid-cols-[120px_1fr]">
                <dt className="text-xs font-bold text-sub sm:pt-0.5">{st.label}</dt>
                <dd>
                  <span>{st.text}</span>
                  <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
                    {st.sources.map((sid) => {
                      const n = sources.findIndex((s) => s.id === sid) + 1;
                      return (
                        <button key={sid} onClick={() => setOpenId(sid)} className={`rounded border px-1.5 text-xs font-bold ${openId === sid ? "border-ai bg-ai text-white" : "border-ai/40 bg-ai-soft text-ai hover:bg-ai hover:text-white"}`} aria-label={`出典${n}を開く`}>
                          出典{n}
                        </button>
                      );
                    })}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-lg bg-paper p-3 text-xs text-sub">提案の切り口は、出典の事実にもとづく「こちらからの提案」です。相手の会社についての推測（予算、悩み、社内の事情など）は書きません。</p>
        </article>

        <aside className="space-y-3">
          <section className="card" data-testid="source-panel">
            <h3 className="mb-2 font-bold">出典の元の文</h3>
            {open ? (
              <div>
                <div className="text-xs text-sub">
                  {KIND[open.kind]}　{open.date}
                </div>
                <div className="font-bold">{open.title}</div>
                <div className="mb-2 text-xs break-all text-sub">{open.url}（架空のURL）</div>
                <blockquote className="rounded-lg border-l-4 border-ai bg-ai-soft p-3 text-sm">{open.text}</blockquote>
              </div>
            ) : (
              <p className="text-sm text-sub">左の「出典」を押すと、元の文が表示されます。</p>
            )}
          </section>
          <section className="card">
            <h3 className="mb-2 font-bold">読んだ公開情報（{sources.length}件）</h3>
            <ol className="space-y-1.5 text-sm">
              {sources.map((s, i) => (
                <li key={s.id}>
                  <button className="text-left hover:underline" onClick={() => setOpenId(s.id)}>
                    <span className="mr-1 font-bold text-ai">出典{i + 1}</span>
                    {KIND[s.kind]}（{s.date}）
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-sub">デモのため、公開情報もすべて架空の文です。実在のサイトにはアクセスしていません。</p>
          </section>
        </aside>
      </div>
    </>
  );
}
