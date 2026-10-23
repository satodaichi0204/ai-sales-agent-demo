// AI社員の設計図：全15段階を、役割ごとのAI社員と共通の土台に分ける（事業の違いは手引きで切り替える）
export const STAGES: { no: string; name: string; owner: string }[] = [
  { no: "00", name: "プラットフォームの運営", owner: "platform" },
  { no: "01", name: "集客（インバウンド）", owner: "marketing" },
  { no: "02", name: "営業準備", owner: "sales" },
  { no: "03", name: "アプローチ", owner: "sales" },
  { no: "04", name: "商談", owner: "sales" },
  { no: "05", name: "提案・見積", owner: "proposal" },
  { no: "06", name: "受注・契約", owner: "proposal" },
  { no: "07", name: "企画・準備", owner: "production" },
  { no: "08", name: "制作・実行", owner: "production" },
  { no: "09", name: "納品・報告", owner: "production" },
  { no: "10", name: "請求・入金", owner: "accounting" },
  { no: "11", name: "継続・追加提案", owner: "support" },
  { no: "12", name: "顧客対応", owner: "support" },
  { no: "13", name: "社内管理", owner: "accounting" },
  { no: "14", name: "土台（AI社員の仕組み）", owner: "base" },
];

export type Agent = { id: string; name: string; stages: string; does: string[]; approve: string[]; demo?: boolean; color: string };
export const AGENTS: Agent[] = [
  { id: "sales", name: "営業", stages: "02、03、04の準備", does: ["狙う相手の採点と営業リスト", "出典つきの下調べ", "連絡文の下書き（メール、フォーム、DM、電話のメモ）", "送付と追いかけ、返信の仕分け、効果測定", "商談の資料と議事録の下書き"], approve: ["狙う相手の最終決定", "送付の前（すべての連絡文）"], demo: true, color: "#2459a6" },
  { id: "marketing", name: "集客", stages: "01", does: ["記事とSNS投稿の下書き", "問い合わせの一次対応の下書き"], approve: ["公開する記事", "広告の出稿"], color: "#2f6f4f" },
  { id: "proposal", name: "提案・契約", stages: "05、06", does: ["提案書と見積の下書き", "契約書のひな形への差し込み"], approve: ["見積", "契約書", "前金の請求"], color: "#8a5a00" },
  { id: "production", name: "制作の補助", stages: "07、08、09", does: ["企画書、撮影の段取り、台本の下書き", "納品の報告書の下書き"], approve: ["納品物の品質の最終確認", "公開"], color: "#9b3d6b" },
  { id: "accounting", name: "経理", stages: "10、13", does: ["請求書の作成、入金の照合", "社内の書類の整理"], approve: ["請求の送付", "支払い"], color: "#5b6676" },
  { id: "support", name: "顧客対応", stages: "11、12", does: ["問い合わせの分類と返答の下書き", "継続・追加提案の時期のお知らせ"], approve: ["クレームへの返答", "紹介の依頼"], color: "#00727a" },
  { id: "platform", name: "プラットフォームの運営", stages: "00", does: ["登録内容の確認、お知らせの下書き"], approve: ["規約や公開に関わる判断"], color: "#6a5acd" },
];

export const BASE = {
  name: "共通の土台（14）",
  parts: ["ナレッジ（共通のルール＋事業ごとの手引き）", "承認待ちの集約（すべての承認がここに集まる）", "品質の検査（出典、誇大な表現、規約）", "ツール同士のデータの連携", "動作の記録と利用料の見張り"],
};

export const NOT_AUTOMATED = [
  "契約の締結",
  "支払い",
  "クレームの最終判断",
  "アスリートやタレントの評判に関わる判断",
  "AIでの映像の生成での、アスリートやタレントの肖像の使用（権利の確認が必要）",
  "SNSのDMの自動送信",
];

export const WHY = [
  { title: "役割ごとに分ける", text: "「営業」「経理」のように、人の職種と同じ単位で分けると、任せる範囲と、承認する人がはっきりする。" },
  { title: "事業の違いは手引きで切り替える", text: "スポンサー営業、動画、SNSで、AI社員を3体作らない。共通のルール＋事業ごとの手引きを差し替えるだけで、新しい事業にも広げられる。" },
  { title: "承認と検査は土台に集める", text: "すべてのAI社員の承認待ちと品質の検査を1か所に集め、人が見る場所を1つにする。修正の理由は手引きに戻り、全員が賢くなる。" },
];
