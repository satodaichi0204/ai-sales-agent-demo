// 画面で使う写真（ぱくたそ https://www.pakutaso.com/ ）。
// 写真のファイルは再配布が禁止のため、GitHubには上げず public/photos/ に置いて公開先にだけ上げる。
// 人物の写真は、場面のイメージとしてだけ使う（特定の人物として紹介しない）
import type { BusinessId } from "./data";

export type Photo = { src: string; alt: string };
const p = (file: string, alt: string): Photo => ({ src: `/photos/${file}.jpg`, alt });

export const PHOTOS = {
  runAthlete: p("run-athlete", "青空の下を走るアスリート"),
  runFeet: p("run-feet", "ランニングシューズで走る足元"),
  triathlon: p("triathlon", "大会で水しぶきを上げて泳ぐトライアスロンの選手たち"),
  basketball: p("basketball", "ゴールに向かうバスケットボール"),
  court: p("court", "体育館のバスケットボールコート"),
  stadium: p("stadium", "空から見た球場"),
  stretch: p("stretch", "屋外でストレッチをするランナー"),
  videoCamera: p("video-camera", "撮影用に組んだプロ用のビデオカメラ"),
  youtuber: p("youtuber", "撮影機材を持つカメラマン"),
  interview: p("interview", "グリーンバックでのインタビュー撮影"),
  dslr: p("dslr", "一眼レフカメラを持つビジネスパーソン"),
  selfieEvent: p("selfie-event", "イベント会場でスマートフォンを使う女性"),
  phone: p("phone-sofa", "スマートフォンで撮影する女性"),
  meeting: p("meeting", "資料を前に打ち合わせをする会社員"),
  notePc: p("notepc", "ノートパソコンを見ながらメモを取るビジネスパーソン"),
  deskAi: p("desk-ai", "間接照明の下でノートパソコンに向かう手元"),
} satisfies Record<string, Photo>;

export const BUSINESS_PHOTO: Record<BusinessId, Photo> = {
  sponsor: PHOTOS.runAthlete,
  video: PHOTOS.videoCamera,
  sns: PHOTOS.phone,
};

const INDUSTRY: Record<string, Photo> = {
  飲料: p("water", "泡立つミネラルウォーター"),
  食品: p("bread", "焼きたてのパン"),
  スポーツ用品: PHOTOS.runFeet,
  保険: p("building", "見上げたガラス張りのオフィスビル"),
  金融: p("building", "見上げたガラス張りのオフィスビル"),
  フィットネス: p("gym", "トレーニングジムのダンベル"),
  製造: p("vise", "工場の作業台と工具"),
  IT: p("engineer", "コードの画面に向かうエンジニア"),
  介護: p("care", "公園で日光浴をする高齢者と介護士"),
  建設: p("crane", "シルエットで浮かぶタワークレーン"),
  物流: p("logistics", "倉庫で荷物を運ぶフォークリフト"),
  不動産: p("room", "日差しの入る空室のリビング"),
  飲食: p("cafe", "自然光と緑あふれるカフェの店内"),
  美容: p("beauty", "髪をカットする美容師の手元"),
  アパレル: p("shirt", "白い長袖シャツ"),
  小売: p("herbal", "雑貨が並ぶお店の棚"),
  医療: p("clinic", "明るい診療所の待合スペース"),
  宿泊: p("ryokan", "座卓から望む旅館の和室と広縁"),
  菓子: p("wagashi", "練り切りの和菓子"),
  印刷: p("print", "シルクスクリーン印刷の機械"),
  士業: p("docs", "書類が置かれた机"),
  農業: p("tea", "丘に広がる茶畑"),
};
export const industryPhoto = (industry: string): Photo => INDUSTRY[industry] ?? PHOTOS.notePc;

export const PHOTO_CREDIT = "写真：ぱくたそ（www.pakutaso.com）";
