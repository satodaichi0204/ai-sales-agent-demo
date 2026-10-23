// 画面の共通の部品
import type { ReactNode } from "react";

const STAGE_COLOR: Record<string, string> = { "02": "bg-[#2f6f4f]", "03": "bg-ai", "14": "bg-[#6b4a9b]", 全体: "bg-navy" };

export function StageBadge({ no }: { no: string }) {
  return <span className={`chip ${STAGE_COLOR[no] ?? "bg-navy"} text-white`}>{no === "全体" ? "全体" : `業務 ${no}`}</span>;
}

export function PageHeader({ no, title, lead, children }: { no: string; title: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <StageBadge no={no} />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-sub">{lead}</p>
      </div>
      {children}
    </div>
  );
}

/** すべての画面に出す「AIがすること」と「人が確認すること」の2つの枠（Q2への答え） */
export function RoleBox({ ai, human }: { ai: string[]; human: string[] }) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2" data-testid="rolebox">
      <section className="rounded-xl border border-ai/30 bg-ai-soft p-4">
        <h2 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ai">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ai text-xs text-white">AI</span>AIがすること
        </h2>
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {ai.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-human/30 bg-human-soft p-4">
        <h2 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-human">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-human text-xs text-white">人</span>人が確認すること
        </h2>
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {human.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card text-center text-sm text-sub">{children}</div>;
}

export function ScoreRing({ score, pass }: { score: number; pass: boolean }) {
  return (
    <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 ${pass ? "border-ok text-ok" : "border-human text-human"}`}>
      <span className="text-xl leading-none font-bold">{score}</span>
      <span className="text-[10px] leading-none">点</span>
    </div>
  );
}
