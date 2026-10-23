// 03 アプローチ：返信の仕分け（見本モードは、キーワードの規則）と、次の行動の提案
import type { ReplyCategory } from "./data";

export const CATEGORY_LABEL: Record<ReplyCategory, string> = {
  interested: "興味あり",
  materials: "資料がほしい",
  schedule: "日程の調整",
  wrong_person: "担当者が違う",
  not_now: "今は不要",
  decline: "お断り",
  unsubscribe: "配信停止",
  other: "分類できない（人が確認）",
};
export const NEXT_ACTION: Record<ReplyCategory, string> = {
  interested: "商談の候補へ。24時間以内に、人が日程の候補を返す",
  materials: "資料を送る（資料の送付の下書きを作り、人が確認して送る）",
  schedule: "日程の候補を3つ返す（下書きを作り、人が確認して送る）",
  wrong_person: "紹介された担当者に宛先を変え、下書きを作り直す",
  not_now: "3か月後に、もう一度連絡する予定を入れる",
  decline: "除外リストへ（自動）。今後は連絡しない",
  unsubscribe: "除外リストへ（自動）。今後は一切送らない",
  other: "人が内容を読んで判断する",
};
export const POSITIVE: ReplyCategory[] = ["interested", "materials", "schedule"];
export const AUTO_EXCLUDE: ReplyCategory[] = ["decline", "unsubscribe"];

// 上から順に見る（配信停止は、ほかの言葉が入っていても最優先）
const RULES: [ReplyCategory, RegExp][] = [
  ["unsubscribe", /配信を停止|配信停止|送らないで|今後.{0,10}不要/],
  ["wrong_person", /担当(者)?では(あり|ない)|担当が違|担当者が異な|別の部署|をご紹介します/],
  ["not_now", /現時点|来期|来年|半年|落ち着いたら|時期を改め/],
  ["decline", /見送|お断り|辞退|必要ありません|不要です/],
  ["schedule", /日程|候補日|ご都合|打ち合わせ|お話しさせて/],
  ["materials", /資料|事例|料金表|パンフレット/],
  ["interested", /興味|関心|詳しく|お話を伺/],
];

export function classifyReply(text: string): { category: ReplyCategory; keyword: string | null } {
  for (const [category, re] of RULES) {
    const m = text.match(re);
    if (m) return { category, keyword: m[0] };
  }
  return { category: "other", keyword: null };
}
