import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Metrics";

export const metadata: Metadata = { title: "効果測定" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
