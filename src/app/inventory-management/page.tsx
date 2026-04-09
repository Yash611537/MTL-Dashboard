import { Header } from "@/components/header";
import { DailyTransfersPanel } from "@/components/daily-transfers-panel";

export default function DailyTransfersPage() {
  return (
    <>
      <Header
        title="Inventory Management"
        subtitle="Add and edit rows — synced live with Firestore."
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <DailyTransfersPanel />
      </main>
    </>
  );
}
