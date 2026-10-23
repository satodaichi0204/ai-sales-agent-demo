import { describe, expect, it } from "vitest";
import { BUSINESS_IDS, COMPANIES, PLAYBOOKS, PROBLEMS, REPLIES, SAMPLES, SOURCES, companyById, sourcesOf, type Channel } from "./data";
import { addBusinessDays, capReached, scheduleFollowUps, stopFollowUps, type Send } from "./followups";
import { generateDrafts } from "./generate";
import { activeLimits, activeRules, applyRules, type AddedRule } from "./knowledge";
import { computeMetrics } from "./metrics";
import { checkDraft, groundSentence } from "./quality";
import { classifyReply } from "./replies";
import { getResearch } from "./research";
import { rankCompanies, recommended } from "./scoring";
import { checkOf, confirmList, createDrafts, decide, initialState, metricsOf, parseState, receiveReplies, send, submitForApproval, type State } from "./state";

const NOW = new Date("2026-10-23T10:00:00+09:00");
const check = (companyId: string, channel: Channel, subject: string, body: string, opts: { sendMode?: "manual" | "auto"; added?: AddedRule[] } = {}) => {
  const c = companyById(companyId)!;
  const business = SAMPLES[companyId]?.business ?? "sponsor";
  return checkDraft({ channel, sendMode: opts.sendMode ?? "manual", subject, body, company: c, sources: sourcesOf(c.id), rules: activeRules(business, opts.added ?? []), limits: activeLimits(business, opts.added ?? []) });
};

describe("架空のデータ", () => {
  it("会社は60社。すべて名前に（架空）が付き、ドメインは .example", () => {
    expect(COMPANIES).toHaveLength(60);
    for (const c of COMPANIES) {
      expect(c.name).toContain("（架空）");
      expect(c.domain.endsWith(".example")).toBe(true);
    }
  });
  it("出典は1社あたり2〜4件。URLはすべて架空のドメイン", () => {
    for (const c of COMPANIES) expect(sourcesOf(c.id).length).toBeGreaterThanOrEqual(2);
    for (const c of COMPANIES) expect(sourcesOf(c.id).length).toBeLessThanOrEqual(4);
    for (const s of SOURCES) expect(new URL(s.url).hostname.endsWith(".example")).toBe(true);
  });
  it("3つの事業のそれぞれに、狙う相手になる会社が15社以上ある", () => {
    for (const b of BUSINESS_IDS) {
      const { ranked } = rankCompanies(COMPANIES, PLAYBOOKS.businesses[b].targets, [], NOW);
      expect(ranked.filter((r) => r.score >= 60).length, b).toBeGreaterThanOrEqual(15);
    }
  });
  it("見本の下調べは10社。すべての記述に、その会社の出典がある", () => {
    expect(Object.keys(SAMPLES)).toHaveLength(10);
    for (const [id, s] of Object.entries(SAMPLES)) {
      for (const st of s.statements) {
        expect(st.sources.length, `${id} ${st.text}`).toBeGreaterThan(0);
        for (const sid of st.sources) expect(sid.startsWith(`${id}-`)).toBe(true);
      }
    }
  });
});

