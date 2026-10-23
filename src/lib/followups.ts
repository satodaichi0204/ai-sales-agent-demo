// 03 アプローチ：送付と追いかけ。追いかけは3営業日後と7日後。返信が来たら止める
export type FollowUp = { label: string; due: string; status: "scheduled" | "stopped" };
export type Send = { id: string; draftId: string; companyId: string; sentAt: string; followUps: FollowUp[] };
export type SendSettings = { dailyCap: number; windowStart: number; windowEnd: number };

/** 送付の時間帯に合わせる（時間帯の前なら開始の時刻、後なら次の日の開始の時刻。土日は月曜へ） */
export function fitWindow(d: Date, s: SendSettings): Date {
  const out = new Date(d);
  if (out.getHours() >= s.windowEnd) {
    out.setDate(out.getDate() + 1);
    out.setHours(s.windowStart, 0, 0, 0);
  } else if (out.getHours() < s.windowStart) {
    out.setHours(s.windowStart, 0, 0, 0);
  }
  while (out.getDay() === 0 || out.getDay() === 6) {
    out.setDate(out.getDate() + 1);
    out.setHours(s.windowStart, 0, 0, 0);
  }
  return out;
}

export function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let left = n;
  while (left > 0) {
    out.setDate(out.getDate() + 1);
    if (out.getDay() !== 0 && out.getDay() !== 6) left--;
  }
  return out;
}

export function scheduleFollowUps(sentAt: Date, s: SendSettings): FollowUp[] {
  const d7 = new Date(sentAt);
  d7.setDate(d7.getDate() + 7);
  return [
    { label: "1回目の追いかけ（3営業日後）", due: fitWindow(addBusinessDays(sentAt, 3), s).toISOString(), status: "scheduled" },
    { label: "2回目の追いかけ（7日後）", due: fitWindow(d7, s).toISOString(), status: "scheduled" },
  ];
}

/** 返信が来た会社の、追いかけの予定を止める */
export function stopFollowUps(sends: Send[], companyId: string): Send[] {
  return sends.map((x) => (x.companyId === companyId ? { ...x, followUps: x.followUps.map((f) => ({ ...f, status: "stopped" as const })) } : x));
}

/** 今日送った数が上限に達しているか */
export function capReached(sends: Send[], now: Date, s: SendSettings): boolean {
  const today = now.toDateString();
  return sends.filter((x) => new Date(x.sentAt).toDateString() === today).length >= s.dailyCap;
}
