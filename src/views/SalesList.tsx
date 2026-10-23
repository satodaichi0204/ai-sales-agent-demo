"use client";
// S2 営業リスト（02 営業準備）。採点と理由。除外リストと重複は自動で外す。最終決定は人
import { Ban, Building2, CheckCircle2, Mail, MessageCircle, MousePointerClick, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, RoleBox, Stat, Thumb } from "@/components/ui";
import { COMPANIES, PLAYBOOKS, SAMPLES, SIZE_LABEL } from "@/lib/data";
import { industryPhoto, PHOTOS } from "@/lib/photos";
import { rankCompanies, recommended } from "@/lib/scoring";
import { useAppState } from "@/lib/store";
import { conditionsOf, confirmList } from "@/lib/state";

const CH_ICON = { email: Mail, form: MousePointerClick, sns: MessageCircle };
const CH_LABEL = { email: "メール", form: "フォーム", sns: "SNS" };

function ScoreBar({ score, parts }: { score: number; parts: { industry: number; events: number; size: number; region: number } }) {
  const seg = [
    ["業種", parts.industry, "#2a5bd7"],
    ["出来事", parts.events, "#13865b"],
    ["規模", parts.size, "#eda100"],
    ["地域", parts.region, "#6a4bd6"],
  ] as const;
  return (
    <div className="w-28" title={seg.map(([l, v]) => `${l} ${v}`).join("／")}>
      <div className={`text-lg leading-none font-black tabular-nums ${score >= 70 ? "text-ai" : score >= 50 ? "text-ink" : "text-mute"}`}>
        {score}
        <span className="ml-0.5 text-[10px] font-medium text-mute">点</span>
      </div>
      <div className="mt-1.5 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-paper">
        {seg.map(([l, v, c]) => (v > 0 ? <span key={l} style={{ width: `${v}%`, background: c }} /> : null))}
      </div>
    </div>
  );
}

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
      <PageHeader no="02" title="営業リスト" lead={`「${PLAYBOOKS.businesses[b].name}」の条件で、架空の会社${COMPANIES.length}社を採点しました。AIのおすすめ（70点以上の上位10社）に印を付けています。リストに入れるかは人が決めます。`} photo={PHOTOS.stadium}>
        <Link href="/targets" className="btn">
          ← 条件を変える
        </Link>
      </PageHeader>
      <RoleBox
        ai={["条件に合う順に採点し、理由を1行で書く", "取引中、過去に断られた、配信停止、重複の会社を自動で外す", "おすすめの会社に印を付ける"]}
        human={["リストに入れる会社と外す会社を決める（確定は人のボタンで）", "外された理由に誤りがないか確かめる"]}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="採点した会社" value={`${ranked.length}社`} note={`全${COMPANIES.length}社から除外を引いた数`} icon={<Building2 size={16} />} />
        <Stat label="AIのおすすめ" value={`${rec.length}社`} note="70点以上の上位10社まで" icon={<Sparkles size={16} />} />
        <Stat label="選んでいる会社" value={`${sel.length}社`} note={saved && !dirty ? "確定済み" : "まだ確定していません"} icon={<CheckCircle2 size={16} />} />
        <Stat label="自動で除外" value={`${excluded.length}社`} note="取引中・断られた・配信停止・重複" icon={<Ban size={16} />} />
      </div>

      <div className="sticky top-[60px] z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-3 pl-4 shadow-card backdrop-blur">
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

      <div className="card mb-8 overflow-x-auto p-0">
        <table className="tbl min-w-[920px]" data-testid="ranked">
          <thead>
            <tr>
              <th className="w-12">入れる</th>
              <th className="w-10">順位</th>
              <th>会社</th>
              <th className="w-32">点数</th>
              <th>採点の理由（AI）</th>
              <th className="w-28">連絡の手段</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => {
              const on = sel.includes(r.company.id);
              return (
                <tr key={r.company.id} data-id={r.company.id} className={`transition ${on ? "bg-ai-soft/45" : "hover:bg-paper/60"}`}>
                  <td className="pt-5">
                    <input type="checkbox" className="h-[18px] w-[18px] accent-[#2a5bd7]" checked={on} onChange={() => toggle(r.company.id)} aria-label={`${r.company.name}をリストに入れる`} />
                  </td>
                  <td className="pt-5 font-bold text-mute tabular-nums">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Thumb photo={industryPhoto(r.company.industry)} size={48} />
                      <div>
                        <div className="font-bold">{r.company.name}</div>
                        <div className="text-xs text-sub">
                          {r.company.industry}・{SIZE_LABEL[r.company.size]}・{r.company.region}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rec.includes(r.company.id) && (
                            <span className="chip bg-ai text-white">
                              <Sparkles size={11} />
                              AIのおすすめ
                            </span>
                          )}
                          {SAMPLES[r.company.id]?.business === b && <span className="chip bg-prep-soft text-prep">下調べの見本あり</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="pt-4">
                    <ScoreBar score={r.score} parts={r.parts} />
                  </td>
                  <td className="pt-4 text-[13px] leading-relaxed">{r.reason}</td>
                  <td className="pt-4">
                    <div className="flex flex-wrap gap-1">
                      {r.company.channels.map((c) => {
                        const Icon = CH_ICON[c];
                        return (
                          <span key={c} className="chip bg-paper px-2 text-sub" title={CH_LABEL[c]}>
                            <Icon size={11} />
                            {CH_LABEL[c]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="pt-4">
                    <Link href={`/research?c=${r.company.id}`} className="text-sm font-bold text-ai hover:underline">
                      下調べ →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="h2">
        <Ban size={18} className="text-human" />
        自動で外した会社（{excluded.length}社）
      </h2>
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
                <td>
                  <div className="flex items-center gap-3">
                    <Thumb photo={industryPhoto(e.company.industry)} size={36} className="opacity-70 grayscale" />
                    <span>{e.company.name}</span>
                  </div>
                </td>
                <td className="align-middle">
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
