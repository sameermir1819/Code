"use client";

import { useState, useEffect } from "react";
import { getBatches } from "@/server/actions/academics";
import { 
  getMonthlyAttendanceReport, 
  getAttendanceDefaulters 
} from "@/server/actions/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrDeviceTerminal } from "@/components/attendance/qr-device-terminal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Search, AlertTriangle, MessageCircle, BarChart2 } from "lucide-react";

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("qr-terminal");

  useEffect(() => {
    getBatches({ status: "ACTIVE" }).then(setBatches);

    const handleAutoRefresh = () => {
      getBatches({ status: "ACTIVE" }).then(setBatches);
    };

    window.addEventListener("erp-campus-changed", handleAutoRefresh);
    window.addEventListener("erp-data-refresh", handleAutoRefresh);
    return () => {
      window.removeEventListener("erp-campus-changed", handleAutoRefresh);
      window.removeEventListener("erp-data-refresh", handleAutoRefresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gate Attendance Terminal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan student ID cards using your USB or Bluetooth QR scanner.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 h-12 w-full max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="qr-terminal" className="text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <QrCode className="h-4 w-4 text-blue-500" />
            Card Scanner
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <BarChart2 className="h-4 w-4 text-purple-500" />
            Monthly Register
          </TabsTrigger>
          <TabsTrigger value="defaulters" className="text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Defaulters
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="qr-terminal">
            <QrDeviceTerminal />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab batches={batches} />
          </TabsContent>
          <TabsContent value="defaulters">
            <DefaultersTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 2: REPORTS
// ----------------------------------------------------------------------
function ReportsTab({ batches }: { batches: any[] }) {
  const [batchId, setBatchId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    if (!batchId) return;
    setLoading(true);
    try {
      const data = await getMonthlyAttendanceReport(batchId, month, year);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/10">
        <CardTitle className="text-lg">Monthly Attendance Register</CardTitle>
        <CardDescription>View consolidated attendance history</CardDescription>
        <div className="flex flex-wrap gap-3 mt-4">
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">Select Batch...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <input type="number" className="border rounded-md px-3 py-2 text-sm w-24 bg-background" value={year} onChange={e => setYear(parseInt(e.target.value))} />
          <Button onClick={fetchReport} disabled={loading || !batchId}>
            {loading ? "Loading..." : "Generate Register"}
          </Button>
        </div>
      </CardHeader>
      
      {report && (
        <CardContent className="p-0">
          <div className="bg-muted/30 p-4 border-b flex gap-6 text-sm">
            <div><span className="text-muted-foreground">Class:</span> <span className="font-semibold">{report.batchName}</span></div>
            <div><span className="text-muted-foreground">Total Enrolled:</span> <span className="font-semibold">{report.totalStudents}</span></div>
            <div><span className="text-muted-foreground">Average Attendance:</span> <span className="font-semibold">{report.avgPercentage}%</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="p-3 font-medium text-muted-foreground">Student Name</th>
                  <th className="p-3 font-medium text-muted-foreground">ID Code</th>
                  <th className="p-3 font-medium text-muted-foreground">Present</th>
                  <th className="p-3 font-medium text-muted-foreground">Absent</th>
                  <th className="p-3 font-medium text-muted-foreground">Total Days</th>
                  <th className="p-3 font-medium text-muted-foreground">% Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.students.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found for this month.</td></tr>
                ) : report.students.map((s: any) => (
                  <tr key={s.studentId} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3 font-mono text-xs">{s.studentCode}</td>
                    <td className="p-3 text-green-600 font-medium">{s.present}</td>
                    <td className="p-3 text-red-600 font-medium">{s.absent}</td>
                    <td className="p-3">{s.totalDays}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        s.percentage >= 75 ? 'bg-green-100 text-green-800' :
                        s.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------
// TAB 3: DEFAULTERS
// ----------------------------------------------------------------------
function DefaultersTab() {
  const [threshold, setThreshold] = useState(75);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchDefaulters() {
    setLoading(true);
    try {
      const data = await getAttendanceDefaulters(threshold);
      setDefaulters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm border-red-100">
      <CardHeader className="border-b bg-red-50/50">
        <CardTitle className="text-lg text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Shortage Defaulters
        </CardTitle>
        <CardDescription>Identify students with attendance below threshold</CardDescription>
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm font-medium">Minimum Required %:</label>
          <Input 
            type="number" 
            className="w-24 bg-background" 
            value={threshold} 
            onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
          />
          <Button variant="destructive" onClick={fetchDefaulters} disabled={loading}>
            {loading ? "Searching..." : "Find Defaulters"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/20">
            <tr>
              <th className="p-3 font-medium text-muted-foreground">Student</th>
              <th className="p-3 font-medium text-muted-foreground">Batch</th>
              <th className="p-3 font-medium text-muted-foreground">Attendance</th>
              <th className="p-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {defaulters.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No defaulters found at this threshold.</td></tr>
            ) : defaulters.map((d: any) => (
              <tr key={d.studentId} className="hover:bg-muted/10 transition-colors">
                <td className="p-3">
                  <div className="font-semibold text-red-700">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.studentCode}</div>
                </td>
                <td className="p-3">{d.batchName}</td>
                <td className="p-3">
                  <span className="font-bold text-red-600">{d.percentage}%</span>
                  <span className="text-xs text-muted-foreground ml-2">({d.present}/{d.totalDays} days)</span>
                </td>
                <td className="p-3 text-right">
                  <a 
                    href={`https://wa.me/${d.parentPhone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Dear Parent, your ward ${d.name} has only ${d.percentage}% attendance at Futurex Learning. Please ensure regular attendance.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
                      <MessageCircle className="h-4 w-4" />
                      Notify Parent
                    </Button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
