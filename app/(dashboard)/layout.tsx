import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
