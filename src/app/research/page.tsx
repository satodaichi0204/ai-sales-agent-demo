import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Research";

export const metadata: Metadata = { title: "下調べ" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
