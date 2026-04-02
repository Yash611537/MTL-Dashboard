import { Header } from "@/components/header";
import { SdCardsPanel } from "@/components/sd-cards-panel";

export default function SdCardsPage() {
  return (
    <>
      <Header
        title="SD-Cards"
        subtitle="Live data from Firestore — search, sort, and paginate below."
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <SdCardsPanel />
      </main>
    </>
  );
}
