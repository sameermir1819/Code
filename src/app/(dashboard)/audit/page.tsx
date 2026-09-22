import { getAuditLogs } from "@/server/actions/reports";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await getAuditLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Immutable event stream capturing administrative, financial, and authentication operations.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">Audit Trail ({logs.length} events)</CardTitle>
          <CardDescription className="text-xs">Immutable system records with user and timestamp tracking</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-3 pl-4">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3 pr-4">Details & Event Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{log.userName || "System"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{log.userRole}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium text-foreground">{log.entity}</td>
                    <td className="p-3 pr-4 text-muted-foreground text-[11px] leading-relaxed">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

