import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Logs";

export const metadata: Metadata = { title: "動作の記録と利用料" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
