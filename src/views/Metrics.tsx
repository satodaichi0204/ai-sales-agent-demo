"use client";
// S9 効果測定（03 アプローチ）。最初の1か月のKPIの実物
import { PageHeader, RoleBox } from "@/components/ui";
import { CHANNEL_LABEL, PLAYBOOKS, type BusinessId, type Channel } from "@/lib/data";
import type { Variant } from "@/lib/generate";

const VARIANT_SHORT: Record<Variant, string> = { A: "A：出来事から", B: "B：強みから", C: "C：短く" };
import { fmtSec, type Rate } from "@/lib/metrics";
import { useAppState } from "@/lib/store";
import { metricsOf } from "@/lib/state";

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-bold text-sub">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-sub">{note}</div>
    </div>
  );
}

function Compare({ title, rows, label }: { title: string; rows: Record<string, Rate>; label: (k: string) => string }) {
  const max = Math.max(1, ...Object.values(rows).map((r) => r.replyRate));
  return (
    <section className="card">
      <h3 className="mb-2 font-bold">{title}</h3>
      <table className="tbl">
        <thead>
          <tr>
            <th>区分</th>
            <th className="text-right">送付</th>
            <th className="text-right">返信</th>
            <th className="w-[40%]">返信率</th>
            <th className="text-right">前向き</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(rows).map(([k, r]) => (
            <tr key={k}>
              <td className="text-sm whitespace-nowrap">{label(k)}</td>
              <td className="text-right tabular-nums">{r.sends}</td>
              <td className="text-right tabular-nums">{r.replies}</td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 rounded-full bg-paper">
                    <div className="h-2.5 rounded-full bg-ai" style={{ width: `${(r.replyRate / max) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs tabular-nums">{r.replyRate}%</span>
                </div>
              </td>
              <td className="text-right text-xs tabular-nums">{r.positiveRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Metrics() {
  const [state] = useAppState();
  const m = metricsOf(state);
  const demoSends = state.sends.length;

  return (
    <>
      <PageHeader no="03" title="効果測定" lead="最初の1か月の成功を判断する数字です。土台は過去2週間の架空の記録（48件）で、デモで送ったものと、受け取った返信が加わると数字が変わります。" />
      <RoleBox
        ai={["送付、返信、承認の記録から、数字を毎日集計する", "事業、手段、文面の案ごとに比べる"]}
        human={["数字を見て、狙う相手の条件、手引き、文面の案を見直す（週1回）", "修正率が高い部分の手引きを直す"]}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="kpis">
        <Tile label="送付数" value={`${m.sends}件`} note={`うちデモで送った ${demoSends}件`} />
        <Tile label="返信率" value={`${m.replyRate}%`} note={`返信 ${m.replies}件`} />
        <Tile label="前向きな返信の率" value={`${m.positiveRate}%`} note="興味あり、資料、日程の調整" />
        <Tile label="承認のときの修正率" value={`${m.editRate}%`} note="人が直した、または差し戻した割合" />
        <Tile label="1件あたりの作成時間" value={fmtSec(m.totalSec)} note={`AIのみ ${fmtSec(m.aiSec)}／人の確認込み`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Compare title="事業ごと" rows={m.by.business} label={(k) => PLAYBOOKS.businesses[k as BusinessId].short} />
        <Compare title="手段ごと" rows={m.by.channel} label={(k) => CHANNEL_LABEL[k as Channel]} />
        <Compare title="文面の案ごと" rows={m.by.variant} label={(k) => VARIANT_SHORT[k as Variant]} />
      </div>
      <section className="card mt-6 text-sm">
        <h2 className="h2">最初の1か月の目安（KPIの定義）</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>返信率と前向きな返信の率：送付数に対する割合。文面の案ごとに比べ、良い案を手引きのひな形に戻す</li>
          <li>承認のときの修正率：1か月で下がっていけば、手引きが育っている証拠（目安：最初の週から半分に）</li>
          <li>1件あたりの作成時間：人が下調べから書く場合と比べる（人の確認込みで、1件5分以内が目安）</li>
          <li>品質チェックで止まった件数と理由：ルールの追加が必要な場所を見つける</li>
        </ul>
        <p className="mt-2 text-xs text-sub">見本モードのため、AIのみの時間は、過去の記録（架空）の値が中心です。デモでの人の確認の時間は、承認の画面を開いてから判断するまでを実際に測っています。</p>
      </section>
    </>
  );
}