describe("採点（02 営業準備）", () => {
  const cond = PLAYBOOKS.businesses.sponsor.targets;
  const { ranked, excluded } = rankCompanies(COMPANIES, cond, [], NOW);
  it("条件に合う会社が上位に来る（スポンサー：飲料・スポーツ用品などで、最近の出来事がある会社）", () => {
    const top = ranked.slice(0, 10).map((r) => r.company.industry);
    for (const i of top) expect(cond.industries).toContain(i);
    expect(ranked[0].score).toBeGreaterThanOrEqual(90);
  });
  it("採点の理由を1行で出す（出来事と時期）", () => {
    const c01 = ranked.find((r) => r.company.id === "c01")!;
    expect(c01.reason).toContain("2026年9月");
    expect(c01.reason).toContain("スパークリングゆず");
  });
  it("取引中、過去に断られた、配信停止の会社は出ない（除外リストに入る）", () => {
    const ids = ranked.map((r) => r.company.id);
    for (const id of ["c05", "c06", "c07", "c24", "c25", "c44"]) expect(ids).not.toContain(id);
    expect(excluded.find((e) => e.company.id === "c07")?.reason).toBe("配信停止");
  });
  it("同じ会社の重複（同じドメイン）は1つにまとめる", () => {
    expect(ranked.map((r) => r.company.id)).not.toContain("c18");
    expect(excluded.find((e) => e.company.id === "c18")?.reason).toContain("重複");
  });
  it("返信から加わった除外リストの会社も出ない", () => {
    const r = rankCompanies(COMPANIES, cond, [{ companyId: "c01", reason: "unsubscribed", at: "" }], NOW);
    expect(r.ranked.map((x) => x.company.id)).not.toContain("c01");
  });
  it("どの事業にも合わない会社は下位に来る", () => {
    const last = ranked.slice(-4).map((r) => r.company.id);
    expect(last.some((id) => ["c57", "c58", "c59", "c60"].includes(id))).toBe(true);
  });
  it("AIのおすすめは70点以上の上位10社まで", () => {
    const rec = recommended(ranked);
    expect(rec.length).toBeLessThanOrEqual(10);
    expect(rec.length).toBeGreaterThan(0);
  });
});

describe("下調べと下書き", () => {
  it("見本の会社は完成形、それ以外は簡易作成。どちらも記述には必ず出典がある", () => {
    expect(getResearch(companyById("c01")!, "sponsor").mode).toBe("sample");
    const auto = getResearch(companyById("c09")!, "sponsor");
    expect(auto.mode).toBe("auto");
    for (const st of auto.statements) expect(st.sources.length).toBeGreaterThan(0);
  });
  it("見本の10社の下書き（メール、フォーム、DM、電話の4手段）は、すべて品質チェックを通る", () => {
    for (const id of Object.keys(SAMPLES)) {
      const c = companyById(id)!;
      const b = SAMPLES[id].business;
      for (const ch of ["email", "form", "dm", "phone"] as Channel[]) {
        for (const d of generateDrafts(c, b, ch, getResearch(c, b), activeRules(b, []))) {
          const r = check(id, ch, d.subject, d.body);
          expect(r.issues.filter((i) => i.severity === "stop"), `${id} ${ch} ${d.variant}`).toEqual([]);
        }
      }
    }
  });
  it("簡易作成の下書きも、狙う相手の全社で品質チェックを通る（出典と結び付く）", () => {
    for (const b of BUSINESS_IDS) {
      const { ranked } = rankCompanies(COMPANIES, PLAYBOOKS.businesses[b].targets, [], NOW);
      for (const r of ranked.filter((x) => x.score >= 60)) {
        const [d] = generateDrafts(r.company, b, "email", getResearch(r.company, b), activeRules(b, []));
        const res = checkDraft({ channel: "email", sendMode: "manual", subject: d.subject, body: d.body, company: r.company, sources: sourcesOf(r.company.id), rules: activeRules(b, []), limits: activeLimits(b, []) });
        expect(res.issues.filter((i) => i.severity === "stop"), `${b} ${r.company.id}`).toEqual([]);
        expect(res.grounded.length, `${b} ${r.company.id}`).toBeGreaterThan(0);
      }
    }
  });
  it("連絡文の書き出しは、出典の文と結び付く", () => {
    expect(groundSentence(SAMPLES.c01.hooks[0], sourcesOf("c01"))).toBe("c01-s2");
    expect(groundSentence(SAMPLES.c01.hooks[1], sourcesOf("c01"))).toBe("c01-s3");
  });
  it("下書きは1社につき3案（電話は話す内容のメモ1つ）", () => {
    const c = companyById("c02")!;
    expect(generateDrafts(c, "sponsor", "email", getResearch(c, "sponsor"), [])).toHaveLength(3);
    expect(generateDrafts(c, "sponsor", "phone", getResearch(c, "sponsor"), [])).toHaveLength(1);
  });
});

