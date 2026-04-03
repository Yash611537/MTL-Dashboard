import { ProtectedRoute } from "@/components/protected-route";

export default function DailyTransfersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
