// デモの状態と、操作（純粋な関数）。ブラウザでは store.ts が localStorage に保存する
import { COMPANIES, HISTORY, PLAYBOOKS, REPLIES, companyById, sourcesOf, type BusinessId, type Channel, type Conditions, type ReplyCategory } from "./data";
import { capReached, scheduleFollowUps, stopFollowUps, type Send, type SendSettings } from "./followups";
import { generateDrafts, type Variant } from "./generate";
import { activeLimits, activeRules, type AddedRule } from "./knowledge";
import { computeMetrics, type ReplyRecord, type SendRecord } from "./metrics";
import { checkDraft, type CheckResult } from "./quality";
import { AUTO_EXCLUDE, classifyReply } from "./replies";
import { getResearch } from "./research";
import type { Exclusion } from "./scoring";

export type DraftStatus = "draft" | "pending" | "approved" | "rejected" | "sent";
export type Decision = { kind: "approve" | "approve_edit" | "reject"; reasonId?: string; note?: string; humanMs: number; at: string; ruleId?: string };
export type DraftRec = {
  id: string;
  companyId: string;
  business: BusinessId;
  channel: Channel;
  variant: Variant;
  label: string;
  subject: string;
  body: string;
  sendMode: "manual" | "auto";
  original: { subject: string; body: string };
  status: DraftStatus;
  createdAt: string;
  aiMs: number;
  research: "sample" | "auto";
  decision?: Decision;
};
export type ReplyRec = { replyId: string; sendId: string; companyId: string; category: ReplyCategory; keyword: string | null; byHuman: boolean; receivedAt: string };
export type LogRec = { at: string; action: string; detail: string; ms: number; tokens: number; yen: number };
export type Settings = SendSettings & { costCapYen: number };
export type SendRec = Send & { business: BusinessId; channel: Channel; variant: Variant; edited: boolean; aiSec: number; humanSec: number; manual: boolean };

export type State = {
  v: 1;
  seq: number;
  business: BusinessId;
  conditions: Record<BusinessId, Conditions | null>;
  lists: Record<BusinessId, string[] | null>;
  drafts: DraftRec[];
  addedRules: AddedRule[];
  exclusions: Exclusion[];
  sends: SendRec[];
  replies: ReplyRec[] | null;
  settings: Settings;
  logs: LogRec[];
};

export const initialState = (): State => ({
  v: 1,
  seq: 0,
  business: "sponsor",
  conditions: { sponsor: null, video: null, sns: null },
  lists: { sponsor: null, video: null, sns: null },
  drafts: [],
  addedRules: [],
  exclusions: [],
  sends: [],
  replies: null,
  settings: { dailyCap: 30, windowStart: 9, windowEnd: 18, costCapYen: 300 },
  logs: [],
});

/** 保存したデータを確かめて読む（壊れていれば初期の状態） */
export function parseState(raw: string | null): State {
  if (!raw) return initialState();
  try {
    const s = JSON.parse(raw);
    if (s?.v !== 1 || !Array.isArray(s.drafts) || !Array.isArray(s.sends)) return initialState();
    return { ...initialState(), ...s };
  } catch {
    return initialState();
  }
}

const log = (s: State, now: Date, action: string, detail: string, ms = 0): LogRec[] => [{ at: now.toISOString(), action, detail, ms, tokens: 0, yen: 0 }, ...s.logs].slice(0, 200);
const nextId = (s: State, p: string) => `${p}${s.seq + 1}`;

export const conditionsOf = (s: State, b: BusinessId): Conditions => s.conditions[b] ?? PLAYBOOKS.businesses[b].targets;

export function checkOf(s: State, d: Pick<DraftRec, "companyId" | "business" | "channel" | "sendMode" | "subject" | "body">): CheckResult {
  const company = companyById(d.companyId)!;
  return checkDraft({
    channel: d.channel,
    sendMode: d.sendMode,
    subject: d.subject,
    body: d.body,
    company,
    sources: sourcesOf(company.id),
    rules: activeRules(d.business, s.addedRules),
    limits: activeLimits(d.business, s.addedRules),
  });
}

export function setConditions(s: State, b: BusinessId, cond: Conditions | null): State {
  return { ...s, business: b, conditions: { ...s.conditions, [b]: cond } };
}
export function confirmList(s: State, b: BusinessId, ids: string[], now: Date): State {
  return { ...s, business: b, lists: { ...s.lists, [b]: ids }, logs: log(s, now, "営業リストの確定", `${ids.length}社（人が決定）`) };
}

