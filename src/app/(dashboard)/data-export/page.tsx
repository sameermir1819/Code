"use client";

import { useState, useEffect } from "react";
import {
  exportStudentsCSV,
  exportPaymentsCSV,
  exportDefaultersCSV,
  exportBatchesCSV,
  exportLeadsCSV,
  exportFullBackupJSON,
} from "@/server/actions/export";
import { getCampuses, getActiveCampusId } from "@/server/actions/campus";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  Database,
  Users,
  CreditCard,
  AlertCircle,
  Layers,
  PhoneCall,
  CheckCircle2,
  Building2,
  HardDriveDownload,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function DataExportPage() {
  const [activeCampus, setActiveCampus] = useState<{ id: string; name: string } | null>(null);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<{ name: string; count?: number; time: string } | null>(null);

  // Load active campus context
  const loadCampusContext = async () => {
    try {
      const [campuses, currentId] = await Promise.all([
        getCampuses(),
        getActiveCampusId(),
      ]);

      if (currentId === "ALL") {
        setActiveCampus({ id: "ALL", name: "All Campuses (Global)" });
      } else {
        const found = campuses.find((c) => c.id === currentId);
        setActiveCampus(found ? { id: found.id, name: found.name } : { id: "ALL", name: "All Campuses" });
      }
    } catch {
      setActiveCampus({ id: "ALL", name: "All Campuses" });
    }
  };

  useEffect(() => {
    loadCampusContext();

    const handleCampusChange = () => {
      loadCampusContext();
    };
    window.addEventListener("erp-campus-changed", handleCampusChange);
    return () => window.removeEventListener("erp-campus-changed", handleCampusChange);
  }, []);

  // Generic helper to trigger browser download
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export Students
  const handleExportStudents = async () => {
    setLoadingExport("students");
    try {
      const res = await exportStudentsCSV();
      if (res.success && res.csv) {
        triggerDownload(res.csv, res.filename, "text/csv;charset=utf-8;");
        setLastDownloaded({ name: "Students Directory", count: res.count, time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to export students data");
    } finally {
      setLoadingExport(null);
    }
  };

  // 2. Export Payments
  const handleExportPayments = async () => {
    setLoadingExport("payments");
    try {
      const res = await exportPaymentsCSV();
      if (res.success && res.csv) {
        triggerDownload(res.csv, res.filename, "text/csv;charset=utf-8;");
        setLastDownloaded({ name: "Payments & Fee Ledger", count: res.count, time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to export payments");
    } finally {
      setLoadingExport(null);
    }
  };

  // 3. Export Defaulters
  const handleExportDefaulters = async () => {
    setLoadingExport("defaulters");
    try {
      const res = await exportDefaultersCSV();
      if (res.success && res.csv) {
        triggerDownload(res.csv, res.filename, "text/csv;charset=utf-8;");
        setLastDownloaded({ name: "Fee Defaulters & Dues", count: res.count, time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to export defaulters list");
    } finally {
      setLoadingExport(null);
    }
  };

  // 4. Export Batches
  const handleExportBatches = async () => {
    setLoadingExport("batches");
    try {
      const res = await exportBatchesCSV();
      if (res.success && res.csv) {
        triggerDownload(res.csv, res.filename, "text/csv;charset=utf-8;");
        setLastDownloaded({ name: "Batches & Courses", count: res.count, time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to export batches");
    } finally {
      setLoadingExport(null);
    }
  };

  // 5. Export Leads
  const handleExportLeads = async () => {
    setLoadingExport("leads");
    try {
      const res = await exportLeadsCSV();
      if (res.success && res.csv) {
        triggerDownload(res.csv, res.filename, "text/csv;charset=utf-8;");
        setLastDownloaded({ name: "Admissions CRM Leads", count: res.count, time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to export CRM leads");
    } finally {
      setLoadingExport(null);
    }
  };

  // 6. Export Full JSON Backup
  const handleExportBackup = async () => {
    setLoadingExport("backup");
    try {
      const res = await exportFullBackupJSON();
      if (res.success && res.json) {
        triggerDownload(res.json, res.filename, "application/json;charset=utf-8;");
        setLastDownloaded({ name: "Full System JSON Backup", time: new Date().toLocaleTimeString() });
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate complete backup");
    } finally {
      setLoadingExport(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Universal Data Extraction & Backup
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Export institute records to Excel-ready CSV sheets or download complete JSON snapshots for safe offline archival.
          </p>
        </div>

        {/* Current Campus Context Badge */}
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl shadow-sm">
          <Building2 className="w-4 h-4 text-primary" />
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px]">EXPORT CONTEXT:</span>
            <span className="font-semibold text-foreground">{activeCampus?.name || "Loading..."}</span>
          </div>
        </div>
      </div>

      {/* ─── Last Downloaded Alert / Notification ───────────── */}
      {lastDownloaded && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Successfully exported <strong>{lastDownloaded.name}</strong>{" "}
              {lastDownloaded.count !== undefined ? `(${lastDownloaded.count} records)` : ""}{" "}
              at {lastDownloaded.time}.
            </span>
          </div>
          <button
            onClick={() => setLastDownloaded(null)}
            className="text-emerald-400/80 hover:text-emerald-300 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Export Cards Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Students */}
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/5">
                CSV / Excel
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Students Directory</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Complete student profiles including enrollment numbers, active batches, courses, parents' contact details, and admission dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md mb-4 border border-border/40 font-mono">
              Columns: Enrollment, Name, Phone, Email, Batch, Course, Parent, Status
            </div>
            <Button
              onClick={handleExportStudents}
              disabled={loadingExport !== null}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2"
            >
              {loadingExport === "students" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Students CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Fee Payments */}
        <Card className="bg-card/50 backdrop-blur border-border hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
                CSV / Excel
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Payments & Fee Ledger</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Detailed chronological fee receipts, payment modes (Cash, UPI, Cheque), reference UTR numbers, and collection staff details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md mb-4 border border-border/40 font-mono">
              Columns: Receipt ID, Student, Campus, Batch, Amount, Mode, UTR, Date
            </div>
            <Button
              onClick={handleExportPayments}
              disabled={loadingExport !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2"
            >
              {loadingExport === "payments" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting Ledger...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Payments CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Fee Defaulters */}
        <Card className="bg-card/50 backdrop-blur border-border hover:border-amber-500/50 transition-all shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/5">
                CSV / Excel
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Fee Defaulters & Dues</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Actionable list of all students with pending fee installments, outstanding amounts, overdue dates, and guardian contact numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md mb-4 border border-border/40 font-mono">
              Columns: Student, Phone, Parent, Total Fee, Paid, Due Amount, Due Date
            </div>
            <Button
              onClick={handleExportDefaulters}
              disabled={loadingExport !== null}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center justify-center gap-2"
            >
              {loadingExport === "defaulters" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compiling Defaulters...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Defaulters CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Batches & Academics */}
        <Card className="bg-card/50 backdrop-blur border-border hover:border-purple-500/50 transition-all shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/5">
                CSV / Excel
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Batches & Academics</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Active academic batches, mapped courses, campus associations, student intake capacity, and enrollment numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md mb-4 border border-border/40 font-mono">
              Columns: Batch Code, Name, Course, Campus, Active Count, Max Capacity
            </div>
            <Button
              onClick={handleExportBatches}
              disabled={loadingExport !== null}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center justify-center gap-2"
            >
              {loadingExport === "batches" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting Batches...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Batches CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 5: Admissions CRM Leads */}
        <Card className="bg-card/50 backdrop-blur border-border hover:border-sky-500/50 transition-all shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-sky-500/40 text-sky-400 bg-sky-500/5">
                CSV / Excel
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Admissions CRM Leads</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              All prospective inquiries, walk-ins, phone queries, counselor logs, priority ratings, and next follow-up dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md mb-4 border border-border/40 font-mono">
              Columns: Lead ID, Name, Phone, Source, Stage, Priority, Counselor, Due Date
            </div>
            <Button
              onClick={handleExportLeads}
              disabled={loadingExport !== null}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center justify-center gap-2"
            >
              {loadingExport === "leads" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting CRM Data...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Download CRM Leads CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 6: Complete Institution JSON Backup */}
        <Card className="bg-card/50 backdrop-blur border-primary/40 hover:border-primary transition-all shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg border-b border-l border-primary/30">
            FULL SNAPSHOT
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                JSON Dump
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground">Full ERP Database Backup</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Complete structural JSON dump of Campuses, Courses, Batches, Students, Fees, Ledger, CRM Leads, and Attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-[11px] text-primary/80 bg-primary/5 p-2 rounded-md mb-4 border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>Full cryptographic snapshot suitable for cold storage & backup.</span>
            </div>
            <Button
              onClick={handleExportBackup}
              disabled={loadingExport !== null}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {loadingExport === "backup" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compiling System Backup...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Download Complete Backup (JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ─── Footer Guidelines ───────────────────────────────── */}
      <div className="p-4 rounded-xl bg-card/30 border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Export Compatibility & UTF-8 Formatting</p>
          <p className="mt-0.5">
            All CSV downloads are encoded with UTF-8 BOM, ensuring Hindi and international characters, phone numbers, and currency formats open seamlessly in Microsoft Excel, Google Sheets, and Apple Numbers without character distortion.
          </p>
        </div>
      </div>
    </div>
  );
}

