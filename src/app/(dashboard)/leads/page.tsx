"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getLeads,
  getLeadsMetrics,
  createLead,
  updateLead,
  addLeadFollowUp,
  deleteLead,
  LeadStatus,
  LeadPriority,
  LeadSource,
} from "@/server/actions/leads";
import { exportLeadsCSV } from "@/server/actions/export";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  PhoneCall,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  Columns3,
  List,
  MessageSquare,
  Plus,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  School,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Send,
} from "lucide-react";

type Lead = Awaited<ReturnType<typeof getLeads>>["leads"][number];
type Metrics = Awaited<ReturnType<typeof getLeadsMetrics>>;

const STATUS_COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: "NEW", label: "New Leads", color: "border-blue-500/40 bg-blue-500/5 text-blue-400" },
  { key: "CONTACTED", label: "Contacted", color: "border-sky-500/40 bg-sky-500/5 text-sky-400" },
  { key: "COUNSELING_SCHEDULED", label: "Counseling", color: "border-purple-500/40 bg-purple-500/5 text-purple-400" },
  { key: "TRIAL_CLASS", label: "Trial Class", color: "border-amber-500/40 bg-amber-500/5 text-amber-400" },
  { key: "CONVERTED", label: "Converted", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" },
  { key: "LOST", label: "Lost / Closed", color: "border-rose-500/40 bg-rose-500/5 text-rose-400" },
];

