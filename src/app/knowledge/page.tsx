import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Knowledge";

export const metadata: Metadata = { title: "ナレッジ" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
