import { ArrowRight, BarChart3, Inbox, ListChecks, PenLine, Search, Send, ShieldCheck, Sparkles, Target, UserCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RoleBox } from "@/components/ui";
import { BUSINESS_IDS, COMPANIES, PLAYBOOKS, SOURCES } from "@/lib/data";
import { BUSINESS_PHOTO, PHOTOS } from "@/lib/photos";

const FLOW = [
  { no: "02", title: "狙う相手を決める", text: "事業ごとの手引きから、業種、規模、きっかけの出来事の条件を入れる", href: "/targets", icon: Target },
  { no: "02", title: "営業リスト", text: "60社を条件で採点し、理由を1行で。取引中、断られた、配信停止は自動で除外", href: "/list", icon: ListChecks },
  { no: "02", title: "下調べ", text: "会社の概要、最近の出来事、提案の切り口。すべての記述に出典", href: "/research", icon: Search },
  { no: "03", title: "連絡文の下書き", text: "メール、フォーム、DM、電話のメモ。1社ごとに3案", href: "/drafts", icon: PenLine },
  { no: "14", title: "品質チェック", text: "根拠、誇大な表現、配信停止の案内、宛先の取り違えなど8項目を自動で採点", href: "/check", icon: ShieldCheck },
  { no: "14", title: "承認待ち", text: "人が承認、修正、差し戻し。修正の理由は手引きに戻り、次の下書きに効く", href: "/approvals", icon: UserCheck },
  { no: "03", title: "送付と追いかけ", text: "承認したものだけ送付（再現）。追いかけは返信が来たら止まる", href: "/outbox", icon: Send },
  { no: "03", title: "返信の仕分け", text: "興味あり、資料、日程、お断り、配信停止などに分類し、次の行動を提案", href: "/replies", icon: Inbox },
  { no: "03", title: "効果測定", text: "返信率、前向きな返信の率、修正率、1件あたりの作成時間", href: "/metrics", icon: BarChart3 },
];
const NO_CLS: Record<string, string> = { "02": "bg-prep-soft text-prep", "03": "bg-ai-soft text-ai", "14": "bg-found-soft text-found" };