export default function LeadsPage() {
  const router = useRouter();

  // ─── Metrics & Leads State ──────────────────────────────────────────
  const [metrics, setMetrics] = useState<Metrics>({
    totalLeads: 0,
    total: 0,
    newThisMonth: 0,
    convertedCount: 0,
    followUpsDueToday: 0,
    hotLeadsCount: 0,
    hotLeads: 0,
    conversionRate: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ─── Filter State ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");

  // ─── Modals State ───────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<Lead | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Add/Edit Form State ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    parentName: "",
    parentPhone: "",
    courseInterest: "",
    schoolCollege: "",
    source: "WALK_IN" as LeadSource,
    priority: "MEDIUM" as LeadPriority,
    status: "NEW" as LeadStatus,
    assignedTo: "",
    notes: "",
    nextFollowUpDate: "",
  });

  // ─── Follow-up Form State ───────────────────────────────────────────
  const [followUpData, setFollowUpData] = useState({
    method: "CALL",
    notes: "",
    newStatus: "CONTACTED" as LeadStatus,
    nextFollowUpDate: "",
  });

  // ─── Fetch Data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, metricsRes] = await Promise.all([
        getLeads({
          search,
          status: statusFilter,
          priority: priorityFilter,
          source: sourceFilter,
          limit: 100,
        }),
        getLeadsMetrics(),
      ]);
      setLeads(leadsRes.leads);
      setMetrics(metricsRes);
    } catch (err) {
      console.error("Failed to load leads data:", err);
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sourceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reactive listener for multi-campus changes or global sync
  useEffect(() => {
    const handleSync = () => loadData();
    window.addEventListener("erp-campus-changed", handleSync);
    window.addEventListener("erp-data-refresh", handleSync);
    return () => {
      window.removeEventListener("erp-campus-changed", handleSync);
      window.removeEventListener("erp-data-refresh", handleSync);
    };
  }, [loadData]);

  // ─── Handle Add / Edit Submission ───────────────────────────────────
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Please provide at least a Student Name and Phone number.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingLead) {
        await updateLead(editingLead.id, {
          ...formData,
          nextFollowUpDate: formData.nextFollowUpDate
            ? new Date(formData.nextFollowUpDate)
            : null,
        });
      } else {
        await createLead({
          ...formData,
          nextFollowUpDate: formData.nextFollowUpDate
            ? new Date(formData.nextFollowUpDate)
            : undefined,
        });
      }
      setIsAddModalOpen(false);
      setEditingLead(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      parentName: "",
      parentPhone: "",
      courseInterest: "",
      schoolCollege: "",
      source: "WALK_IN",
      priority: "MEDIUM",
      status: "NEW",
      assignedTo: "",
      notes: "",
      nextFollowUpDate: "",
    });
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      parentName: lead.parentName || "",
      parentPhone: lead.parentPhone || "",
      courseInterest: lead.courseInterest || "",
      schoolCollege: lead.currentSchool || "",
      source: lead.source as LeadSource,
      priority: lead.priority as LeadPriority,
      status: lead.status as LeadStatus,
      assignedTo: lead.assignedTo || "",
      notes: lead.notes || "",
      nextFollowUpDate: lead.nextFollowUp
        ? new Date(lead.nextFollowUp).toISOString().slice(0, 16)
        : "",
    });
    setIsAddModalOpen(true);
  };

  // ─── Handle Delete ──────────────────────────────────────────────────
  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete inquiry for "${name}"?`)) return;
    try {
      await deleteLead(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete lead");
    }
  };

  // ─── Handle Follow-up Log Submission ────────────────────────────────
  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUpLead) return;
    if (!followUpData.notes.trim()) {
      alert("Please enter notes or discussion outcome from the follow-up.");
      return;
    }

    setSubmitting(true);
    try {
      await addLeadFollowUp(activeFollowUpLead.id, {
        notes: followUpData.notes,
        contactMethod: (followUpData.method === "CALL"
          ? "PHONE_CALL"
          : followUpData.method === "VISIT"
          ? "IN_PERSON"
          : followUpData.method) as any,
        newStatus: followUpData.newStatus,
        nextFollowUpDate: followUpData.nextFollowUpDate || undefined,
      });

      setActiveFollowUpLead(null);
      setFollowUpData({
        method: "CALL",
        notes: "",
        newStatus: "CONTACTED",
        nextFollowUpDate: "",
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to log follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Convert Lead to Admission ──────────────────────────────────────
  const handleConvertToAdmission = (lead: Lead) => {
    const params = new URLSearchParams({
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      parentName: lead.parentName || "",
      parentPhone: lead.parentPhone || "",
      courseInterest: lead.courseInterest || "",
    });
    router.push(`/admissions/new?${params.toString()}`);
  };

  // ─── CSV Export ─────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await exportLeadsCSV();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export leads.");
    } finally {
      setExporting(false);
    }
  };

  // ─── Priority Badge Helper ──────────────────────────────────────────
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HOT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
            <Flame className="w-3 h-3 text-red-500" /> HOT
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-500/10">New Inquiry</Badge>;
      case "CONTACTED":
        return <Badge variant="outline" className="border-sky-500 text-sky-400 bg-sky-500/10">Contacted</Badge>;
      case "COUNSELING_SCHEDULED":
        return <Badge variant="outline" className="border-purple-500 text-purple-400 bg-purple-500/10">Counseling</Badge>;
      case "TRIAL_CLASS":
        return <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-500/10">Trial Class</Badge>;
      case "CONVERTED":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-500/10">Converted</Badge>;
      case "LOST":
        return <Badge variant="outline" className="border-rose-500 text-rose-400 bg-rose-500/10">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-primary" />
              Admissions CRM & Inquiries
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
              Live Pipeline
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Capture inquiries, log counselor follow-ups, track conversion stages, and onboard prospective students.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting}
            className="border-border hover:bg-accent flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Inquiry / Lead
          </Button>
        </div>
      </div>

      {/* ─── Metrics Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="bg-card/50 backdrop-blur border-border/70 hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Inquiries</p>
              <p className="text-2xl font-bold leading-none mt-1">{metrics.totalLeads}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">In CRM pipeline</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/70 hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">New This Month</p>
              <p className="text-2xl font-bold leading-none mt-1">{metrics.newThisMonth}</p>
              <p className="text-[11px] text-emerald-500 mt-0.5">Fresh queries</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/70 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              metrics.followUpsDueToday > 0 ? "bg-amber-500/20 text-amber-400 animate-pulse" : "bg-muted text-muted-foreground"
            }`}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Follow-ups Today</p>
              <p className="text-2xl font-bold leading-none mt-1 text-amber-400">
                {metrics.followUpsDueToday}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Action scheduled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/70 hover:border-red-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hot Leads</p>
              <p className="text-2xl font-bold leading-none mt-1 text-red-400">{metrics.hotLeadsCount}</p>
              <p className="text-[11px] text-red-400/80 mt-0.5">High close rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/70 hover:border-emerald-500/40 transition-colors col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold leading-none mt-1 text-emerald-400">
                {metrics.conversionRate}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Lead to admission</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search, Filters & View Toggle ──────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/40 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, phone, email, parent or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs h-9 rounded-md bg-background/50 border border-border px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value="HOT">🔥 Hot</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs h-9 rounded-md bg-background/50 border border-border px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Sources</option>
            <option value="WALK_IN">Walk-in Inquiry</option>
            <option value="CALL">Phone Call</option>
            <option value="WEBSITE">Website</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="REFERRAL">Referral</option>
            <option value="NEWSPAPER">Newspaper</option>
            <option value="OTHER">Other</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-background/50">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("pipeline")}
              className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === "pipeline"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Pipeline Stage View"
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Status Filter Pills ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
            statusFilter === "ALL"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card/60 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
          }`}
        >
          All Inquiries ({metrics.totalLeads})
        </button>
        {STATUS_COLUMNS.map((col) => {
          const count = leads.filter((l) => l.status === col.key).length;
          const isActive = statusFilter === col.key;
          return (
            <button
              key={col.key}
              onClick={() => setStatusFilter(col.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/60 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              }`}
            >
              {col.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ─── Content: Table View vs Pipeline View ────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading admissions CRM pipeline...</p>
        </div>
      ) : leads.length === 0 ? (
        <Card className="border-dashed border-2 p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Inquiries Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "No leads matched your current filters. Try resetting the search or filter options."
              : "Capture walk-in inquiries or incoming prospective calls to build your admissions pipeline."}
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Inquiry
          </Button>
        </Card>
      ) : viewMode === "table" ? (
        /* ─── Table View ────────────────────────────────────────── */
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student & Interest</th>
                  <th className="px-4 py-3 font-semibold">Contact & Parent</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Next Action</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leads.map((lead) => {
                  const isFollowUpDueToday =
                    lead.nextFollowUp &&
                    new Date(lead.nextFollowUp).toDateString() ===
                      new Date().toDateString();
                  const isFollowUpOverdue =
                    lead.nextFollowUp &&
                    new Date(lead.nextFollowUp) < new Date() &&
                    lead.status !== "CONVERTED" &&
                    lead.status !== "LOST";

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-accent/40 transition-colors group"
                    >
                      {/* Name & Academic info */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {lead.name}
                          {lead.isConverted && (
                            <span title="Converted / Enrolled student" className="text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3 h-3 text-primary/70 shrink-0" />
                          <span className="font-medium text-foreground/80">
                            {lead.courseInterest || "General Inquiry"}
                          </span>
                        </div>
                        {lead.currentSchool && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <School className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {lead.currentSchool}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Contact & Parent */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-mono text-xs text-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {lead.phone}
                          </a>
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium"
                            title="Chat on WhatsApp"
                          >
                            WhatsApp
                          </a>
                        </div>
                        {lead.parentName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            P: {lead.parentName} {lead.parentPhone && `(${lead.parentPhone})`}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-[11px] text-muted-foreground/80 truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-md font-medium border border-border/50">
                          {lead.source.replace("_", " ")}
                        </span>
                        {lead.institute && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {lead.institute.name}
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        {getPriorityBadge(lead.priority)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(lead.status)}
                        {lead.assignedTo && (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            Assigned: <span className="font-medium text-foreground/80">{lead.assignedTo}</span>
                          </div>
                        )}
                      </td>

                      {/* Next Action / Follow-up */}
                      <td className="px-4 py-3.5">
                        {lead.nextFollowUp ? (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-medium flex items-center gap-1 ${
                                isFollowUpOverdue
                                  ? "text-rose-400 font-semibold"
                                  : isFollowUpDueToday
                                  ? "text-amber-400 font-semibold"
                                  : "text-foreground"
                              }`}
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(lead.nextFollowUp)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {isFollowUpOverdue
                                ? "Overdue"
                                : isFollowUpDueToday
                                ? "Due Today!"
                                : "Scheduled"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None scheduled</span>
                        )}
                        {lead._count.followUps > 0 && (
                          <div className="text-[10px] text-primary mt-0.5">
                            {lead._count.followUps} log{lead._count.followUps > 1 ? "s" : ""} recorded
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Follow-up Log Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActiveFollowUpLead(lead);
                              setFollowUpData({
                                method: "CALL",
                                notes: "",
                                newStatus: lead.status as LeadStatus,
                                nextFollowUpDate: "",
                              });
                            }}
                            className="h-8 px-2.5 text-xs border-border hover:border-primary/50 text-foreground flex items-center gap-1"
                            title="Log Follow-up / Interaction"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            Log Call
                          </Button>

                          {/* Convert to Admission Button */}
                          {lead.status !== "CONVERTED" && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToAdmission(lead)}
                              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 shadow-sm"
                              title="Convert to Admission"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Admit
                            </Button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* ─── Pipeline / Kanban View ────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {STATUS_COLUMNS.map((column) => {
            const columnLeads = leads.filter((l) => l.status === column.key);
            return (
              <div
                key={column.key}
                className="bg-card/40 border border-border/70 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${column.color}`}>
                    {column.label}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                  {columnLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="bg-card border-border hover:border-primary/50 transition-all p-3 shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        {getPriorityBadge(lead.priority)}
                      </div>

                      <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                        <GraduationCap className="w-3 h-3 text-primary/70" />
                        <span className="truncate">{lead.courseInterest || "General Query"}</span>
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-foreground font-mono flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {lead.phone}
                        </a>
                        <a
                          href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 font-semibold"
                        >
                          WA
                        </a>
                      </div>

                      {lead.nextFollowUp && (
                        <div className="mt-1.5 text-[10px] text-amber-400/90 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Due: {formatDate(lead.nextFollowUp)}</span>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveFollowUpLead(lead);
                            setFollowUpData({
                              method: "CALL",
                              notes: "",
                              newStatus: lead.status as LeadStatus,
                              nextFollowUpDate: "",
                            });
                          }}
                          className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                        >
                          <MessageSquare className="w-2.5 h-2.5 mr-1" /> Log
                        </Button>

                        {lead.status !== "CONVERTED" && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToAdmission(lead)}
                            className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                          >
                            <UserPlus className="w-2.5 h-2.5 mr-1" /> Admit
                          </Button>
                        )}

                        <button
                          onClick={() => openEditModal(lead)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </Card>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground/60 italic">
                      No leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add / Edit Lead Modal ───────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">
                  {editingLead ? "Edit Lead Details" : "Record New Inquiry / Lead"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Student Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Phone / Mobile *
                  </label>
                  <Input
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Course Interested
                  </label>
                  <Input
                    placeholder="e.g. Class 11th JEE / NEET"
                    value={formData.courseInterest}
                    onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Parent / Guardian Name
                  </label>
                  <Input
                    placeholder="e.g. Mr. Anil Sharma"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Parent Phone
                  </label>
                  <Input
                    placeholder="e.g. 9876500000"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    School / College
                  </label>
                  <Input
                    placeholder="e.g. DPS International"
                    value={formData.schoolCollege}
                    onChange={(e) => setFormData({ ...formData, schoolCollege: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Inquiry Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value as LeadSource })
                    }
                    className="w-full text-sm h-10 rounded-md bg-background border border-border px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="WALK_IN">Walk-in Inquiry</option>
                    <option value="CALL">Phone Call</option>
                    <option value="WEBSITE">Website Form</option>
                    <option value="SOCIAL_MEDIA">Social Media (Insta/FB)</option>
                    <option value="REFERRAL">Student / Friend Referral</option>
                    <option value="NEWSPAPER">Newspaper / Pamphlet</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as LeadPriority })
                    }
                    className="w-full text-sm h-10 rounded-md bg-background border border-border px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="HOT">🔥 Hot (Ready to enroll)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as LeadStatus })
                    }
                    className="w-full text-sm h-10 rounded-md bg-background border border-border px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="NEW">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="COUNSELING_SCHEDULED">Counseling Scheduled</option>
                    <option value="TRIAL_CLASS">Trial Class</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Assigned Counselor
                  </label>
                  <Input
                    placeholder="e.g. Counselor Priya"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Next Follow-up Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.nextFollowUpDate}
                    onChange={(e) =>
                      setFormData({ ...formData, nextFollowUpDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Inquiry Notes & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Record student's academic background, target exams, specific queries or fee concessions discussed..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm rounded-md bg-background border border-border p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitting
                    ? "Saving..."
                    : editingLead
                    ? "Update Lead"
                    : "Save Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Follow-Up Interaction Logger Modal ──────────────────── */}
      {activeFollowUpLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground text-base">
                    Log Follow-up: {activeFollowUpLead.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Phone: {activeFollowUpLead.phone} | Interest: {activeFollowUpLead.courseInterest || "General"}
                </p>
              </div>
              <button
                onClick={() => setActiveFollowUpLead(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogFollowUp} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Contact Method
                  </label>
                  <select
                    value={followUpData.method}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, method: e.target.value })
                    }
                    className="w-full text-sm h-10 rounded-md bg-background border border-border px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Chat</option>
                    <option value="IN_PERSON">In-person Campus Visit</option>
                    <option value="EMAIL">Email</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Update Pipeline Stage
                  </label>
                  <select
                    value={followUpData.newStatus}
                    onChange={(e) =>
                      setFollowUpData({
                        ...followUpData,
                        newStatus: e.target.value as LeadStatus,
                      })
                    }
                    className="w-full text-sm h-10 rounded-md bg-background border border-border px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="CONTACTED">Contacted</option>
                    <option value="COUNSELING_SCHEDULED">Counseling Scheduled</option>
                    <option value="TRIAL_CLASS">Trial Class</option>
                    <option value="CONVERTED">Ready to Admit (Converted)</option>
                    <option value="LOST">Lost / Not Interested</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Discussion Outcome & Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record summary of conversation, queries raised, interest level, parent response..."
                  value={followUpData.notes}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  className="w-full text-sm rounded-md bg-background border border-border p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Schedule Next Follow-up (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={followUpData.nextFollowUpDate}
                  onChange={(e) =>
                    setFollowUpData({
                      ...followUpData,
                      nextFollowUpDate: e.target.value,
                    })
                  }
                />
              </div>

              {/* Past follow-ups list */}
              {activeFollowUpLead.followUps && activeFollowUpLead.followUps.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Previous Interactions ({activeFollowUpLead.followUps.length}):
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-2 border border-border rounded-lg p-2.5 bg-muted/20">
                    {activeFollowUpLead.followUps.map((fu: any) => (
                      <div key={fu.id} className="text-xs border-b border-border/50 pb-1.5 last:border-none">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                          <span className="font-semibold text-foreground/90">
                            {fu.contactMethod || "CALL"} • {fu.counselorName || "Counselor"}
                          </span>
                          <span>{formatDate(fu.scheduledAt || fu.createdAt)}</span>
                        </div>
                        <p className="text-foreground/80 mt-0.5">{fu.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveFollowUpLead(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Saving..." : "Record Interaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