describe("品質チェック（14 土台）", () => {
  const [p1, p2, p3, p4] = PROBLEMS;
  const run = (p: (typeof PROBLEMS)[number]) => check(p.companyId, p.channel, p.subject, p.body, { sendMode: p.sendMode });
  it("根拠のない「No.1」を止める", () => {
    const r = run(p1);
    expect(r.pass).toBe(false);
    expect(r.issues.some((i) => i.check === "hype" && i.match?.includes("No.1"))).toBe(true);
  });
  it("出典のない数字（「売上が2倍」）を止める", () => {
    expect(run(p1).issues.some((i) => i.check === "grounding" && i.match?.includes("2倍"))).toBe(true);
  });
  it("「必ず話題」は、誇大な表現と、事業ごとの手引きの両方で止める", () => {
    const r = run(p1);
    expect(r.issues.some((i) => i.check === "ng" && i.match === "必ず話題")).toBe(true);
  });
  it("送信者の表示と配信停止の案内がないメールを止める", () => {
    const r = run(p2);
    expect(r.pass).toBe(false);
    expect(r.issues.filter((i) => i.check === "sender").length).toBeGreaterThanOrEqual(2);
    expect(r.issues.some((i) => i.message.includes("配信停止"))).toBe(true);
  });
  it("宛先と本文の会社名の取り違えを止める", () => {
    const r = run(p3);
    expect(r.pass).toBe(false);
    expect(r.issues.some((i) => i.check === "recipient" && i.message.includes("ほかの会社"))).toBe(true);
  });
  it("DMを自動で送る設定と、個人の私生活に触れる文を止める", () => {
    const r = run(p4);
    expect(r.status.channel).toBe("stop");
    expect(r.status.privacy).toBe("stop");
  });
  it("問題のある下書きは4件とも、承認待ちへ進めない", () => {
    for (const p of PROBLEMS) expect(run(p).pass, p.id).toBe(false);
  });
  it("点数は、止める項目1つで20点、注意1つで5点下がる", () => {
    const r = run(p2);
    const stops = r.issues.filter((i) => i.severity === "stop").length;
    const warns = r.issues.length - stops;
    expect(r.score).toBe(Math.max(0, 100 - stops * 20 - warns * 5));
  });
  it("長い件名と長い文は、止めずに注意だけ出す", () => {
    const c = companyById("c01")!;
    const [d] = generateDrafts(c, "sponsor", "email", getResearch(c, "sponsor"), []);
    const r = check("c01", "email", "あ".repeat(40), d.body);
    expect(r.pass).toBe(true);
    expect(r.issues.some((i) => i.check === "length" && i.severity === "warn")).toBe(true);
  });
  it("メール以外では、配信停止の案内を求めない（電話のメモ）", () => {
    const c = companyById("c01")!;
    const [d] = generateDrafts(c, "sponsor", "phone", getResearch(c, "sponsor"), []);
    expect(check("c01", "phone", "", d.body).status.sender).toBe("na");
  });
});

describe("ナレッジ（承認の修正から育てる）", () => {
  const rule: AddedRule = { id: "rule1", scope: "sponsor", phrase: "トップアスリートが多数所属する", replace: "陸上やバスケットボールなどの選手が所属する", reason: "実績の書き方が強すぎる", addedAt: "" };
  it("加えたルールは、次の品質チェックで止める", () => {
    const c = companyById("c01")!;
    const [d] = generateDrafts(c, "sponsor", "email", getResearch(c, "sponsor"), activeRules("sponsor", []));
    expect(d.body).toContain("トップアスリートが多数所属する");
    expect(check("c01", "email", d.subject, d.body).pass).toBe(true);
    const r = check("c01", "email", d.subject, d.body, { added: [rule] });
    expect(r.pass).toBe(false);
    expect(r.issues.some((i) => i.message.includes("承認の修正から追加"))).toBe(true);
  });
  it("加えたルールの言い換えは、次の下書きに反映される", () => {
    const c = companyById("c01")!;
    const [d] = generateDrafts(c, "sponsor", "email", getResearch(c, "sponsor"), activeRules("sponsor", [rule]));
    expect(d.body).not.toContain("トップアスリートが多数所属する");
    expect(d.body).toContain("陸上やバスケットボールなどの選手が所属する");
  });
  it("事業ごとのルールは、ほかの事業には効かない。共通のルールは全事業に効く", () => {
    expect(activeRules("video", [rule]).some((r) => r.phrase === rule.phrase)).toBe(false);
    expect(activeRules("video", [{ ...rule, scope: "common" }]).some((r) => r.phrase === rule.phrase)).toBe(true);
    expect(activeRules("sns", []).some((r) => r.phrase === "お世話になっております")).toBe(true);
  });
  it("「文が長い」の理由は、1文の長さの上限を下げる", () => {
    expect(activeLimits("sponsor", [{ ...rule, phrase: "", sentenceMax: 70 }]).sentenceMax).toBe(70);
  });
  it("言い換えの置き換え", () => {
    expect(applyRules("お世話になっております。", activeRules("sponsor", []))).toBe("はじめてご連絡いたします。");
  });
});

