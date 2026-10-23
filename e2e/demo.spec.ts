import { expect, test, type Page } from "@playwright/test";

async function confirmList(page: Page) {
  await page.goto("/list");
  await page.getByRole("button", { name: /リストを確定する/ }).click();
  await expect(page.getByText("確定済み")).toBeVisible();
}
async function draftAndSubmit(page: Page, c = "c01", ch = "email") {
  await page.goto(`/drafts?c=${c}&ch=${ch}`);
  await page.getByRole("button", { name: /下書きを作る/ }).click();
  await expect(page.getByTestId("check-verdict")).toHaveText("承認待ちに回せます");
  await page.getByRole("button", { name: "承認待ちへ回す" }).click();
  await expect(page.getByRole("status")).toContainText("承認待ちに回しました");
}
const kpi = (page: Page, label: string) => page.getByTestId("kpis").locator("div.card", { hasText: label }).locator(".text-3xl");

test("通しの流れ：条件 → リスト → 下調べ → 下書き → 品質チェック → 承認 → 送付 → 返信の仕分け → 効果測定の数字が変わる", async ({ page }) => {
  await page.goto("/metrics");
  await expect(kpi(page, "送付数")).toHaveText("48件");
  await expect(kpi(page, "返信率")).toHaveText("0%");

  await page.goto("/targets");
  await expect(page.getByText("手引きの初期値（スポンサー）")).toBeVisible();
  await page.getByRole("button", { name: /この条件で営業リストを作る/ }).click();
  await expect(page).toHaveURL(/\/list/);
  await page.getByRole("button", { name: /リストを確定する/ }).click();

  await page.goto("/research?c=c01");
  await page.getByRole("button", { name: "出典2を開く" }).first().click();
  await expect(page.getByTestId("source-panel")).toContainText("スパークリングゆず（架空）』を全国で発売した");
  await page.getByRole("link", { name: /この会社の連絡文を作る/ }).click();

  await page.getByRole("button", { name: /下書きを作る/ }).click();
  await expect(page.getByRole("tab", { name: /A：相手の出来事から書き出す/ })).toBeVisible();
  await expect(page.getByTestId("highlighted").locator("mark.good").first()).toContainText("スパークリングゆず");
  await page.getByRole("button", { name: "承認待ちへ回す" }).click();

  await page.goto("/approvals");
  await page.getByRole("button", { name: "このまま承認" }).click();
  await expect(page.getByTestId("approval-msg")).toContainText("承認しました");

  await page.goto("/outbox");
  await page.getByRole("button", { name: "送付する（再現）" }).click();
  await expect(page.getByTestId("send-msg")).toContainText("実際には送信していません");
  await expect(page.getByTestId("followup")).toHaveText(["予定", "予定"]);

  await page.goto("/replies");
  await page.getByRole("button", { name: /返信を受け取る/ }).click();
  await expect(page.getByTestId("replies").locator("tbody tr")).toHaveCount(12);
  await expect(page.getByText("デモで送った1件に返信が届き")).toBeVisible();

  await page.goto("/outbox");
  await expect(page.getByTestId("followup")).toHaveText(["停止（返信あり）", "停止（返信あり）"]);

  await page.goto("/metrics");
  await expect(kpi(page, "送付数")).toHaveText("49件");
  await expect(kpi(page, "返信率")).toHaveText("24.5%");
  await expect(kpi(page, "前向きな返信の率")).toHaveText("14.3%");
});

test("問題のある下書き（No.1、配信停止の案内なし、会社名の取り違え、DMの自動送信）は、承認待ちに進めない", async ({ page }) => {
  await page.goto("/check");
  for (const id of ["p1", "p2", "p3", "p4"]) {
    const card = page.getByTestId(`problem-${id}`);
    await expect(card.getByTestId("check-panel")).toHaveAttribute("data-pass", "false");
    await expect(card.getByRole("button", { name: /承認待ちへ回す/ })).toBeDisabled();
  }
  await expect(page.getByTestId("problem-p1").locator("mark.flag").first()).toBeVisible();
  await expect(page.getByTestId("problem-p1").getByTestId("issues")).toContainText("No.1");
  await expect(page.getByTestId("problem-p2").getByTestId("issues")).toContainText("配信停止の方法の案内がありません");
  await expect(page.getByTestId("problem-p3").getByTestId("issues")).toContainText("ほかの会社の名前");
  await expect(page.getByTestId("problem-p4").getByTestId("issues")).toContainText("DMを自動で送る設定");
});

