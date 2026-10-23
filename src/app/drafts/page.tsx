import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Drafts";

export const metadata: Metadata = { title: "連絡文の下書き" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
