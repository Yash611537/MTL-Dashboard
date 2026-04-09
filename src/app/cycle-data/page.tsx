import { Header } from "@/components/header";
import { SessionTable } from "@/components/SessionTable";

export default function CycleDataPage() {
  return (
    <>
      <Header
        title="Cycle Data"
        subtitle="Session logs from the CYCLE_DATA Firestore collection."
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <SessionTable />
      </main>
    </>
  );
}
