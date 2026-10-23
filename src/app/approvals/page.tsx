import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Approvals";

export const metadata: Metadata = { title: "承認待ち" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
