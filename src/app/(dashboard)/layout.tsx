import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getUserNotifications } from "@/server/actions/announcements";
import { Role } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const userRole: Role = session.role || "SUPER_ADMIN";
  const userName = session.name || "Administrator";

  const { unreadCount } = await getUserNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:block">
      {/* Sidebar */}
      <Sidebar userRole={userRole} userName={userName} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
        <Header currentRole={userRole} userName={userName} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20 print:p-0 print:overflow-visible print:bg-white print:block">
          <div className="max-w-7xl mx-auto space-y-6 print:max-w-full print:m-0 print:p-0 print:space-y-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
