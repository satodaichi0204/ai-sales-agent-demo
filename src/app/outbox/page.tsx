import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Outbox";

export const metadata: Metadata = { title: "送付と追いかけ" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
