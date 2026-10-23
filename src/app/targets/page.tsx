import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/Targets";

export const metadata: Metadata = { title: "狙う相手を決める" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
