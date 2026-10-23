// 03 アプローチ：連絡文の下書き（メール、問い合わせフォーム、DM、電話の話す内容のメモ）
// 下調べの事実と、事業ごとの手引き（強み、ひな形、言ってはいけない表現）から作る
import { PLAYBOOKS, addressee, shortName, type BusinessId, type Channel, type Company } from "./data";
import { applyRules, type ActiveRule } from "./knowledge";
import type { Research } from "./research";

export type Variant = "A" | "B" | "C";
export type DraftContent = { channel: Channel; variant: Variant; label: string; subject: string; body: string; sendMode: "manual" | "auto" };

export const VARIANT_LABEL: Record<Variant, string> = { A: "A：相手の出来事から書き出す", B: "B：こちらの強みから書き出す", C: "C：短く要点だけ" };

const S = PLAYBOOKS.sender;
const shortSender = shortName(S.company);

export function emailFooter(): string {
  return PLAYBOOKS.common.emailFooter
    .replace("{company}", S.company)
    .replace("{department}", S.department)
    .replace("{person}", S.person)
    .replace("{address}", S.address)
    .replace("{tel}", S.tel)
    .replace("{email}", S.email);
}
const formSignature = () => `${S.company}　${S.department}　${S.person}\nTEL ${S.tel}　${S.email}`;
const strip = (s: string) => s.replace(/。$/, "");

export function generateDrafts(company: Company, business: BusinessId, channel: Channel, research: Research, rules: ActiveRule[]): DraftContent[] {
  const pb = PLAYBOOKS.businesses[business];
  const head = `${company.name}\n${addressee(company.department)}\n\n`;
  const intro = `はじめてご連絡いたします。${S.company}の${S.person}と申します。`;
  const hooks = research.hooks.join("\n");
  const hook1 = research.hooks[0] ?? "";
  const strong = `弊社は、${strip(pb.strengths[0])}。`;
  const example = `${strip(pb.strengths[1])}。`;
  let drafts: DraftContent[];

  if (channel === "email" || channel === "form") {
    const end = channel === "email" ? `\n\n${emailFooter()}` : `\n\n${formSignature()}`;
    drafts = [
      { variant: "A", subject: research.subject, body: `${head}${intro}\n${hooks}\n${research.proposal}\n${strong}\n${pb.cta}${end}` },
      { variant: "B", subject: `${pb.offer}のご案内`, body: `${head}${intro}\n${strong}\n${example}\n${hook1}\n${research.proposal}\n${pb.cta}${end}` },
      { variant: "C", subject: `${shortName(company.name)}様への${pb.short}のご提案`, body: `${head}はじめてご連絡いたします。${S.company}の${S.person}です。\n${hook1}\n${research.proposal}\n${pb.cta}${end}` },
    ].map((d) => ({ ...d, channel, label: VARIANT_LABEL[d.variant as Variant], sendMode: "manual" as const })) as DraftContent[];
  } else if (channel === "dm") {
    const top = `${shortName(company.name)} ${addressee(company.department)}\nはじめまして、${shortSender}の${S.person}です。`;
    const ask = "詳しい資料をお送りしてもよろしいでしょうか。";
    drafts = [
      { variant: "A", body: `${top}\n${hook1}\n${research.proposal}\n${ask}` },
      { variant: "B", body: `${top}\n${strong}\n${hook1}\n${ask}` },
      { variant: "C", body: `${top}\n${hook1}\n${ask}` },
    ].map((d) => ({ ...d, subject: "", channel, label: VARIANT_LABEL[d.variant as Variant], sendMode: "manual" as const })) as DraftContent[];
  } else {
    drafts = [
      {
        channel,
        variant: "A",
        label: "電話で話す内容のメモ",
        subject: "",
        sendMode: "manual",
        body: [
          `【受付で】${S.company}の${S.person}です。${company.department}のご担当の方はいらっしゃいますか。`,
          `【ご担当の方へ】${hook1}`,
          `【ご提案】${research.proposal}`,
          `【お願い】${pb.cta}`,
          "【断られたら】お時間をいただいたお礼を伝え、資料の送付だけでもよいか伺う。無理に続けない。",
        ].join("\n"),
      },
    ];
  }
  // 手引きの「言ってはいけない表現」に言い換えがあれば、作るときに置き換える（承認の修正から加わったルールも含む）
  return drafts.map((d) => ({ ...d, subject: applyRules(d.subject, rules), body: applyRules(d.body, rules) }));
}
