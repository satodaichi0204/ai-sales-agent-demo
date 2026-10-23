"use client";
// 画面の上の部分：デモの表示、モード、業務の番号つきの流れ
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resetState, useAppState } from "@/lib/store";

type Step = { href: string; label: string; no: string };
const FLOW: Step[] = [
  { href: "/targets", label: "狙う相手", no: "02" },
  { href: "/list", label: "営業リスト", no: "02" },
  { href: "/research", label: "下調べ", no: "02" },
  { href: "/drafts", label: "連絡文の下書き", no: "03" },
  { href: "/check", label: "品質チェック", no: "14" },
  { href: "/approvals", label: "承認待ち", no: "14" },
  { href: "/outbox", label: "送付と追いかけ", no: "03" },
  { href: "/replies", label: "返信の仕分け", no: "03" },
  { href: "/metrics", label: "効果測定", no: "03" },
];
const MORE: Step[] = [
  { href: "/knowledge", label: "ナレッジ（社内の手引き）", no: "14" },
  { href: "/blueprint", label: "AI社員の設計図", no: "全体" },
  { href: "/logs", label: "動作の記録と利用料", no: "14" },
];
const NO_COLOR: Record<string, string> = { "02": "text-[#2f6f4f] border-[#2f6f4f]", "03": "text-ai border-ai", "14": "text-[#6b4a9b] border-[#6b4a9b]", 全体: "text-navy border-navy" };

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state] = useAppState();
  const pending = state.drafts.filter((d) => d.status === "pending").length;
  const approved = state.drafts.filter((d) => d.status === "approved").length;
  const badge: Record<string, number> = { "/approvals": pending, "/outbox": approved };
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      <div className="bg-[#fff4d6] px-4 py-1.5 text-center text-xs text-[#6b4b00]">
        デモ版：会社、人、出来事はすべて架空です。メール、フォーム、DMは実際には送信しません。
      </div>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-sm text-navy">AI</span>
            <span>
              AI営業社員<span className="ml-2 text-xs font-normal text-white/70">02 営業準備 → 03 アプローチ</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="chip bg-white/15 text-white" title="APIキーがなくても、すべての機能が動きます" data-testid="mode">
              見本モード（APIキー不要）
            </span>
            <button
              className="rounded-lg border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
              onClick={() => {
                if (confirm("デモの操作をすべて消して、初期の状態に戻しますか？")) resetState();
              }}
            >
              初期の状態に戻す
            </button>
          </div>
        </div>
        <nav className="border-t border-white/10 bg-[#16222f]" aria-label="業務の流れ">
          <ol className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-xs">
            {FLOW.map((s, i) => (
              <li key={s.href} className="flex shrink-0 items-center gap-1">
                {i > 0 && <span className="text-white/30">→</span>}
                <Link
                  href={s.href}
                  aria-current={active(s.href) ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${active(s.href) ? "bg-white text-navy" : "text-white/85 hover:bg-white/10"}`}
                >
                  <span className={`rounded border px-1 text-[10px] font-bold ${active(s.href) ? NO_COLOR[s.no] : "border-white/40 text-white/70"}`}>{s.no}</span>
                  {s.label}
                  {badge[s.href] ? <span className="rounded-full bg-human px-1.5 text-[10px] font-bold text-white">{badge[s.href]}</span> : null}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5 text-xs">
          {MORE.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 ${active(s.href) ? "bg-navy text-white" : "text-sub hover:bg-paper"}`}
            >
              <span className={`rounded border px-1 text-[10px] font-bold ${active(s.href) ? "border-white/60 text-white" : NO_COLOR[s.no]}`}>{s.no}</span>
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-line bg-white px-4 py-4 text-center text-xs text-sub">
        AI営業社員のデモ（見本モード）。会社、人物、出来事、実績の数字はすべて架空です。実在のサイトにはアクセスしていません。
      </footer>
    </>
  );
}
