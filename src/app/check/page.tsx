import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Check";

export const metadata: Metadata = { title: "品質チェック" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
