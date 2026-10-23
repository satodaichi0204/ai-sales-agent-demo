"use client";
// 品質チェックの結果：点数、8項目、問題の箇所に印を付けた本文
import { CircleCheck, CircleMinus, OctagonX, TriangleAlert } from "lucide-react";
import { sourcesOf } from "@/lib/data";
import { CHECKS, type CheckResult } from "@/lib/quality";
import { ScoreRing } from "./ui";

const MARK: Record<string, { text: string; cls: string; icon: typeof CircleCheck }> = {
  ok: { text: "OK", cls: "text-ok", icon: CircleCheck },
  warn: { text: "注意", cls: "text-warn", icon: TriangleAlert },
  stop: { text: "止める", cls: "text-human", icon: OctagonX },
  na: { text: "対象外", cls: "text-mute", icon: CircleMinus },
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
    <div className="rounded-2xl border border-line bg-white p-4 text-sm leading-7 whitespace-pre-wrap shadow-card" data-testid="highlighted">
      {parts.map((p, i) =>
        p.kind === "flag" ? (
          <mark key={i} className="flag">
            {p.t}
          </mark>
        ) : p.kind === "good" ? (
          <mark key={i} className="good" title="出典と結び付いた記述">
            {p.t}
            <sup className="ml-0.5 rounded bg-ai px-1 text-[9px] font-bold text-white">出典{n(p.sid!)}</sup>
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
    <section className={`overflow-hidden rounded-2xl border bg-white shadow-card ${result.pass ? "border-ok/25" : "border-human/30"}`} data-testid="check-panel" data-pass={result.pass}>
      <div className={`flex items-center gap-4 p-4 ${result.pass ? "bg-gradient-to-r from-ok-soft to-white" : "bg-gradient-to-r from-human-soft to-white"}`}>
        <ScoreRing score={result.score} pass={result.pass} />
        <div>
          <div className="eyebrow">品質チェック（自動・8項目）</div>
          <div className={`text-lg font-black ${result.pass ? "text-ok" : "text-human"}`} data-testid="check-verdict">
            {result.pass ? "承認待ちに回せます" : `止める項目が${stops.length}件あります`}
          </div>
          <div className="text-xs text-sub">{warns.length > 0 ? `注意 ${warns.length}件（止めはしません）` : "100点から、止める項目1つで20点、注意1つで5点を引きます"}</div>
        </div>
      </div>
      {!compact && (
        <ul className="grid grid-cols-2 gap-px border-t border-line bg-line text-[13px]">
          {CHECKS.map((c) => {
            const m = MARK[result.status[c.id]];
            const Icon = m.icon;
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 bg-white px-4 py-2" title={c.detail}>
                <span className="truncate">{c.label}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${m.cls}`}>
                  <Icon size={14} />
                  {m.text}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {result.issues.length > 0 && (
        <ul className="space-y-2 border-t border-line p-4 text-sm" data-testid="issues">
          {result.issues.map((i, k) => (
            <li key={k} className={`flex gap-2 rounded-xl px-3 py-2 ${i.severity === "stop" ? "bg-human-soft" : "bg-warn-soft"}`}>
              {i.severity === "stop" ? <OctagonX size={16} className="mt-0.5 shrink-0 text-human" /> : <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" />}
              <span>
                <span className="mr-1 text-xs font-bold">
                  {i.severity === "stop" ? "止める" : "注意"}｜{CHECKS.find((c) => c.id === i.check)?.label}
                </span>
                {i.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
