"use client";
// 品質チェックの結果：点数、8項目、問題の箇所に印を付けた本文
import { sourcesOf } from "@/lib/data";
import { CHECKS, type CheckResult } from "@/lib/quality";
import { ScoreRing } from "./ui";

const MARK: Record<string, { text: string; cls: string }> = {
  ok: { text: "OK", cls: "bg-ok-soft text-ok" },
  warn: { text: "注意", cls: "bg-warn-soft text-warn" },
  stop: { text: "止める", cls: "bg-human text-white" },
  na: { text: "対象外", cls: "bg-paper text-off" },
};

/** 問題の箇所（と、出典と結び付いた文）に印を付けて表示する */
export function Highlighted({ text, result, companyId }: { text: string; result: CheckResult; companyId: string }) {
  const flags = result.issues.filter((i) => i.match && i.severity === "stop").map((i) => i.match!);
  const goods = result.grounded.filter((g) => g.sourceId).map((g) => g.sentence);
  const n = (sid: string) => sourcesOf(companyId).findIndex((s) => s.id === sid) + 1;
  type Part = { t: string; kind?: "flag" | "good"; sid?: string };
  let parts: Part[] = [{ t: text }];
  const split = (needle: string, kind: "flag" | "good", sid?: string) => {
    parts = parts.flatMap((p) => {
      if (p.kind || !needle || !p.t.includes(needle)) return [p];
      const out: Part[] = [];
      p.t.split(needle).forEach((seg, i, arr) => {
        if (seg) out.push({ t: seg });
        if (i < arr.length - 1) out.push({ t: needle, kind, sid });
      });
      return out;
    });
  };
  [...flags].sort((a, b) => b.length - a.length).forEach((f) => split(f, "flag"));
  goods.forEach((g) => split(g, "good", result.grounded.find((x) => x.sentence === g)?.sourceId ?? undefined));
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-sm leading-7 whitespace-pre-wrap" data-testid="highlighted">
      {parts.map((p, i) =>
        p.kind === "flag" ? (
          <mark key={i} className="flag">
            {p.t}
          </mark>
        ) : p.kind === "good" ? (
          <mark key={i} className="good" title="出典と結び付いた記述">
            {p.t}
            <sup className="ml-0.5 font-bold text-ai">出典{n(p.sid!)}</sup>
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </div>
  );
}

export default function CheckPanel({ result, compact = false }: { result: CheckResult; compact?: boolean }) {
  const stops = result.issues.filter((i) => i.severity === "stop");
  const warns = result.issues.filter((i) => i.severity === "warn");
  return (
    <section className="rounded-xl border border-line bg-white p-4" data-testid="check-panel" data-pass={result.pass}>
      <div className="mb-3 flex items-center gap-3">
        <ScoreRing score={result.score} pass={result.pass} />
        <div>
          <div className="text-xs text-sub">品質チェック（自動）</div>
          <div className={`font-bold ${result.pass ? "text-ok" : "text-human"}`} data-testid="check-verdict">
            {result.pass ? "承認待ちに回せます" : `止める項目が${stops.length}件あります`}
          </div>
          {warns.length > 0 && <div className="text-xs text-warn">注意 {warns.length}件</div>}
        </div>
      </div>
      {!compact && (
        <ul className="mb-3 grid grid-cols-2 gap-1 text-xs">
          {CHECKS.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-1 rounded bg-paper px-2 py-1" title={c.detail}>
              <span>{c.label}</span>
              <span className={`chip px-1.5 ${MARK[result.status[c.id]].cls}`}>{MARK[result.status[c.id]].text}</span>
            </li>
          ))}
        </ul>
      )}
      {result.issues.length > 0 && (
        <ul className="space-y-1.5 text-sm" data-testid="issues">
          {result.issues.map((i, k) => (
            <li key={k} className={`rounded-lg border-l-4 px-2.5 py-1.5 ${i.severity === "stop" ? "border-human bg-human-soft" : "border-warn bg-warn-soft"}`}>
              <span className="mr-1 text-xs font-bold">{i.severity === "stop" ? "止める" : "注意"}｜{CHECKS.find((c) => c.id === i.check)?.label}</span>
              {i.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