export default function Home() {
  return (
    <>
      {/* 写真の大きな見出し */}
      <section className="rise relative mb-8 overflow-hidden rounded-[28px] bg-navy text-white shadow-lift">
        <div className="absolute inset-0">
          <Image src={PHOTOS.triathlon.src} alt={PHOTOS.triathlon.alt} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />
        </div>
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-bold backdrop-blur">
              <Sparkles size={13} />
              AI社員のデモ・見本モード（APIキー不要）
            </span>
            <h1 className="mt-4 text-[23px] leading-tight font-black tracking-wide sm:text-[30px] md:text-[42px]">
              営業の準備とアプローチを、
              <br />
              AI社員に任せる。
              <br />
              <span className="bg-gradient-to-r from-[#8fb3ff] to-[#c4b2ff] bg-clip-text text-transparent">送る前は、必ず人が確かめる。</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
              アスリートのマネジメント、動画制作、SNS運用代行を行う<b className="text-white">架空の会社</b>の営業として、AI社員が「02 営業準備」と「03 アプローチ」を担当します。「14 土台」の品質チェックと承認待ちで、人が最後に確かめます。
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/targets" className="btn btn-primary px-5 py-3 text-[15px]">
                最初から試す（5分ほど）
                <ArrowRight size={16} />
              </Link>
              <Link href="/check" className="btn border-white/25 bg-white/10 px-5 py-3 text-[15px] text-white hover:bg-white/20">
                品質チェックで止まる例
              </Link>
              <Link href="/blueprint" className="btn border-white/25 bg-white/10 px-5 py-3 text-[15px] text-white hover:bg-white/20">
                AI社員の設計図
              </Link>
            </div>
          </div>
          {/* 今日のAI社員 */}
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#3b6ef0] to-[#6a4bd6] text-base font-black">AI</div>
              <div>
                <div className="font-bold">営業AI社員の仕事</div>
                <div className="text-xs text-white/65">このデモで動かせること</div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                [`${COMPANIES.length}社`, "架空の営業先"],
                [`${SOURCES.length}件`, "出典の文"],
                ["8項目", "品質チェック"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/10 px-2 py-3">
                  <dt className="text-xl font-black md:text-2xl">{v}</dt>
                  <dd className="text-[11px] text-white/65">{l}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-4 space-y-2 text-sm">
              {["条件で採点し、理由を1行で書く", "出典つきで下調べし、3案の連絡文を書く", "問題のある文は、承認待ちに回さない"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#22c55e] text-[11px] font-black text-white">✓</span>
                  {t}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-human text-[11px] font-black text-white">人</span>
                送付の前の承認は、必ず人が行う
              </li>
            </ul>
          </div>
        </div>
      </section>

      <RoleBox
        ai={["条件に合う会社の採点と、理由の説明", "出典つきの下調べと、一人ひとりに合わせた連絡文の下書き", "品質チェック、送付の予定と追いかけ、返信の仕分け、数字の集計"]}
        human={["狙う相手の最終決定", "送付の前の承認（すべての連絡文）", "返信への対応と商談。DMと電話は人が自分で行う"]}
      />

      {/* 3つの事業 */}
      <div className="mb-3 flex items-end justify-between">
        <h2 className="h2 mb-0">1体のAI社員が、3つの事業の営業を担当</h2>
        <Link href="/knowledge" className="text-sm font-bold text-ai hover:underline">
          事業ごとの手引きを見る →
        </Link>
      </div>
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {BUSINESS_IDS.map((b) => {
          const pb = PLAYBOOKS.businesses[b];
          const photo = BUSINESS_PHOTO[b];
          return (
            <Link key={b} href="/targets" className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="relative h-44">
                <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-lg font-black">{pb.name}</div>
                </div>
              </div>
              <div className="p-4 text-sm">
                <div className="text-xs font-bold text-mute">提案すること</div>
                <div className="font-medium">{pb.offer}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pb.targets.industries.slice(0, 5).map((i) => (
                    <span key={i} className="chip bg-paper text-sub">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 流れ */}
      <h2 className="h2">9つの手順（業務の番号つき）</h2>
      <ol className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((f, i) => {
          const Icon = f.icon;
          return (
            <li key={f.href}>
              <Link href={f.href} className="card group flex h-full gap-3.5 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${NO_CLS[f.no]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-mute">
                    手順 {i + 1}
                    <span className={`chip px-2 py-0 text-[10px] ${NO_CLS[f.no]}`}>業務 {f.no}</span>
                  </div>
                  <div className="font-bold group-hover:text-ai">{f.title}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-sub">{f.text}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* モードと守ること */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card overflow-hidden p-0">
          <div className="grid md:grid-cols-[200px_1fr]">
            <div className="relative h-40 md:h-auto">
              <Image src={PHOTOS.deskAi.src} alt={PHOTOS.deskAi.alt} fill sizes="200px" className="object-cover" />
            </div>
            <div className="p-5 text-sm">
              <h2 className="h2 text-base">見本モードと、本番のAIモード</h2>
              <p>
                今は<b>見本モード</b>です。主要な10社の下調べと連絡文は品質の高い完成形を用意し、それ以外の会社は、手引きのひな形と会社のデータから規則で組み立てます（「簡易作成」と表示）。
              </p>
              <p className="mt-2">
                本番では、下調べ、連絡文、返信の仕分けをAIで作り、出力は決まった形（JSON）で受け取って、<b>このデモと同じ品質チェックと出典の照合を必ず通します</b>。
              </p>
            </div>
          </div>
        </section>
        <section className="card">
          <h2 className="h2 text-base">守っていること</h2>
          <ul className="space-y-2 text-sm">
            {["営業先はすべて架空の60社。実在のサイトにはアクセスしない", "メールもフォームも、本当には送らない", "SNSのDMは下書きまで。自動では送らない（多くのSNSの規約で禁止）", "操作の記録は、このブラウザの中だけに保存"].map((t) => (
              <li key={t} className="flex gap-2.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-ok" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