test("書き直して「業界No.1」や出典のない数字を入れると止まり、直すと回せるようになる", async ({ page }) => {
  await confirmList(page);
  await page.goto("/drafts?c=c01&ch=email");
  await page.getByRole("button", { name: /下書きを作る/ }).click();
  const body = page.getByLabel("本文", { exact: false }).first();
  const original = await body.inputValue();
  await body.fill(original.replace("はじめてご連絡いたします。", "はじめてご連絡いたします。弊社は業界No.1です。貴社は昨年、売上が2倍になったと伺いました。"));
  await expect(page.getByTestId("check-verdict")).toContainText("止める項目が");
  await expect(page.getByRole("button", { name: "承認待ちへ回す" })).toBeDisabled();
  await expect(page.getByTestId("issues")).toContainText("出典と結び付かない");
  await body.fill(original);
  await expect(page.getByTestId("check-verdict")).toHaveText("承認待ちに回せます");
  await expect(page.getByRole("button", { name: "承認待ちへ回す" })).toBeEnabled();
});

test("DMは下書きまで：送付のボタンが出ず、人が手で送った記録だけができる", async ({ page }) => {
  await confirmList(page);
  await page.goto("/drafts?c=c01&ch=dm");
  await expect(page.getByTestId("dm-note")).toContainText("DMは下書きまで");
  await page.getByRole("button", { name: /下書きを作る/ }).click();
  await page.getByRole("button", { name: "承認待ちへ回す" }).click();
  await page.goto("/approvals");
  await page.getByRole("button", { name: "このまま承認" }).click();
  await page.goto("/outbox");
  const item = page.locator('[data-testid="approved-item"][data-channel="dm"]');
  await expect(item).toBeVisible();
  await expect(item.getByRole("button", { name: "送付する（再現）" })).toHaveCount(0);
  await expect(item).toContainText("DMは自動で送りません");
  await item.getByRole("button", { name: /人が送ったことを記録する/ }).click();
  await expect(page.getByTestId("send-msg")).toContainText("人が手で送ったことを記録しました");
});

test("差し戻しの理由がナレッジに記録され、次の下書きに反映される", async ({ page }) => {
  await confirmList(page);
  await draftAndSubmit(page);
  await page.goto("/approvals");
  await expect(page.getByTestId("approval-detail").getByLabel("本文")).toHaveValue(/トップアスリートが多数所属する/);
  await page.getByLabel("理由", { exact: true }).selectOption("too_strong");
  await expect(page.getByLabel("今後使わない表現")).toHaveValue("トップアスリートが多数所属する");
  await page.getByRole("button", { name: "差し戻し" }).click();
  await expect(page.getByTestId("approval-msg")).toContainText("手引きにルールを追加しました");

  await page.goto("/knowledge");
  await expect(page.getByTestId("added-rules-section")).toContainText("承認の修正から追加");
  await expect(page.getByTestId("added-rules-section")).toContainText("トップアスリートが多数所属する");

  // 残っている古い案は、加わったルールで止まる
  await page.goto("/drafts?c=c01&ch=email");
  await page.getByRole("tab", { name: /B：こちらの強みから書き出す/ }).click();
  await expect(page.getByTestId("check-verdict")).toContainText("止める項目が");
  await expect(page.getByTestId("issues")).toContainText("承認の修正から追加したルール");
  // 作り直すと、言い換えた文になる
  await page.getByRole("button", { name: "作り直す" }).click();
  const body = page.getByLabel("本文", { exact: false }).first();
  await expect(body).not.toHaveValue(/トップアスリートが多数所属する/);
  await expect(body).toHaveValue(/陸上やバスケットボールなどの選手が所属する/);
  await expect(page.getByTestId("check-verdict")).toHaveText("承認待ちに回せます");
});

test("修正して承認は、本文を直し、理由を選んだときだけできる", async ({ page }) => {
  await confirmList(page);
  await draftAndSubmit(page);
  await page.goto("/approvals");
  const detail = page.getByTestId("approval-detail");
  await expect(detail.getByRole("button", { name: "修正して承認" })).toBeDisabled();
  const body = detail.getByLabel("本文");
  await body.fill((await body.inputValue()).replace("ご提案できればと考えております", "ご相談できればと考えております"));
  await expect(detail.getByRole("button", { name: "このまま承認" })).toBeDisabled();
  await expect(detail.getByRole("button", { name: "修正して承認" })).toBeDisabled();
  await detail.getByLabel("理由", { exact: true }).selectOption("pushy");
  await detail.getByRole("button", { name: "修正して承認" }).click();
  await page.goto("/outbox");
  await expect(page.getByTestId("approved-item")).toContainText("人が修正");
});

