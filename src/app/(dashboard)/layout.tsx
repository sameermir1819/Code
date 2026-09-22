import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RouteProgressBar } from "@/components/layout/route-progress-bar";
import { RealtimeListener } from "@/components/layout/realtime-listener";
import { getAllCampuses, getActiveCampus } from "@/server/actions/campus";
import { db } from "@/lib/db";
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

  // Strictly block students from accessing backend admin layout
  if (session.role === "STUDENT") {
    redirect("/portal");
  }

  const userRole: Role = session.role || "SUPER_ADMIN";
  const userName = session.name || "Administrator";

  // Fetch unread count + campuses + active campus in parallel
  const [unreadCount, campuses, activeCampus] = await Promise.all([
    db.notification.count({
      where: { userId: session.id, isRead: false },
    }),
    getAllCampuses(),
    getActiveCampus(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:block font-poppins">
      <RouteProgressBar />
      <RealtimeListener />
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        logoUrl={activeCampus?.logoUrl || "/logo.png"}
        instituteName={activeCampus?.name || "Futurex Learning"}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
        <Header
          currentRole={userRole}
          userName={userName}
          unreadCount={unreadCount}
          campuses={campuses}
          activeCampus={activeCampus}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20 print:p-0 print:overflow-visible print:bg-white print:block">
          <div key={activeCampus?.id || "campus-root"} className="max-w-7xl mx-auto space-y-6 print:max-w-full print:m-0 print:p-0 print:space-y-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
