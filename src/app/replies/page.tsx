import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Replies";

export const metadata: Metadata = { title: "返信の仕分け" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
