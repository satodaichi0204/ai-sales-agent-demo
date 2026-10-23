"use client";
// S2 営業リスト（02 営業準備）。採点と理由。除外リストと重複は自動で外す。最終決定は人
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, COMPANIES, PLAYBOOKS, SAMPLES, SIZE_LABEL } from "@/lib/data";
import { useAppState } from "@/lib/store";
import { conditionsOf, confirmList } from "@/lib/state";
import { rankCompanies, recommended } from "@/lib/scoring";

export default function SalesList() {
  const [state, update] = useAppState();
  const b = state.business;
  const { ranked, excluded } = useMemo(() => rankCompanies(COMPANIES, conditionsOf(state, b), state.exclusions, new Date()), [state, b]);
  const rec = useMemo(() => recommended(ranked), [ranked]);
  const saved = state.lists[b];
  const [picked, setPicked] = useState<string[] | null>(null);
  const sel = picked ?? saved ?? rec;
  const toggle = (id: string) => setPicked(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const dirty = picked !== null && JSON.stringify([...picked].sort()) !== JSON.stringify([...(saved ?? [])].sort());

  return (
    <>
      <PageHeader no="02" title="営業リスト" lead={`「${PLAYBOOKS.businesses[b].name}」の条件で、架空の会社${COMPANIES.length}社を採点しました。AIのおすすめ（70点以上の上位10社）に印を付けています。リストに入れるかは人が決めます。`}>
        <Link href="/targets" className="btn">
          ← 条件を変える
        </Link>
      </PageHeader>
      <RoleBox
        ai={["条件に合う順に採点し、理由を1行で書く", "取引中、過去に断られた、配信停止、重複の会社を自動で外す", "おすすめの会社に印を付ける"]}
        human={["リストに入れる会社と外す会社を決める（確定は人のボタンで）", "外された理由に誤りがないか確かめる"]}
      />

      <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/95 p-3 backdrop-blur">
        <div className="text-sm">
          <b>{sel.length}社</b>を選んでいます
          {saved && !dirty && <span className="chip ml-2 bg-ok-soft text-ok">確定済み</span>}
          {dirty && <span className="chip ml-2 bg-warn-soft text-warn">未確定の変更あり</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setPicked(rec)}>
            AIのおすすめに戻す
          </button>
          <button
            className="btn btn-primary"
            disabled={sel.length === 0 || (!!saved && !dirty)}
            onClick={() => {
              update((s) => confirmList(s, b, sel, new Date()));
              setPicked(null);
            }}
          >
            この{sel.length}社でリストを確定する
          </button>
        </div>
      </div>

      <div className="card mb-6 overflow-x-auto p-0">
        <table className="tbl min-w-[860px]" data-testid="ranked">
          <thead>
            <tr>
              <th className="w-10">入れる</th>
              <th className="w-12">順位</th>
              <th>会社</th>
              <th className="w-16">点数</th>
              <th>採点の理由</th>
              <th className="w-36">連絡の手段</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => {
              const on = sel.includes(r.company.id);
              return (
                <tr key={r.company.id} data-id={r.company.id} className={on ? "bg-ai-soft/50" : ""}>
                  <td>
                    <input type="checkbox" className="h-4 w-4 accent-[#2459a6]" checked={on} onChange={() => toggle(r.company.id)} aria-label={`${r.company.name}をリストに入れる`} />
                  </td>
                  <td className="text-sub">{i + 1}</td>
                  <td>
                    <div className="font-bold">{r.company.name}</div>
                    <div className="text-xs text-sub">
                      {r.company.industry}・{SIZE_LABEL[r.company.size]}・{r.company.region}
                      {rec.includes(r.company.id) && <span className="chip ml-1.5 bg-ai text-white">AIのおすすめ</span>}
                      {SAMPLES[r.company.id]?.business === b && <span className="chip ml-1.5 bg-paper text-sub">下調べの見本あり</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`text-lg font-bold ${r.score >= 70 ? "text-ai" : r.score >= 50 ? "text-ink" : "text-off"}`}>{r.score}</span>
                    <div className="text-[10px] leading-tight text-sub" title="業種／出来事／規模／地域">
                      {r.parts.industry}/{r.parts.events}/{r.parts.size}/{r.parts.region}
                    </div>
                  </td>
                  <td className="text-sm">{r.reason}</td>
                  <td className="text-xs text-sub">{r.company.channels.map((c) => (c === "sns" ? "SNS" : CHANNEL_LABEL[c])).join("、")}</td>
                  <td>
                    <Link href={`/research?c=${r.company.id}`} className="text-sm text-ai underline">
                      下調べ
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="h2">自動で外した会社（{excluded.length}社）</h2>
      <div className="card overflow-x-auto p-0">
        <table className="tbl" data-testid="excluded">
          <thead>
            <tr>
              <th>会社</th>
              <th>外した理由</th>
            </tr>
          </thead>
          <tbody>
            {excluded.map((e) => (
              <tr key={e.company.id} data-id={e.company.id}>
                <td>{e.company.name}</td>
                <td>
                  <span className="chip bg-human-soft text-human">{e.reason}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
