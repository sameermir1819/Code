import { getCourses } from "@/server/actions/academics";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Layers, Users, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Management</h1>
          <p className="text-sm text-muted-foreground">
            Curriculum configurations, standard fee schedules, and assigned subjects.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <Card key={c.id} className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-2 font-mono text-[10px]">
                    {c.code}
                  </Badge>
                  <CardTitle className="text-lg font-bold">{c.name}</CardTitle>
                </div>
                <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>
                  {c.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">{c.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Duration:</span>
                  <span className="font-semibold text-foreground">{c.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Standard Fee:</span>
                  <span className="font-semibold text-primary">{formatCurrency(c.standardFee)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Active Batches:</span>
                  <span className="font-semibold text-foreground">{c.batches.length} Batches</span>
                </div>
              </div>

              <div>
                <span className="font-semibold block mb-1 text-muted-foreground">Subjects Covered:</span>
                <div className="flex flex-wrap gap-1.5">
                  {c.subjects.map((cs) => (
                    <span
                      key={cs.id}
                      className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground"
                    >
                      {cs.subject.name}
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

