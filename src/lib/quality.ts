// 14 土台：品質チェック。下書きを自動で採点し、問題の箇所と理由を返す。止める項目が0件のときだけ承認待ちへ進める
import { COMPANIES, PLAYBOOKS, shortName, type Channel, type Company, type Limits, type Source } from "./data";
import type { ActiveRule } from "./knowledge";

export type CheckId = "grounding" | "hype" | "sender" | "recipient" | "privacy" | "ng" | "length" | "channel";
export const CHECKS: { id: CheckId; label: string; detail: string }[] = [
  { id: "grounding", label: "根拠", detail: "会社についての記述が、下調べの出典と結び付いているか" },
  { id: "hype", label: "誇大な表現", detail: "「No.1」「必ず」「絶対」「業界初」など、根拠のない言い切り" },
  { id: "sender", label: "送信者の表示と配信停止の案内", detail: "送信者の名前、連絡先、配信停止の方法（特定電子メール法を意識）" },
  { id: "recipient", label: "宛先の一致", detail: "本文の会社名と部署名が、宛先と一致しているか" },
  { id: "privacy", label: "個人の情報", detail: "個人の私生活や、本人の同意のない個人の情報に触れていないか" },
  { id: "ng", label: "言ってはいけない表現", detail: "手引きの「言ってはいけない表現」に当たらないか" },
  { id: "length", label: "長さと読みやすさ", detail: "件名、本文、1文の長さ（注意のみ）" },
  { id: "channel", label: "手段の規約", detail: "SNSのDMを自動で送る設定になっていないか" },
];

export type Severity = "stop" | "warn";
export type Issue = { check: CheckId; severity: Severity; message: string; match?: string };
export type Grounded = { sentence: string; sourceId: string | null };
export type CheckResult = { score: number; pass: boolean; issues: Issue[]; status: Record<CheckId, "ok" | "warn" | "stop" | "na">; grounded: Grounded[] };
export type CheckInput = { channel: Channel; sendMode: "manual" | "auto"; subject: string; body: string; company: Company; sources: Source[]; rules: ActiveRule[]; limits: Limits };

const FOOTER_LINE = /^[―─-]{4,}/;
const HYPE = /No\.?\s?1|ナンバーワン|ナンバー1|業界初|日本初|世界初|必ず|絶対|確実に|100[%％]|保証します|最高の|圧倒的|唯一の/g;
const PRIVATE = /ご家族|家族の|ご結婚|離婚|ご病気|持病|ご自宅|私生活|プライベート|年収|お子様|恋人|交際/g;
const COMPANY_WORD = /貴社|御社|貴店|貴館|貴院/;
const PAST = /(された|されました|しました|られた|と伺|拝見しました|によると|を迎え|を発表|を開始|を発売|を開設|を開業)/;
// 出典と照らし合わせるときに外す、こちらの言い回し
const BOILER = ["採用ページで、", "ニュースで、", "公式のお知らせで、", "会社のサイトで、", "貴社が", "貴社は", "貴社の", "貴社", "御社", "されたことを拝見しました", "ことを拝見しました", "と拝見しました", "を拝見しました", "拝見しました", "のニュース", "と伺いました", "されていくと", "されたと", "されている", "されていることを", "されました", "された", "ことを", "には", "からは", "も、", "とてもおいしそうです", "ことを"];

