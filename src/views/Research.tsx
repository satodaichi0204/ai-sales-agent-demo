"use client";
// S3 下調べ（02 営業準備）。すべての記述に、架空の公開情報の出典を付け、クリックで元の文が見られる
import { ArrowRight, Building2, CalendarDays, FileText, Lightbulb, Newspaper, Quote, UserRound, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Empty, PageHeader, RoleBox, Thumb } from "@/components/ui";
import { PLAYBOOKS, SIZE_LABEL, companyById, sourceById, sourcesOf } from "@/lib/data";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { getResearch } from "@/lib/research";
import { useAppState } from "@/lib/store";
import { companiesForList } from "@/lib/state";

const KIND: Record<string, string> = { site: "会社のサイト", news: "ニュース", recruit: "採用ページ", sns: "公式のお知らせ" };
const LABEL_ICON: Record<string, typeof Building2> = { 会社の概要: Building2, お店の概要: Building2, 宿の概要: Building2, 最近の出来事: CalendarDays, 提案の切り口: Lightbulb, 話しかける相手: UserRound };
const ROLE = {
  ai: ["公開情報（会社のサイト、ニュース、採用ページ）を読み、要点をまとめる", "すべての記述に出典を付ける。出典のない推測は書かない", "事業ごとの手引きから、提案の切り口を選ぶ"],
  human: ["出典の元の文を開き、内容が合っているかを確かめる（特に数字と日付）", "提案の切り口が、相手にとって失礼でないかを確かめる"],
};

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
        <PageHeader no="02" title="下調べ" lead="営業リストで選んだ会社の下調べです。" photo={PHOTOS.notePc} />
        <RoleBox ai={ROLE.ai} human={ROLE.human} />
        <Empty photo={PHOTOS.notePc}>
          まだ営業リストが確定していません。<Link href="/list" className="font-bold text-ai underline">営業リストへ</Link>
        </Empty>
      </>
    );
  }
  const research = getResearch(company, b);
  const sources = sourcesOf(company.id);
  const open = openId && sourceById(openId)?.companyId === company.id ? sourceById(openId) : null;
  const photo = industryPhoto(company.industry);

  return (
    <>
      <PageHeader no="02" title="下調べ" lead="会社の概要、最近の出来事、提案の切り口、話しかける相手。すべての記述に出典を付けます。出典のない推測は書きません。" photo={PHOTOS.notePc}>
        <Link href={`/drafts?c=${company.id}`} className="btn btn-primary">
          この会社の連絡文を作る
          <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <RoleBox ai={ROLE.ai} human={ROLE.human} />

      {list.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="営業リストの会社">
          {list.map((c) => (
            <Link key={c.id} href={`/research?c=${c.id}`} className={`flex shrink-0 items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-sm transition ${c.id === company.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-ai/40"}`}>
              <Thumb photo={industryPhoto(c.industry)} size={28} className="rounded-lg" />
              {c.name.replace("（架空）", "")}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <article className="card overflow-hidden p-0" data-testid="research-card">
          <div className="relative h-44">
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute right-5 bottom-4 left-5 flex flex-wrap items-end justify-between gap-2 text-white">
              <div>
                <h2 className="text-2xl font-black">{company.name}</h2>
                <div className="text-sm text-white/85">
                  {company.industry}・{SIZE_LABEL[company.size]}・{company.region}　／　{PLAYBOOKS.businesses[b].name}の営業として
                </div>
              </div>
              {research.mode === "sample" ? <span className="chip bg-ok text-white">見本（完成形）</span> : <span className="chip bg-warn text-white">簡易作成（本番ではAIで作成）</span>}
            </div>
          </div>
          <dl className="divide-y divide-line">
            {research.statements.map((st, i) => {
              const Icon = LABEL_ICON[st.label] ?? FileText;
              return (
                <div key={i} className="grid gap-2 px-5 py-4 sm:grid-cols-[150px_1fr]">
                  <dt className="flex items-center gap-2 text-xs font-bold text-sub">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${st.label === "提案の切り口" ? "bg-warn-soft text-warn" : "bg-ai-soft text-ai"}`}>
                      <Icon size={15} />
                    </span>
                    {st.label}
                  </dt>
                  <dd className="leading-relaxed">
                    <span>{st.text}</span>
                    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                      {st.sources.map((sid) => {
                        const n = sources.findIndex((s) => s.id === sid) + 1;
                        return (
                          <button key={sid} onClick={() => setOpenId(sid)} className={`rounded-md px-1.5 py-px text-[11px] font-bold transition ${openId === sid ? "bg-ai text-white" : "bg-ai-soft text-ai hover:bg-ai hover:text-white"}`} aria-label={`出典${n}を開く`}>
                            出典{n}
                          </button>
                        );
                      })}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="m-5 mt-0 rounded-xl bg-paper p-3 text-xs text-sub">提案の切り口は、出典の事実にもとづく「こちらからの提案」です。相手の会社についての推測（予算、悩み、社内の事情など）は書きません。</p>
        </article>

        <aside className="space-y-4">
          <section className="card" data-testid="source-panel">
            <h3 className="mb-3 flex items-center gap-2 font-bold">
              <Quote size={17} className="text-ai" />
              出典の元の文
            </h3>
            {open ? (
              <div className="rise rounded-xl border border-line bg-[#fbfcfe] p-4">
                <div className="flex items-center gap-2 text-xs text-sub">
                  <Newspaper size={14} />
                  {KIND[open.kind]}
                  <span className="text-mute">{open.date}</span>
                </div>
                <div className="mt-1 font-bold">{open.title}</div>
                <div className="mb-3 text-xs break-all text-mute">{open.url}（架空のURL）</div>
                <blockquote className="border-l-4 border-ai pl-3 text-[15px] leading-relaxed">{open.text}</blockquote>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line p-4 text-sm text-sub">左の「出典」を押すと、AIが読んだ元の文が表示されます。</p>
            )}
          </section>
          <section className="card">
            <h3 className="mb-3 flex items-center gap-2 font-bold">
              <Users size={17} className="text-ai" />
              AIが読んだ公開情報（{sources.length}件）
            </h3>
            <ol className="space-y-2 text-sm">
              {sources.map((s, i) => (
                <li key={s.id}>
                  <button className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${openId === s.id ? "border-ai bg-ai-soft" : "border-line hover:border-ai/40"}`} onClick={() => setOpenId(s.id)}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy text-xs font-bold text-white">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-bold">{KIND[s.kind]}</span>
                      <span className="block text-xs text-mute">{s.date}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-mute">デモのため、公開情報もすべて架空の文です。実在のサイトにはアクセスしていません。</p>
          </section>
        </aside>
      </div>
    </>
  );
}
