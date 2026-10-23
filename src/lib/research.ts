// 02 営業準備：下調べのカード。すべての記述に出典を付ける（出典のない推測は書かない）
// 見本モード：主要な10社は data/samples の完成形。それ以外は、会社のデータと手引きから規則で組み立てる（簡易作成）
import { EVENT_LABEL, PLAYBOOKS, SAMPLES, isShop, sourceById, type BusinessId, type Company, type Statement } from "./data";
import { formatMonth } from "./scoring";

export type Research = {
  mode: "sample" | "auto";
  statements: Statement[];
  /** 連絡文の書き出し（出典のある事実） */
  hooks: string[];
  /** 提案の1文 */
  proposal: string;
  subject: string;
  /** 提案の切り口に使った出来事の種類 */
  angleType?: string;
};

const SAMVERB = /(発売|開始|開設|開業|発表|協賛|強化|移転|公開|就任|設立|稼働|募集|再開|拡大|導入|提供|更新)$/;
const PREFIX: Record<string, string> = { recruit: "採用ページで", news: "ニュースで", sns: "公式のお知らせで", site: "会社のサイトで" };

/** 出来事から、出典にもとづく書き出しの1文を作る（例：「ニュースで、貴社が〜を発売されたことを拝見しました。」） */
export function hookFromEvent(company: Company, short: string, sourceId: string): string {
  const src = sourceById(sourceId);
  const who = isShop(company.department) ? "" : "貴社が";
  const tail = SAMVERB.test(short) ? "されたことを拝見しました。" : short.endsWith("た") ? "ことを拝見しました。" : "ことを拝見しました。";
  return `${PREFIX[src?.kind ?? "news"]}、${who}${short}${tail}`;
}

export function getResearch(company: Company, business: BusinessId): Research {
  const sample = SAMPLES[company.id];
  if (sample && sample.business === business) {
    return { mode: "sample", statements: sample.statements, hooks: sample.hooks, proposal: sample.proposal, subject: sample.subject };
  }
  const pb = PLAYBOOKS.businesses[business];
  const events = [...company.events].sort((a, b) => b.date.localeCompare(a.date));
  const target = events.find((e) => pb.targets.triggers.includes(e.type)) ?? events[0];
  const angle = (target && pb.angles[target.type]) ?? `${pb.offer}のご提案`;
  const statements: Statement[] = [
    { label: isShop(company.department) ? "お店の概要" : "会社の概要", text: company.summary, sources: [company.siteSourceId] },
    ...events.map((e) => ({ label: "最近の出来事", text: `${formatMonth(e.date)}、${e.short}（${EVENT_LABEL[e.type]}）。`, sources: [e.sourceId] })),
    { label: "提案の切り口", text: `${angle}。`, sources: target ? [target.sourceId] : [company.siteSourceId] },
    { label: "話しかける相手", text: `${company.department}（サイトのお問い合わせの窓口）。`, sources: [company.siteSourceId] },
  ];
  return {
    mode: "auto",
    statements,
    hooks: target ? [hookFromEvent(company, target.short, target.sourceId)] : [],
    proposal: `${angle}をご提案できればと考えております。`,
    subject: target ? `${EVENT_LABEL[target.type]}に合わせた、${pb.short}のご提案` : `${pb.short}のご提案`,
    angleType: target?.type,
  };
}