/** 本文の、署名より前の部分（文に分ける） */
export function sentencesOf(body: string): string[] {
  const lines = body.split("\n");
  const end = lines.findIndex((l) => FOOTER_LINE.test(l.trim()));
  return (end >= 0 ? lines.slice(0, end) : lines)
    .flatMap((l) => l.split(/(?<=[。！？])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

const bigrams = (s: string) => {
  const t = s.replace(/[\s、。・（）()「」『』：:]/g, "");
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
};
/** 文の言葉が、出典の文にどれだけ含まれているか（0〜1） */
export function containment(sentence: string, source: string): number {
  let s = sentence;
  for (const b of BOILER) s = s.split(b).join("、");
  const grams = bigrams(s);
  if (grams.length === 0) return 1;
  const src = new Set(bigrams(source));
  return grams.filter((g) => src.has(g)).length / grams.length;
}
const numbersOf = (s: string) => s.normalize("NFKC").match(/\d+/g) ?? [];
const hasNumber = (text: string, n: string) => new RegExp(`(^|\\D)${n}(\\D|$)`).test(text.normalize("NFKC"));
const quotesOf = (s: string) => [...s.matchAll(/[『「]([^』」]+)[』」]/g)].map((m) => m[1]);

/** 相手の会社についての事実の記述か */
export function isClaim(text: string, company: Company): boolean {
  const sentence = text.replace(/^【[^】]*】/, "");
  if (sentence.startsWith("（例）")) return false;
  const mentions = COMPANY_WORD.test(sentence) || sentence.includes(shortName(company.name));
  const fact = /\d|『|「/.test(sentence) || PAST.test(sentence);
  return (mentions && fact) || (/\d/.test(sentence) && PAST.test(sentence)) || /拝見しました|と伺いました|によると/.test(sentence);
}

/** 出典と結び付ける。数字と引用はそのまま出典にあり、言葉の半分以上が出典と重なること */
export function groundSentence(text: string, sources: Source[]): string | null {
  const sentence = text.replace(/^【[^】]*】/, "");
  let best: { id: string; c: number } | null = null;
  for (const src of sources) {
    if (!numbersOf(sentence).every((n) => hasNumber(src.text, n))) continue;
    if (!quotesOf(sentence).every((q) => src.text.includes(q))) continue;
    const c = containment(sentence, src.text);
    if (c >= 0.5 && (!best || c > best.c)) best = { id: src.id, c };
  }
  return best?.id ?? null;
}

export function checkDraft(input: CheckInput): CheckResult {
  const { channel, sendMode, subject, body, company, sources, rules, limits } = input;
  const issues: Issue[] = [];
  const all = `${subject}\n${body}`;
  const sentences = sentencesOf(body);

  // 根拠
  const grounded: Grounded[] = [];
  for (const s of sentences) {
    if (!isClaim(s, company)) continue;
    const id = groundSentence(s, sources);
    grounded.push({ sentence: s, sourceId: id });
    if (!id) issues.push({ check: "grounding", severity: "stop", message: "出典と結び付かない、相手の会社についての記述です。下調べの出典にある事実だけを書いてください。", match: s });
  }
  // 誇大な表現
  for (const m of new Set(all.match(HYPE) ?? [])) issues.push({ check: "hype", severity: "stop", message: `「${m}」は根拠のない言い切りです。`, match: m });
  // 送信者の表示と配信停止の案内
  if (channel === "email" || channel === "form") {
    const sender = PLAYBOOKS.sender;
    if (!body.includes(shortName(sender.company))) issues.push({ check: "sender", severity: "stop", message: "送信者の会社名がありません。" });
    if (!body.includes(sender.tel) && !body.includes(sender.email)) issues.push({ check: "sender", severity: "stop", message: "送信者の連絡先（電話番号かメールアドレス）がありません。" });
    if (channel === "email" && !/配信を停止|配信停止|不要な場合/.test(body)) issues.push({ check: "sender", severity: "stop", message: "配信停止の方法の案内がありません（特定電子メール法）。" });
  }
  // 宛先の一致
  const own = shortName(company.name);
  if (channel !== "phone") {
    const first = body.split("\n").find((l) => l.trim()) ?? "";
    if (!first.includes(own)) issues.push({ check: "recipient", severity: "stop", message: `宛名が宛先の会社（${company.name}）と違います。`, match: first });
    if ((channel === "email" || channel === "form") && !body.split("\n").slice(0, 3).some((l) => l.includes(company.department)))
      issues.push({ check: "recipient", severity: "stop", message: `宛名の部署が、宛先の部署（${company.department}）と違います。` });
  }
  for (const other of COMPANIES) {
    if (other.domain === company.domain) continue;
    const name = shortName(other.name);
    if (name.length >= 3 && all.includes(name)) {
      issues.push({ check: "recipient", severity: "stop", message: `ほかの会社の名前（${other.name}）が入っています。`, match: name });
      break;
    }
  }
  // 個人の情報
  for (const m of new Set(all.match(PRIVATE) ?? [])) issues.push({ check: "privacy", severity: "stop", message: `「${m}」は個人の私生活に触れる内容です。`, match: m });
  // 言ってはいけない表現
  for (const r of rules) {
    if (r.phrase && all.includes(r.phrase)) {
      const origin = r.origin === "approval" ? "（承認の修正から追加したルール）" : r.origin === "common" ? "（共通のルール）" : "（事業ごとの手引き）";
      issues.push({ check: "ng", severity: "stop", message: `「${r.phrase}」：${r.reason}${origin}${r.replace ? `。言い換え：「${r.replace}」` : ""}`, match: r.phrase });
    }
  }
  // 長さと読みやすさ（注意）
  if (subject && subject.length > limits.subjectMax) issues.push({ check: "length", severity: "warn", message: `件名が${subject.length}文字です（${limits.subjectMax}文字以内がおすすめ）。` });
  const bodyLen = sentences.join("").length;
  if (channel === "email" && bodyLen > limits.emailBodyMax) issues.push({ check: "length", severity: "warn", message: `本文が${bodyLen}文字です（${limits.emailBodyMax}文字以内がおすすめ）。` });
  if (channel === "dm" && body.length > limits.dmBodyMax) issues.push({ check: "length", severity: "warn", message: `DMが${body.length}文字です（${limits.dmBodyMax}文字以内がおすすめ）。` });
  for (const s of sentences) {
    if (s.length > limits.sentenceMax) issues.push({ check: "length", severity: "warn", message: `1文が${s.length}文字です（${limits.sentenceMax}文字以内がおすすめ）。`, match: s });
  }
  // 手段の規約
  if (channel === "dm" && sendMode === "auto") issues.push({ check: "channel", severity: "stop", message: "SNSのDMを自動で送る設定です。多くのSNSの規約で自動化が禁止されているため、DMは下書きまでにし、人が手で送ります。" });

  const status = Object.fromEntries(CHECKS.map((c) => [c.id, "ok"])) as CheckResult["status"];
  if (channel !== "email" && channel !== "form") status.sender = "na";
  if (channel !== "dm") status.channel = "na";
  for (const i of issues) status[i.check] = i.severity === "stop" ? "stop" : status[i.check] === "stop" ? "stop" : "warn";
  const stops = issues.filter((i) => i.severity === "stop").length;
  const warns = issues.length - stops;
  return { score: Math.max(0, 100 - stops * 20 - warns * 5), pass: stops === 0, issues, status, grounded };
}
