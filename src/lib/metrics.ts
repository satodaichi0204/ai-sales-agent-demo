// 03 アプローチ：効果測定（最初の1か月のKPIの実物）
import type { BusinessId, Channel, ReplyCategory } from "./data";
import { POSITIVE } from "./replies";

export type SendRecord = { id: string; companyId: string; business: BusinessId; channel: Channel; variant: "A" | "B" | "C"; edited: boolean; aiSec: number; humanSec: number; demo: boolean };
export type ReplyRecord = { replyId: string; sendId: string; category: ReplyCategory };
export type Rate = { sends: number; replies: number; positive: number; replyRate: number; positiveRate: number };
export type Metrics = Rate & { editRate: number; aiSec: number; totalSec: number; by: { business: Record<string, Rate>; channel: Record<string, Rate>; variant: Record<string, Rate> } };

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

function rate(sends: SendRecord[], replies: ReplyRecord[]): Rate {
  const ids = new Set(sends.map((s) => s.id));
  const rs = replies.filter((r) => ids.has(r.sendId));
  const positive = rs.filter((r) => POSITIVE.includes(r.category)).length;
  return { sends: sends.length, replies: rs.length, positive, replyRate: pct(rs.length, sends.length), positiveRate: pct(positive, sends.length) };
}
function groupBy(sends: SendRecord[], replies: ReplyRecord[], key: "business" | "channel" | "variant"): Record<string, Rate> {
  const out: Record<string, Rate> = {};
  for (const k of [...new Set(sends.map((s) => s[key]))].sort()) out[k] = rate(sends.filter((s) => s[key] === k), replies);
  return out;
}

export function computeMetrics(sends: SendRecord[], replies: ReplyRecord[]): Metrics {
  const n = sends.length || 1;
  return {
    ...rate(sends, replies),
    editRate: pct(sends.filter((s) => s.edited).length, sends.length),
    aiSec: Math.round(sends.reduce((a, s) => a + s.aiSec, 0) / n),
    totalSec: Math.round(sends.reduce((a, s) => a + s.aiSec + s.humanSec, 0) / n),
    by: { business: groupBy(sends, replies, "business"), channel: groupBy(sends, replies, "channel"), variant: groupBy(sends, replies, "variant") },
  };
}

export const fmtSec = (sec: number) => (sec < 60 ? `${sec}秒` : `${Math.floor(sec / 60)}分${String(sec % 60).padStart(2, "0")}秒`);
