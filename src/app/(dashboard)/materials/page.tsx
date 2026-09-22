import { getStudyMaterials } from "@/server/actions/materials";
import { getCurrentUser } from "@/server/actions/auth";
import { db } from "@/lib/db";
import { MaterialsManager } from "@/components/materials/materials-manager";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [materials, user, subjects] = await Promise.all([
    getStudyMaterials(),
    getCurrentUser(),
    db.subject.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const userRole = user?.role || "STUDENT";

  return (
    <MaterialsManager
      initialMaterials={materials}
      subjects={subjects}
      userRole={userRole}
    />
  );
}