describe("返信の仕分け", () => {
  it("12件をすべて正しい分類にする", () => {
    for (const r of REPLIES) expect(classifyReply(r.text).category, r.text).toBe(r.expected);
  });
  it("内訳は、興味あり3、資料2、日程2、担当違い1、今は不要2、お断り1、配信停止1", () => {
    const n = (c: string) => REPLIES.filter((r) => classifyReply(r.text).category === c).length;
    expect([n("interested"), n("materials"), n("schedule"), n("wrong_person"), n("not_now"), n("decline"), n("unsubscribe")]).toEqual([3, 2, 2, 1, 2, 1, 1]);
  });
  it("配信停止は、ほかの言葉が入っていても最優先", () => {
    expect(classifyReply("資料はありがたいのですが、今後は配信を停止してください").category).toBe("unsubscribe");
  });
  it("分類できない返信は、人が確認する", () => {
    expect(classifyReply("承知しました。").category).toBe("other");
  });
});

describe("追いかけ", () => {
  const s = { dailyCap: 2, windowStart: 9, windowEnd: 18 };
  it("3営業日後（土日を除く）と7日後に予定を作る", () => {
    const fu = scheduleFollowUps(NOW, s);
    expect(fu).toHaveLength(2);
    expect(new Date(fu[0].due).getDate()).toBe(28); // 10/23（金）の3営業日後は10/28（水）
    expect(new Date(fu[1].due).getDate()).toBe(30);
    expect(addBusinessDays(new Date("2026-10-23T10:00:00+09:00"), 1).getDay()).toBe(1);
  });
  it("返信が来たら、その会社の追いかけを止める", () => {
    const sends: Send[] = [{ id: "s1", draftId: "d1", companyId: "c01", sentAt: NOW.toISOString(), followUps: scheduleFollowUps(NOW, s) }, { id: "s2", draftId: "d2", companyId: "c02", sentAt: NOW.toISOString(), followUps: scheduleFollowUps(NOW, s) }];
    const after = stopFollowUps(sends, "c01");
    expect(after[0].followUps.every((f) => f.status === "stopped")).toBe(true);
    expect(after[1].followUps.every((f) => f.status === "scheduled")).toBe(true);
  });
  it("1日の送付数の上限", () => {
    const sends: Send[] = [1, 2].map((i) => ({ id: `s${i}`, draftId: "d", companyId: "c", sentAt: NOW.toISOString(), followUps: [] }));
    expect(capReached(sends, NOW, s)).toBe(true);
    expect(capReached(sends.slice(1), NOW, s)).toBe(false);
  });
});

