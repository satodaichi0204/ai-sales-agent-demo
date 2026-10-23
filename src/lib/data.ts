// 架空のデータの読み込みと、型。データは scripts/make-data.mjs と data/samples/ にある
import companiesJson from "@data/companies.json";
import sourcesJson from "@data/sources.json";
import repliesJson from "@data/replies.json";
import historyJson from "@data/history.json";
import playbooksJson from "@data/playbooks.json";
import researchJson from "@data/samples/research.json";
import problemsJson from "@data/samples/problems.json";

export type BusinessId = "sponsor" | "video" | "sns";
export type Channel = "email" | "form" | "dm" | "phone";
export type EventType = "launch" | "sports" | "youth" | "anniversary" | "region" | "hiring" | "office" | "sns" | "store" | "renewal";
export type CompanyStatus = "new" | "client" | "declined" | "unsubscribed";

export type CompanyEvent = { type: EventType; date: string; short: string; sourceId: string };
export type Company = {
  id: string;
  name: string;
  industry: string;
  size: string;
  region: string;
  summary: string;
  department: string;
  channels: ("email" | "form" | "sns")[];
  status: CompanyStatus;
  domain: string;
  events: CompanyEvent[];
  siteSourceId: string;
};
export type Source = { id: string; companyId: string; kind: "site" | "news" | "recruit" | "sns"; title: string; url: string; date: string; text: string };
export type ReplyCategory = "interested" | "materials" | "schedule" | "wrong_person" | "not_now" | "decline" | "unsubscribe" | "other";
export type Reply = { id: string; expected: ReplyCategory; text: string; person: string };
export type HistoryRow = { id: string; date: string; business: BusinessId; channel: Channel; variant: "A" | "B" | "C"; edited: boolean; aiSec: number; humanSec: number; companyId: string };

export type NgRule = { phrase: string; reason: string; replace: string };
export type Conditions = { industries: string[]; sizes: string[]; regions: string[]; triggers: EventType[] };
export type Playbook = {
  name: string;
  short: string;
  offer: string;
  targets: Conditions;
  strengths: string[];
  angles: Partial<Record<EventType, string>>;
  cta: string;
  ng: NgRule[];
};
export type Sender = { company: string; person: string; department: string; address: string; tel: string; email: string };
export type Limits = { subjectMax: number; emailBodyMax: number; dmBodyMax: number; sentenceMax: number };
export type ReasonPreset = { id: string; label: string; phrase: string; replace: string; sentenceMax?: number };
export type Playbooks = {
  sender: Sender;
  common: { name: string; tone: string[]; emailFooter: string; senderRule: string; ng: NgRule[]; limits: Limits };
  businesses: Record<BusinessId, Playbook>;
  reasons: ReasonPreset[];
};
export type Statement = { label: string; text: string; sources: string[] };
export type SampleResearch = { business: BusinessId; statements: Statement[]; hooks: string[]; proposal: string; subject: string };
export type ProblemDraft = { id: string; title: string; companyId: string; business: BusinessId; channel: Channel; sendMode: "manual" | "auto"; subject: string; body: string };

export const COMPANIES = companiesJson as Company[];
export const SOURCES = sourcesJson as Source[];
export const REPLIES = repliesJson as Reply[];
export const HISTORY = historyJson as HistoryRow[];
export const PLAYBOOKS = playbooksJson as unknown as Playbooks;
export const SAMPLES = researchJson as unknown as Record<string, SampleResearch>;
export const PROBLEMS = problemsJson as ProblemDraft[];

export const BUSINESS_IDS: BusinessId[] = ["sponsor", "video", "sns"];
export const companyById = (id: string) => COMPANIES.find((c) => c.id === id);
export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
export const sourcesOf = (companyId: string) => SOURCES.filter((s) => s.companyId === companyId);

export const EVENT_LABEL: Record<EventType, string> = {
  launch: "新商品・新サービスの発表",
  sports: "スポーツへの協賛・支援",
  youth: "若い世代への発信",
  anniversary: "周年",
  region: "地域への貢献",
  hiring: "採用の強化",
  office: "新しい拠点",
  sns: "SNSの開設",
  store: "新しいお店の開業",
  renewal: "リニューアル",
};
export const CHANNEL_LABEL: Record<Channel, string> = { email: "メール", form: "問い合わせフォーム", dm: "SNSのDM", phone: "電話" };
export const SIZE_LABEL: Record<string, string> = { "1-10": "1〜10人", "10-50": "10〜50人", "50-300": "50〜300人", "300-1000": "300〜1,000人", "1000+": "1,000人以上" };
export const SIZES = Object.keys(SIZE_LABEL);
export const INDUSTRIES = [...new Set(COMPANIES.map((c) => c.industry))];
export const REGIONS = [...new Set(COMPANIES.map((c) => c.region))];
export const STATUS_LABEL: Record<CompanyStatus, string> = { new: "未接触", client: "取引中", declined: "過去に断られた", unsubscribed: "配信停止" };

/** 会社名から「株式会社」と「（架空）」を除いた、本文で使う短い名前 */
export const shortName = (name: string) => name.replace(/株式会社|（架空）/g, "").trim();
const PERSON_TITLES = ["店主", "女将", "オーナー", "代表", "店長", "所長", "マネージャー", "事務長"];
/** 宛名の2行目（「人事部 ご担当者様」「店主様」） */
export const addressee = (department: string) => (PERSON_TITLES.includes(department) ? `${department}様` : `${department} ご担当者様`);
/** お店や個人の事業か（本文で「貴社」と書かない） */
export const isShop = (department: string) => PERSON_TITLES.includes(department);
