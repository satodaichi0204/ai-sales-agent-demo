// 02 営業準備：狙う相手の条件で、会社を採点して並べる。除外リストと重複は自動で外す
import { EVENT_LABEL, STATUS_LABEL, type Company, type CompanyEvent, type Conditions } from "./data";

export type Exclusion = { companyId: string; reason: "declined" | "unsubscribed"; at: string; replyId?: string };
export type ScoreParts = { industry: number; events: number; size: number; region: number };
export type Ranked = { company: Company; score: number; parts: ScoreParts; reason: string; matched: CompanyEvent[] };
export type Excluded = { company: Company; reason: string };

const DAY = 86_400_000;
export const formatMonth = (date: string) => {
  const [y, m] = date.split("-");
  return `${y}年${Number(m)}月`;
};

/** 条件に当てはまるか（条件が空なら、すべて当てはまる） */
const inList = (list: string[], v: string) => list.length === 0 || list.includes(v);

export function scoreCompany(company: Company, cond: Conditions, today: Date): Ranked {
  const matched = company.events
    .filter((e) => cond.triggers.includes(e.type))
    .sort((a, b) => b.date.localeCompare(a.date));
  let events = 0;
  if (matched.length > 0) {
    events = 25 + (matched.length > 1 ? 10 : 0);
    // 最近の出来事（90日以内、または60日以内の予定）は、話しかけるきっかけとして強い
    const diff = (today.getTime() - new Date(matched[0].date).getTime()) / DAY;
    if (diff <= 90 && diff >= -60) events += 5;
  }
  const parts: ScoreParts = {
    industry: inList(cond.industries, company.industry) ? 35 : 0,
    events,
    size: inList(cond.sizes, company.size) ? 15 : 0,
    region: inList(cond.regions, company.region) ? 10 : 0,
  };
  const score = parts.industry + parts.events + parts.size + parts.region;
  const top = matched[0];
  const reason = top
    ? `${EVENT_LABEL[top.type]}（${formatMonth(top.date)}）：${top.short}${matched.length > 1 ? `。ほかに${matched.length - 1}件` : ""}`
    : `条件に合う出来事なし（業種：${company.industry}）`;
  return { company, score, parts, reason, matched };
}

export function rankCompanies(companies: Company[], cond: Conditions, exclusions: Exclusion[], today: Date): { ranked: Ranked[]; excluded: Excluded[] } {
  const excluded: Excluded[] = [];
  const seen = new Map<string, Company>();
  const ranked: Ranked[] = [];
  for (const c of companies) {
    const dup = seen.get(c.domain);
    if (dup) {
      excluded.push({ company: c, reason: `重複（${dup.name}と同じ会社）` });
      continue;
    }
    seen.set(c.domain, c);
    if (c.status !== "new") {
      excluded.push({ company: c, reason: STATUS_LABEL[c.status] });
      continue;
    }
    const ex = exclusions.find((e) => e.companyId === c.id);
    if (ex) {
      excluded.push({ company: c, reason: ex.reason === "unsubscribed" ? "配信停止（返信から自動で追加）" : "お断り（返信から自動で追加）" });
      continue;
    }
    ranked.push(scoreCompany(c, cond, today));
  }
  ranked.sort((a, b) => b.score - a.score || (b.matched[0]?.date ?? "").localeCompare(a.matched[0]?.date ?? "") || a.company.id.localeCompare(b.company.id));
  return { ranked, excluded };
}

/** AIのおすすめ（人が最終決定する前の、初期の選択）：70点以上の上位10社 */
export const recommended = (ranked: Ranked[]) => ranked.filter((r) => r.score >= 70).slice(0, 10).map((r) => r.company.id);