/** 下書きを作る（同じ会社・同じ手段のまだ回していない下書きは、作り直す） */
export function createDrafts(s: State, companyId: string, business: BusinessId, channel: Channel, now: Date): State {
  const company = companyById(companyId);
  if (!company) return s;
  const t0 = performance.now();
  const research = getResearch(company, business);
  const contents = generateDrafts(company, business, channel, research, activeRules(business, s.addedRules));
  const ms = Math.max(1, Math.round(performance.now() - t0));
  let seq = s.seq;
  const fresh: DraftRec[] = contents.map((c) => ({
    ...c,
    id: `d${++seq}`,
    companyId,
    business,
    original: { subject: c.subject, body: c.body },
    status: "draft",
    createdAt: now.toISOString(),
    aiMs: ms,
    research: research.mode,
  }));
  const kept = s.drafts.filter((d) => !(d.companyId === companyId && d.channel === channel && d.status === "draft"));
  return { ...s, seq, drafts: [...kept, ...fresh], logs: log(s, now, "連絡文の下書きの作成", `${company.name}／${channel}／${fresh.length}案（${research.mode === "sample" ? "見本" : "簡易作成"}）`, ms) };
}

export function updateDraft(s: State, id: string, subject: string, body: string): State {
  return { ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, subject, body } : d)) };
}

/** 品質チェックを通ったものだけ、承認待ちへ */
export function submitForApproval(s: State, id: string, now: Date): { state: State; ok: boolean } {
  const d = s.drafts.find((x) => x.id === id);
  if (!d || d.status !== "draft") return { state: s, ok: false };
  const r = checkOf(s, d);
  if (!r.pass) return { state: { ...s, logs: log(s, now, "品質チェック", `${d.id}：止める項目があるため承認待ちに進めない（${r.score}点）`) }, ok: false };
  return { state: { ...s, drafts: s.drafts.map((x) => (x.id === id ? { ...x, status: "pending" } : x)), logs: log(s, now, "品質チェック", `${d.id}：${r.score}点、承認待ちへ`) }, ok: true };
}

export type DecideInput = { kind: Decision["kind"]; subject?: string; body?: string; reasonId?: string; note?: string; phrase?: string; replace?: string; humanMs: number };

/** 人の判断。修正の理由に「今後使わない表現」があれば、手引きにルールを加える（次の下書きとチェックに効く） */
export function decide(s: State, id: string, input: DecideInput, now: Date): { state: State; ok: boolean; message: string } {
  const d = s.drafts.find((x) => x.id === id);
  if (!d || d.status !== "pending") return { state: s, ok: false, message: "承認待ちの下書きではありません。" };
  const subject = input.subject ?? d.subject;
  const body = input.body ?? d.body;
  const changed = subject !== d.subject || body !== d.body;
  if (input.kind === "approve_edit" && !changed) return { state: s, ok: false, message: "本文が修正されていません。" };
  if (input.kind !== "approve" && !input.reasonId) return { state: s, ok: false, message: "理由を選んでください。" };
  if (input.kind !== "reject") {
    const r = checkOf(s, { ...d, subject, body });
    if (!r.pass) return { state: s, ok: false, message: "修正した文が品質チェックを通りません。止める項目を直してください。" };
  }
  let next: State = s;
  let ruleId: string | undefined;
  const preset = PLAYBOOKS.reasons.find((r) => r.id === input.reasonId);
  const phrase = (input.phrase ?? "").trim();
  if (input.kind !== "approve" && preset && (phrase || preset.sentenceMax)) {
    ruleId = nextId(s, "rule");
    const rule: AddedRule = {
      id: ruleId,
      scope: d.business,
      phrase,
      replace: (input.replace ?? "").trim(),
      reason: preset.id === "other" ? input.note || "承認のときの修正" : preset.label,
      sentenceMax: phrase ? undefined : preset.sentenceMax,
      fromDraftId: d.id,
      addedAt: now.toISOString(),
    };
    next = { ...next, seq: next.seq + 1, addedRules: [...next.addedRules, rule] };
  }
  const status: DraftStatus = input.kind === "reject" ? "rejected" : "approved";
  const decision: Decision = { kind: input.kind, reasonId: input.reasonId, note: input.note, humanMs: input.humanMs, at: now.toISOString(), ruleId };
  const label = { approve: "承認", approve_edit: "修正して承認", reject: "差し戻し" }[input.kind];
  next = {
    ...next,
    drafts: next.drafts.map((x) => (x.id === id ? { ...x, subject, body, status, decision } : x)),
    logs: log(next, now, label, `${d.id}${preset ? `：${preset.label}` : ""}${ruleId ? "（手引きにルールを追加）" : ""}`),
  };
  return { state: next, ok: true, message: ruleId ? "手引きにルールを追加しました。次の下書きから反映されます。" : `${label}しました。` };
}

