import type { Metadata } from "next";
import Blueprint from "@/views/Blueprint";

export const metadata: Metadata = { title: "AI社員の設計図" };

export default function Page() {
  return <Blueprint />;
}
