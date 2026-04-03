import { ProtectedRoute } from "@/components/protected-route";

export default function SdCardsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
