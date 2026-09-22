import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Mail, Phone, BookOpen, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await db.teacher.findMany({
    orderBy: { name: "asc" },
    include: {
      subjects: { include: { subject: true } },
      batches: { include: { batch: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faculty & Instructors</h1>
        <p className="text-sm text-muted-foreground">
          Teaching staff profiles, academic specializations, and assigned batches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teachers.map((t) => (
          <Card key={t.id} className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {t.name.replace("Dr. ", "").replace("Er. ", "").replace("Prof. ", "").charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">{t.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-semibold font-mono">{t.teacherId}</p>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">
                  {t.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                <div>
                  <span className="text-muted-foreground">Qualification: </span>
                  <strong className="text-foreground">{t.qualification || "-"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Specialization: </span>
                  <strong className="text-primary">{t.specialization || "-"}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-foreground" />
                  <span>{t.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 text-foreground" />
                  <span>{t.email}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold block mb-1 text-muted-foreground">Batches Assigned:</span>
                <div className="flex flex-wrap gap-1.5">
                  {t.batches.map((b) => (
                    <span
                      key={b.id}
                      className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium"
                    >
                      {b.batch.name}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

