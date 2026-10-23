import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";
import View from "@/views/SalesList";

export const metadata: Metadata = { title: "営業リスト" };

export default function Page() {
  return (
    <ClientOnly>
      <View />
    </ClientOnly>
  );
}
