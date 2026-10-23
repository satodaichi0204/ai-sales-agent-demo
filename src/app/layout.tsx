import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700", "900"], variable: "--font-noto", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AI営業社員（デモ）", template: "%s｜AI営業社員（デモ）" },
  description: "狙う相手を決め、下調べ、連絡文の下書き、品質チェック、人の承認、送付と追いかけ、返信の仕分け、効果測定までを行うAI営業社員のデモ。データはすべて架空。",
  robots: { index: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
