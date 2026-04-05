import { Header } from "@/components/header";
import { CompanyHoursPanel } from "@/components/company-hours-panel";

export default function CompanyHoursPage() {
  return (
    <>
      <Header
        title="Company Hours"
        subtitle="Day-wise totals per company from the SD_CARDS collection — live from Firestore."
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <CompanyHoursPanel />
      </main>
    </>
  );
}
