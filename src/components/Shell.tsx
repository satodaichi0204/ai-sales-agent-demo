"use client";
// 画面の枠：左のメニュー（業務の番号つきの流れ）、上の帯（モードと注意書き）
import { Activity, BarChart3, BookOpen, Bot, Inbox, ListChecks, Menu, Network, PenLine, RotateCcw, Search, Send, ShieldCheck, Target, UserCheck, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PHOTO_CREDIT } from "@/lib/photos";
import { resetState, useAppState } from "@/lib/store";

type Item = { href: string; label: string; no: string; icon: LucideIcon };
const FLOW: Item[] = [
  { href: "/targets", label: "狙う相手を決める", no: "02", icon: Target },
  { href: "/list", label: "営業リスト", no: "02", icon: ListChecks },
  { href: "/research", label: "下調べ", no: "02", icon: Search },
  { href: "/drafts", label: "連絡文の下書き", no: "03", icon: PenLine },
  { href: "/check", label: "品質チェック", no: "14", icon: ShieldCheck },
  { href: "/approvals", label: "承認待ち", no: "14", icon: UserCheck },
  { href: "/outbox", label: "送付と追いかけ", no: "03", icon: Send },
  { href: "/replies", label: "返信の仕分け", no: "03", icon: Inbox },
  { href: "/metrics", label: "効果測定", no: "03", icon: BarChart3 },
];
const MORE: Item[] = [
  { href: "/knowledge", label: "ナレッジ（社内の手引き）", no: "14", icon: BookOpen },
  { href: "/logs", label: "動作の記録と利用料", no: "14", icon: Activity },
  { href: "/blueprint", label: "AI社員の設計図", no: "全体", icon: Network },
];
const NO_CLS: Record<string, string> = { "02": "bg-prep/20 text-[#6ee7b7]", "03": "bg-ai/25 text-[#a5c4ff]", "14": "bg-found/30 text-[#c9b8ff]", 全体: "bg-white/15 text-white/80" };
export const ALL_ITEMS = [...FLOW, ...MORE];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const [state] = useAppState();
  const badge: Record<string, number> = {
    "/approvals": state.drafts.filter((d) => d.status === "pending").length,
    "/outbox": state.drafts.filter((d) => d.status === "approved").length,
  };
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  const row = (s: Item, i?: number) => {
    const Icon = s.icon;
    const on = active(s.href);
    return (
      <li key={s.href}>
        <Link
          href={s.href}
          onClick={onNavigate}
          aria-current={on ? "page" : undefined}
          className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition ${on ? "bg-white text-navy shadow-[0_8px_20px_-10px_rgb(0_0_0/0.6)]" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
        >
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${on ? "bg-ai text-white" : "bg-white/8 text-white/80 group-hover:bg-white/12"}`}>
            <Icon size={15} strokeWidth={2.2} />
          </span>
          <span className="flex-1 truncate font-medium">
            {i !== undefined && <span className={`mr-1 text-[10px] ${on ? "text-mute" : "text-white/40"}`}>{i + 1}.</span>}
            {s.label}
          </span>
          {badge[s.href] ? <span className="rounded-full bg-human px-1.5 text-[10px] font-bold text-white">{badge[s.href]}</span> : null}
          <span className={`rounded-md px-1.5 py-px text-[10px] font-bold ${on ? "bg-paper text-sub" : NO_CLS[s.no]}`}>{s.no}</span>
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="業務の流れ" className="space-y-5">
      <div>
        <div className="eyebrow mb-2 px-2.5 text-white/40">業務の流れ</div>
        <ol className="space-y-0.5">{FLOW.map((s, i) => row(s, i))}</ol>
      </div>
      <div>
        <div className="eyebrow mb-2 px-2.5 text-white/40">土台と全体</div>
        <ul className="space-y-0.5">{MORE.map((s) => row(s))}</ul>
      </div>
    </nav>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 bg-[radial-gradient(120%_60%_at_0%_0%,#1b3566_0%,#0c1626_55%)] px-3 py-5 text-white">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#5b8cff] to-[#7c5cf0] shadow-[0_8px_20px_-8px_rgb(91_140_255/0.9)]">
          <Bot size={19} />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-black tracking-wide">AI営業社員</span>
          <span className="block text-[11px] text-white/55">02 営業準備 → 03 アプローチ</span>
        </span>
      </Link>
      <div className="mx-1 rounded-2xl border border-white/10 bg-white/6 p-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#3b6ef0] to-[#6a4bd6] text-sm font-black">AI</div>
            <span className="live-dot absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#13223a] bg-[#22c55e]" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-bold">営業AI社員</div>
            <div className="truncate text-[11px] text-white/60">稼働中・見本モード</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">送付の前は、必ず人が承認します。</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Nav onNavigate={onNavigate} />
      </div>
      <div className="space-y-2 px-1">
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/8"
          onClick={() => {
            if (confirm("デモの操作をすべて消して、初期の状態に戻しますか？")) resetState();
          }}
        >
          <RotateCcw size={13} />
          初期の状態に戻す
        </button>
        <p className="px-1 text-[10px] leading-relaxed text-white/40">{PHOTO_CREDIT}</p>
      </div>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const current = ALL_ITEMS.find((s) => path === s.href || path.startsWith(`${s.href}/`));
  return (
    <div className="min-h-screen lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="メニュー">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw]">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-navy" onClick={() => setOpen(false)} aria-label="メニューを閉じる">
            <X size={18} />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-2.5 md:px-8">
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden" onClick={() => setOpen(true)} aria-label="メニューを開く">
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1 truncate text-sm text-sub">
            {current ? (
              <>
                <span className="font-bold text-ink">{current.label}</span>
                <span className="ml-2 text-xs text-mute">業務 {current.no}</span>
              </>
            ) : (
              <span className="font-bold text-ink">ホーム</span>
            )}
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#fff6dd] px-3 py-1 text-xs font-medium text-[#7a5600] md:inline-flex">架空のデータ・実際には送信しません</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-soft px-3 py-1 text-xs font-bold text-ai" data-testid="mode" title="APIキーがなくても、すべての機能が動きます">
            見本モード（APIキー不要）
          </span>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden"
            aria-label="初期の状態に戻す"
            onClick={() => {
              if (confirm("デモの操作をすべて消して、初期の状態に戻しますか？")) resetState();
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      <footer className="mx-auto max-w-[1240px] px-4 pb-8 text-xs text-mute md:px-8">
        AI営業社員のデモ（見本モード）。会社、人物、出来事、実績の数字はすべて架空です。実在のサイトにはアクセスしていません。人物の写真は場面のイメージです。{PHOTO_CREDIT}
      </footer>
    </div>
  );
}
