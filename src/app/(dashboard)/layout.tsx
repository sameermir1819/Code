import { getSession, getEffectivePermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RouteProgressBar } from "@/components/layout/route-progress-bar";
import { RealtimeListener } from "@/components/layout/realtime-listener";
import { getActiveCampus, getAllCampuses } from "@/server/actions/campus";
import { db } from "@/lib/db";
import { Role } from "@/lib/permissions";
import { PermissionProvider } from "@/components/layout/permission-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Strictly block students from accessing backend admin layout
  if (session.role === "STUDENT") {
    redirect("/portal");
  }

  const userRole: Role = session.role || "SUPER_ADMIN";
  const userName = session.name || "Administrator";
  const permissions = await getEffectivePermissions(session);

  // Fetch unread count and active campus in parallel
  const [unreadCount, activeCampus, campuses] = await Promise.all([
    db.notification.count({
      where: { userId: session.id, isRead: false },
    }),
    getActiveCampus(),
    getAllCampuses(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:block font-poppins">
      <RouteProgressBar />
      <RealtimeListener />
      {/* Sidebar */}
      <Sidebar
        permissions={permissions}
        userRole={userRole}
        userName={userName}
        logoUrl={activeCampus?.logoUrl || "/logo.png"}
        instituteName={activeCampus?.name || "Futurex Learning"}
      />

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
        <Header
          currentRole={userRole}
          userName={userName}
          unreadCount={unreadCount}
          campuses={campuses.filter(
            (campus) => !session.instituteId || session.role === "SUPER_ADMIN" || campus.id === session.instituteId
          )}
          activeCampus={activeCampus}
        />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-muted/20 print:p-0 print:overflow-visible print:bg-white print:block">
          <PermissionProvider permissions={permissions}><div key={activeCampus?.id || "campus-root"} className="max-w-7xl mx-auto space-y-6 print:max-w-full print:m-0 print:p-0 print:space-y-0">{children}</div></PermissionProvider>
        </main>
      </div>
    </div>
  );
}
