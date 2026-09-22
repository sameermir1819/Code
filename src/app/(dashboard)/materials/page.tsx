import { getStudyMaterials } from "@/server/actions/materials";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BookOpen, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await getStudyMaterials();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Materials & DPPs</h1>
          <p className="text-sm text-muted-foreground">
            Curriculum notes, Daily Practice Problems (DPP), question banks, and reference material.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-xs text-muted-foreground">
            No study materials uploaded yet.
          </Card>
        ) : (
          materials.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {m.fileType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{m.fileSize}</span>
                </div>
                <CardTitle className="text-base font-bold mt-2">{m.title}</CardTitle>
                <CardDescription className="text-xs">{m.description || "Curriculum study notes"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-xs">
                <div className="text-[11px] text-muted-foreground">
                  Subject: <strong className="text-foreground">{m.subject?.name || "All Subjects"}</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t text-[11px]">
                  <span className="text-muted-foreground">Added: {formatDate(m.createdAt)}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