/** 送付（再現）。承認したものだけ。メールとフォームは「送付（再現）」、DMと電話は人が手で行った記録 */
export function send(s: State, draftId: string, now: Date): { state: State; ok: boolean; message: string } {
  const d = s.drafts.find((x) => x.id === draftId);
  if (!d || d.status !== "approved") return { state: s, ok: false, message: "承認した下書きだけ送れます。" };
  if (capReached(s.sends, now, s.settings)) return { state: s, ok: false, message: `今日の送付の上限（${s.settings.dailyCap}件）に達しました。` };
  const manual = d.channel === "dm" || d.channel === "phone";
  const rec: SendRec = {
    id: nextId(s, "send"),
    draftId,
    companyId: d.companyId,
    sentAt: now.toISOString(),
    followUps: d.channel === "phone" ? [] : scheduleFollowUps(now, s.settings),
    business: d.business,
    channel: d.channel,
    variant: d.variant,
    edited: d.decision?.kind !== "approve",
    aiSec: Math.max(1, Math.round(d.aiMs / 1000)),
    humanSec: Math.round((d.decision?.humanMs ?? 0) / 1000),
    manual,
  };
  return {
    state: {
      ...s,
      seq: s.seq + 1,
      sends: [rec, ...s.sends],
      drafts: s.drafts.map((x) => (x.id === draftId ? { ...x, status: "sent" } : x)),
      logs: log(s, now, manual ? "手で送った記録" : "送付（再現）", `${companyById(d.companyId)?.name}／追いかけ${rec.followUps.length}件を予定`),
    },
    ok: true,
    message: manual ? "人が手で送ったことを記録しました。" : "送付しました（デモ：実際には送信していません）。",
  };
}

/** 返信を受け取る（デモ）。新しく送ったものから順に、架空の返信12件を割り当てて仕分ける */
export function receiveReplies(s: State, now: Date): State {
  if (s.replies) return s;
  const targets = [
    ...s.sends.map((x) => ({ sendId: x.id, companyId: x.companyId })),
    ...HISTORY.map((h) => ({ sendId: h.id, companyId: h.companyId })),
  ];
  const used = new Set<string>();
  const picks = targets.filter((t) => (used.has(t.companyId) ? false : (used.add(t.companyId), true)));
  const replies: ReplyRec[] = REPLIES.map((r, i) => {
    const c = classifyReply(r.text);
    return { replyId: r.id, sendId: picks[i].sendId, companyId: picks[i].companyId, category: c.category, keyword: c.keyword, byHuman: false, receivedAt: now.toISOString() };
  });
  let next: State = { ...s, replies };
  for (const r of replies) next = applyReply(next, r, now);
  return { ...next, logs: log(next, now, "返信の仕分け", `${replies.length}件を分類（キーワードの規則）`) };
}

function applyReply(s: State, r: ReplyRec, now: Date): State {
  let sends = stopFollowUps(s.sends, r.companyId) as SendRec[];
  let exclusions = s.exclusions.filter((e) => e.replyId !== r.replyId);
  if (AUTO_EXCLUDE.includes(r.category)) {
    exclusions = [...exclusions, { companyId: r.companyId, reason: r.category === "unsubscribe" ? "unsubscribed" : "declined", at: now.toISOString(), replyId: r.replyId }];
  }
  sends = sends.map((x) => x);
  return { ...s, sends, exclusions };
}

/** 人が分類を直す（除外リストも合わせて直す） */
export function setReplyCategory(s: State, replyId: string, category: ReplyCategory, now: Date): State {
  if (!s.replies) return s;
  const replies = s.replies.map((r) => (r.replyId === replyId ? { ...r, category, byHuman: true } : r));
  const r = replies.find((x) => x.replyId === replyId)!;
  return applyReply({ ...s, replies, logs: log(s, now, "返信の分類を人が修正", `${replyId}`) }, r, now);
}

export function removeRule(s: State, id: string): State {
  return { ...s, addedRules: s.addedRules.filter((r) => r.id !== id) };
}

/** 効果測定の元（過去の記録＋デモで送ったもの） */
export function metricsOf(s: State) {
  const sends: SendRecord[] = [
    ...s.sends.map((x) => ({ id: x.id, companyId: x.companyId, business: x.business, channel: x.channel, variant: x.variant, edited: x.edited, aiSec: x.aiSec, humanSec: x.humanSec, demo: true })),
    ...HISTORY.map((h) => ({ ...h, demo: false })),
  ];
  const replies: ReplyRecord[] = (s.replies ?? []).map((r) => ({ replyId: r.replyId, sendId: r.sendId, category: r.category }));
  return computeMetrics(sends, replies);
}

export const companiesForList = (s: State, b: BusinessId) => (s.lists[b] ?? []).map((id) => COMPANIES.find((c) => c.id === id)!).filter(Boolean);
