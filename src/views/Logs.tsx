"use client";
// S12 動作の記録と利用料（14 土台）。AIの呼び出しの記録と、1日の利用料の上限
import { PageHeader, RoleBox } from "@/components/ui";
import { useAppState } from "@/lib/store";

export default function Logs() {
  const [state, update] = useAppState();
  const today = new Date().toDateString();
  const yenToday = state.logs.filter((l) => new Date(l.at).toDateString() === today).reduce((a, l) => a + l.yen, 0);

  return (
    <>
      <PageHeader no="14" title="動作の記録と利用料" lead="AI社員が、いつ、どの処理を、どれだけの時間と量で行ったかを記録します。本番では、1日の利用料が上限に近づくと止めて知らせます。" />
      <RoleBox
        ai={["すべての処理を記録する（時間、使った量、推定の費用）", "1日の利用料が上限を超えそうなら、処理を止めて知らせる"]}
        human={["上限の金額を決める", "おかしな動き（急な増加、失敗の続き）がないか、週1回見る"]}
      />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="card">
          <div className="text-xs font-bold text-sub">今日の利用料</div>
          <div className="text-3xl font-bold">{yenToday}円</div>
          <div className="text-xs text-sub">見本モードのため、AIの利用料は0円です</div>
        </div>
        <label className="card block">
          <span className="text-xs font-bold text-sub">1日の利用料の上限</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="number" min={0} className="field w-32" value={state.settings.costCapYen} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, costCapYen: Math.max(0, Number(e.target.value) || 0) } }))} />
            <span>円</span>
          </div>
        </label>
        <div className="card">
          <div className="text-xs font-bold text-sub">記録の件数</div>
          <div className="text-3xl font-bold">{state.logs.length}件</div>
        </div>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="tbl min-w-[720px]">
          <thead>
            <tr>
              <th>時刻</th>
              <th>処理</th>
              <th>内容</th>
              <th className="text-right">時間</th>
              <th className="text-right">使った量</th>
              <th className="text-right">推定の費用</th>
            </tr>
          </thead>
          <tbody>
            {state.logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sub">
                  まだ記録はありません。
                </td>
              </tr>
            ) : (
              state.logs.map((l, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">{new Date(l.at).toLocaleString("ja-JP")}</td>
                  <td className="whitespace-nowrap">{l.action}</td>
                  <td>{l.detail}</td>
                  <td className="text-right tabular-nums">{l.ms ? `${l.ms}ms` : "-"}</td>
                  <td className="text-right tabular-nums">{l.tokens}</td>
                  <td className="text-right tabular-nums">{l.yen}円</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