test("返信の仕分け：12件を分類し、配信停止とお断りは除外リストに入り、営業リストから消える", async ({ page }) => {
  await page.goto("/replies");
  await page.getByRole("button", { name: /返信を受け取る/ }).click();
  const counts = page.getByTestId("reply-counts");
  for (const t of ["興味あり 3件", "資料がほしい 2件", "日程の調整 2件", "担当者が違う 1件", "今は不要 2件", "お断り 1件", "配信停止 1件"]) await expect(counts).toContainText(t);
  const ex = page.getByTestId("exclusions").locator("li");
  await expect(ex).toHaveCount(2);
  const unsubscribed = (await page.locator('[data-category="unsubscribe"] td').first().locator(".font-bold").textContent())!;
  await page.goto("/list");
  await expect(page.getByTestId("excluded")).toContainText(unsubscribed);
  await expect(page.getByTestId("excluded")).toContainText("配信停止（返信から自動で追加）");
  await expect(page.getByTestId("ranked")).not.toContainText(unsubscribed);
});

test("営業リスト：採点の理由を表示し、取引中、断られた、配信停止、重複の会社は自動で外す", async ({ page }) => {
  await page.goto("/list");
  await expect(page.getByTestId("ranked").locator("tr[data-id=c01]")).toContainText("スパークリングゆず");
  const ex = page.getByTestId("excluded");
  await expect(ex.locator("tr[data-id=c05]")).toContainText("取引中");
  await expect(ex.locator("tr[data-id=c06]")).toContainText("過去に断られた");
  await expect(ex.locator("tr[data-id=c07]")).toContainText("配信停止");
  await expect(ex.locator("tr[data-id=c18]")).toContainText("重複");
  await expect(page.getByTestId("ranked").locator("tr[data-id=c05]")).toHaveCount(0);
});

test("下調べ：すべての記述に出典があり、出典を押すと元の文が見られる", async ({ page }) => {
  await page.goto("/research?c=c21");
  const rows = page.getByTestId("research-card").locator("dd");
  const n = await rows.count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < n; i++) await expect(rows.nth(i).getByRole("button", { name: /出典\d+を開く/ }).first()).toBeVisible();
  await rows.nth(1).getByRole("button").first().click();
  await expect(page.getByTestId("source-panel")).toContainText("前年の2倍となる20人");
  await expect(page.getByTestId("source-panel")).toContainText("架空のURL");
});

test("すべての画面に「AIがすること」と「人が確認すること」の枠と、モードの表示がある", async ({ page }) => {
  for (const path of ["/", "/targets", "/list", "/research", "/drafts", "/check", "/approvals", "/outbox", "/replies", "/metrics", "/knowledge", "/blueprint", "/logs"]) {
    await page.goto(path);
    await expect(page.getByTestId("rolebox"), path).toBeVisible();
    await expect(page.getByTestId("rolebox")).toContainText("AIがすること");
    await expect(page.getByTestId("rolebox")).toContainText("人が確認すること");
    await expect(page.getByTestId("mode")).toHaveText("見本モード（APIキー不要）");
  }
});

test("AI社員の設計図：15段階、7体のAI社員、共通の土台、自動化しないもの", async ({ page }) => {
  await page.goto("/blueprint");
  await expect(page.getByTestId("stages").locator("li")).toHaveCount(15);
  await expect(page.getByTestId("agents").getByRole("heading", { name: /^AI社員：/ })).toHaveCount(7);
  await expect(page.getByText("共通の土台（14）")).toBeVisible();
  await expect(page.getByText("SNSのDMの自動送信").first()).toBeVisible();
});

test("初期の状態に戻すと、操作の記録が消える", async ({ page }) => {
  await confirmList(page);
  await draftAndSubmit(page);
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "初期の状態に戻す" }).click();
  await page.goto("/approvals");
  await expect(page.getByText("承認待ちの下書きはありません")).toBeVisible();
  await page.goto("/logs");
  await expect(page.getByText("まだ記録はありません")).toBeVisible();
});