describe("通しの流れ（状態）", () => {
  const flow = () => {
    let s: State = initialState();
    s = confirmList(s, "sponsor", ["c01", "c02"], NOW);
    s = createDrafts(s, "c01", "sponsor", "email", NOW);
    const d = s.drafts[0];
    const sub = submitForApproval(s, d.id, NOW);
    s = sub.state;
    return { s, d, ok: sub.ok };
  };
  it("品質チェックを通った下書きだけ承認待ちへ。承認したものだけ送れる", () => {
    const { s, d, ok } = flow();
    expect(ok).toBe(true);
    expect(send(s, d.id, NOW).ok).toBe(false);
    const a = decide(s, d.id, { kind: "approve", humanMs: 60_000 }, NOW).state;
    const sent = send(a, d.id, NOW);
    expect(sent.ok).toBe(true);
    expect(sent.state.sends[0].followUps).toHaveLength(2);
  });
  it("差し戻しの理由から手引きにルールが加わり、次の下書きでは言い換わる", () => {
    const { s, d } = flow();
    const preset = PLAYBOOKS.reasons.find((r) => r.id === "too_strong")!;
    const r = decide(s, d.id, { kind: "reject", reasonId: "too_strong", phrase: preset.phrase, replace: preset.replace, humanMs: 30_000 }, NOW);
    expect(r.ok).toBe(true);
    expect(r.state.addedRules).toHaveLength(1);
    const again = createDrafts(r.state, "c01", "sponsor", "email", NOW);
    const fresh = again.drafts.filter((x) => x.status === "draft");
    expect(fresh.every((x) => !x.body.includes(preset.phrase))).toBe(true);
    // まだ承認待ちの、古い文面の下書きは、加わったルールで止まる
    const old = { ...d, body: d.body };
    expect(checkOf(again, old).pass).toBe(false);
  });
  it("修正して承認は、本文を直していなければできない。理由も必要", () => {
    const { s, d } = flow();
    expect(decide(s, d.id, { kind: "approve_edit", humanMs: 1 }, NOW).ok).toBe(false);
    expect(decide(s, d.id, { kind: "approve_edit", body: d.body.replace("ご提案できれば", "ご相談できれば"), humanMs: 1 }, NOW).ok).toBe(false);
    expect(decide(s, d.id, { kind: "approve_edit", body: d.body.replace("ご提案できれば", "ご相談できれば"), reasonId: "pushy", humanMs: 1 }, NOW).ok).toBe(true);
  });
  it("返信を受け取ると、送った会社の追いかけが止まり、配信停止とお断りは除外リストに入る", () => {
    const { s, d } = flow();
    const a = send(decide(s, d.id, { kind: "approve", humanMs: 1 }, NOW).state, d.id, NOW).state;
    const r = receiveReplies(a, NOW);
    expect(r.replies).toHaveLength(12);
    expect(r.replies![0].companyId).toBe("c01");
    expect(r.sends[0].followUps.every((f) => f.status === "stopped")).toBe(true);
    expect(r.exclusions.map((e) => e.reason).sort()).toEqual(["declined", "unsubscribed"]);
  });
  it("効果測定の数字は、送付と返信で変わる", () => {
    const { s, d } = flow();
    const before = metricsOf(s);
    const a = send(decide(s, d.id, { kind: "approve", humanMs: 1 }, NOW).state, d.id, NOW).state;
    const after = metricsOf(receiveReplies(a, NOW));
    expect(after.sends).toBe(before.sends + 1);
    expect(after.replies).toBe(12);
    expect(after.positive).toBe(7);
  });
  it("壊れた保存データは、初期の状態として読む", () => {
    expect(parseState("{壊れた").drafts).toEqual([]);
    expect(parseState(JSON.stringify({ v: 9 })).v).toBe(1);
  });
  it("効果測定：返信率と前向きな返信の率", () => {
    const m = computeMetrics(
      [{ id: "a", companyId: "c", business: "sponsor", channel: "email", variant: "A", edited: true, aiSec: 10, humanSec: 50, demo: true }, { id: "b", companyId: "c", business: "video", channel: "form", variant: "B", edited: false, aiSec: 20, humanSec: 70, demo: true }],
      [{ replyId: "r", sendId: "a", category: "interested" }],
    );
    expect([m.replyRate, m.positiveRate, m.editRate, m.aiSec, m.totalSec]).toEqual([50, 50, 50, 15, 75]);
  });
});
