import Link from "next/link";
import { RoleBox } from "@/components/ui";

const FLOW = [
  { no: "02", title: "狙う相手を決める", text: "事業ごとの手引きから、業種、規模、きっかけの出来事の条件を入れる", href: "/targets" },
  { no: "02", title: "営業リスト", text: "60社を条件で採点し、理由を1行で。取引中、断られた、配信停止は自動で除外", href: "/list" },
  { no: "02", title: "下調べ", text: "会社の概要、最近の出来事、提案の切り口。すべての記述に出典", href: "/research" },
  { no: "03", title: "連絡文の下書き", text: "メール、フォーム、DM、電話のメモ。1社ごとに3案", href: "/drafts" },
  { no: "14", title: "品質チェック", text: "根拠、誇大な表現、配信停止の案内、宛先の取り違えなど8項目を自動で採点", href: "/check" },
  { no: "14", title: "承認待ち", text: "人が承認、修正、差し戻し。修正の理由は手引きに戻り、次の下書きに効く", href: "/approvals" },
  { no: "03", title: "送付と追いかけ", text: "承認したものだけ送付（再現）。追いかけは返信が来たら止まる", href: "/outbox" },
  { no: "03", title: "返信の仕分け", text: "興味あり、資料、日程、お断り、配信停止などに分類し、次の行動を提案", href: "/replies" },
  { no: "03", title: "効果測定", text: "返信率、前向きな返信の率、修正率、1件あたりの作成時間", href: "/metrics" },
];
const COLOR: Record<string, string> = { "02": "border-t-[#2f6f4f]", "03": "border-t-ai", "14": "border-t-[#6b4a9b]" };
const NO: Record<string, string> = { "02": "bg-[#2f6f4f]", "03": "bg-ai", "14": "bg-[#6b4a9b]" };

export default function Home() {
  return (
    <>
      <section className="card mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">AI営業社員のデモ</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 md:text-base">
          アスリートのマネジメント、動画制作、SNS運用代行を行う<b>架空の会社</b>の営業として、
          <b>「02 営業準備」</b>と<b>「03 アプローチ」</b>をAI社員が担当し、<b>「14 土台」</b>の品質チェックと承認待ちで、人が最後に確かめる流れを、実際に動く形にしました。
          すべての画面の上に、<span className="font-bold text-ai">AIがすること</span>と<span className="font-bold text-human">人が確認すること</span>を表示しています。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/targets" className="btn btn-primary">
            最初から試す（5分ほど）
          </Link>
          <Link href="/check" className="btn">
            品質チェックで止まる例を見る
          </Link>
          <Link href="/blueprint" className="btn">
            AI社員の設計図を見る
          </Link>
        </div>
      </section>

      <RoleBox
        ai={["条件に合う会社の採点と、理由の説明", "出典つきの下調べと、一人ひとりに合わせた連絡文の下書き", "品質チェック、送付の予定と追いかけ、返信の仕分け、数字の集計"]}
        human={["狙う相手の最終決定", "送付の前の承認（すべての連絡文）", "返信への対応と商談。DMと電話は人が自分で行う"]}
      />

      <h2 className="h2">流れ</h2>
      <ol className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((f, i) => (
          <li key={f.href}>
            <Link href={f.href} className={`card block h-full border-t-4 ${COLOR[f.no]} transition hover:shadow-md`}>
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className={`chip ${NO[f.no]} text-white`}>業務 {f.no}</span>
                <span className="text-sub">手順 {i + 1}</span>
              </div>
              <div className="font-bold">{f.title}</div>
              <p className="mt-1 text-sm text-sub">{f.text}</p>
            </Link>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="card">
          <h2 className="h2">見本モード（今のモード）</h2>
          <p className="text-sm">
            APIキーがなくても、すべての機能が動きます。主要な10社の下調べと連絡文は、品質の高い完成形を用意し、それ以外の会社は、手引きのひな形と会社のデータから規則で組み立てます（「簡易作成」と表示）。
          </p>
        </section>
        <section className="card">
          <h2 className="h2">本番ではAIで作成</h2>
          <p className="text-sm">
            本番では、下調べ、連絡文、返信の仕分けをAIで作ります。出力は決まった形（JSON）で受け取り、<b>このデモと同じ品質チェックと出典の照合を必ず通します</b>。形が崩れたときや、出典のない記述があったときは止めます。
          </p>
        </section>
        <section className="card">
          <h2 className="h2">守っていること</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>営業先はすべて架空の60社。実在のサイトにはアクセスしない</li>
            <li>メールもフォームも、本当には送らない</li>
            <li>SNSのDMは下書きまで。自動では送らない（多くのSNSの規約で禁止）</li>
            <li>操作の記録は、このブラウザの中だけに保存</li>
          </ul>
        </section>
      </div>
    </>
  );
}
