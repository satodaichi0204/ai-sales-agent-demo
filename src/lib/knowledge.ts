// 14 土台：社内の手引き（ナレッジ）。共通のルール＋事業ごとの手引き＋承認の修正から追加したルール
import { PLAYBOOKS, type BusinessId, type Limits, type NgRule } from "./data";

export type AddedRule = {
  id: string;
  /** "common" なら全事業、それ以外はその事業だけ */
  scope: "common" | BusinessId;
  phrase: string;
  replace: string;
  reason: string;
  /** 1文の長さの上限を変えるルール */
  sentenceMax?: number;
  fromDraftId?: string;
  addedAt: string;
};
export type ActiveRule = NgRule & { origin: "common" | "business" | "approval"; id?: string };

/** 品質チェックと下書きの作成で使う「言ってはいけない表現」 */
export function activeRules(business: BusinessId, added: AddedRule[]): ActiveRule[] {
  return [
    ...PLAYBOOKS.common.ng.map((r) => ({ ...r, origin: "common" as const })),
    ...PLAYBOOKS.businesses[business].ng.map((r) => ({ ...r, origin: "business" as const })),
    ...added
      .filter((r) => r.phrase && (r.scope === "common" || r.scope === business))
      .map((r) => ({ phrase: r.phrase, reason: r.reason, replace: r.replace, origin: "approval" as const, id: r.id })),
  ];
}

/** 長さの上限（承認の修正から「文が長い」が加わっていれば、1文の上限を下げる） */
export function activeLimits(business: BusinessId, added: AddedRule[]): Limits {
  const caps = added.filter((r) => r.sentenceMax && (r.scope === "common" || r.scope === business)).map((r) => r.sentenceMax!);
  return { ...PLAYBOOKS.common.limits, sentenceMax: Math.min(PLAYBOOKS.common.limits.sentenceMax, ...caps) };
}

/** 次の下書きに反映する：言い換えのあるルールは、作るときに置き換える */
export function applyRules(text: string, rules: ActiveRule[]): string {
  let out = text;
  for (const r of rules) {
    if (r.phrase && out.includes(r.phrase)) out = out.split(r.phrase).join(r.replace);
  }
  return out;
}
