"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/server/actions/announcements";
import { getBatches } from "@/server/actions/academics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import {
  Megaphone,
  Plus,
  X,
  Trash2,
  Loader2,
  AlertTriangle,
  Bell,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Inferred types ─────────────────────────────────────────────────────────
type Announcement = Awaited<ReturnType<typeof getAnnouncements>>[number];
type Batch = Awaited<ReturnType<typeof getBatches>>[number];

// ─── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<
  string,
  { label: string; borderClass: string; badgeClass: string }
> = {
  URGENT: {
    label: "URGENT",
    borderClass: "border-l-red-500",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  HIGH: {
    label: "HIGH",
    borderClass: "border-l-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  MEDIUM: {
    label: "MEDIUM",
    borderClass: "border-l-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  LOW: {
    label: "LOW",
    borderClass: "border-l-gray-400",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

const TARGET_LABELS: Record<string, string> = {
  ALL: "Everyone",
  TEACHER: "Faculty",
  STUDENT: "Students",
  PARENT: "Parents",
};

// ─── Create Modal ────────────────────────────────────────────────────────────
interface CreateModalProps {
  batches: Batch[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAnnouncementModal({
  batches,
  onClose,
  onSuccess,
}: CreateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "MEDIUM",
    targetRole: "ALL",
    batchId: "",
    expiryDate: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createAnnouncement({
          title: form.title.trim(),
          message: form.message.trim(),
          priority: form.priority,
          targetRole: form.targetRole,
          batchId: form.batchId || undefined,
          expiryDate: form.expiryDate || undefined,
        });
        onSuccess();
        onClose();
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create announcement."
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              New Announcement
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Publish a notice to targeted stakeholders
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Important: Schedule Change for Phase 2"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Message <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write the full announcement message here…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {/* Priority + Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Target Audience
              </label>
              <select
                value={form.targetRole}
                onChange={(e) => set("targetRole", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="ALL">👥 All</option>
                <option value="TEACHER">🎓 Faculty Only</option>
                <option value="STUDENT">📚 Students Only</option>
                <option value="PARENT">👪 Parents Only</option>
              </select>
            </div>
          </div>

          {/* Batch (optional) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Target Batch{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <select
              value={form.batchId}
              onChange={(e) => set("batchId", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date (optional) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Expiry Date{" "}
              <span className="text-muted-foreground font-normal">
                (optional — leave blank to never expire)
              </span>
            </label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
interface AnnouncementCardProps {
  announcement: Announcement;
  onDeleted: () => void;
}

function AnnouncementCard({ announcement: a, onDeleted }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, startDelete] = useTransition();

  const priorityCfg =
    PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG["MEDIUM"];
  const isLong = a.message.length > 150;
  const displayMessage =
    isLong && !expanded ? `${a.message.slice(0, 150)}…` : a.message;

  function handleDelete() {
    if (!window.confirm(`Delete announcement "${a.title}"? This cannot be undone.`))
      return;
    startDelete(async () => {
      await deleteAnnouncement(a.id);
      onDeleted();
    });
  }

  return (
    <Card
      className={`border-l-4 ${priorityCfg.borderClass} transition-shadow hover:shadow-md`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${priorityCfg.badgeClass}`}
            >
              {a.priority === "URGENT" && (
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
              )}
              {priorityCfg.label}
            </span>

            {/* Target badge */}
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground">
              <Users className="h-2.5 w-2.5 mr-1" />
              {TARGET_LABELS[a.targetRole] ?? a.targetRole}
            </span>

            {/* Batch badge */}
            {a.batch && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                {a.batch.name}
              </span>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 p-1 rounded"
            title="Delete announcement"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Title */}
        <CardTitle className="text-base font-bold mt-2">{a.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Message */}
        <p className="text-sm text-foreground leading-relaxed">
          {displayMessage}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline underline-offset-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show more
              </>
            )}
          </button>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t">
          {a.createdBy && (
            <span>
              By{" "}
              <span className="font-semibold text-foreground">
                {a.createdBy.name}
              </span>
            </span>
          )}
          <span>Published: {formatDate(a.publishDate)}</span>
          {a.expiryDate && (
            <span>
              Expires:{" "}
              <span className="font-semibold text-amber-600">
                {formatDate(a.expiryDate)}
              </span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterTarget, setFilterTarget] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const [announcementData, batchData] = await Promise.all([
        getAnnouncements(),
        getBatches({ status: "ACTIVE" }),
      ]);
      setAnnouncements(announcementData);
      setBatches(batchData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = announcements.filter((a) => {
    if (filterPriority !== "ALL" && a.priority !== filterPriority) return false;
    if (filterTarget !== "ALL" && a.targetRole !== filterTarget) return false;
    return true;
  });

  const stats = {
    total: announcements.length,
    urgent: announcements.filter((a) => a.priority === "URGENT").length,
    active: announcements.filter(
      (a) => !a.expiryDate || new Date(a.expiryDate) >= new Date()
    ).length,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official notices for faculty, students, and parents of Futurex Learning.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Notices",
            value: stats.total,
            icon: Bell,
            color: "text-primary",
          },
          {
            label: "Urgent",
            value: stats.urgent,
            icon: AlertTriangle,
            color: "text-red-600",
          },
          {
            label: "Active",
            value: stats.active,
            icon: Megaphone,
            color: "text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">🔴 Urgent</option>
          <option value="HIGH">🟠 High</option>
          <option value="MEDIUM">🔵 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>

        <select
          value={filterTarget}
          onChange={(e) => setFilterTarget(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Audiences</option>
          <option value="TEACHER">🎓 Faculty</option>
          <option value="STUDENT">📚 Students</option>
          <option value="PARENT">👪 Parents</option>
        </select>

        {(filterPriority !== "ALL" || filterTarget !== "ALL") && (
          <button
            onClick={() => {
              setFilterPriority("ALL");
              setFilterTarget("ALL");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {announcements.length} notice
          {announcements.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                No announcements found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {announcements.length === 0
                  ? "Publish your first announcement to keep everyone informed."
                  : "No announcements match the selected filters."}
              </p>
            </div>
            {announcements.length === 0 && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onDeleted={loadData}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateAnnouncementModal
          batches={batches}
          onClose={() => setShowModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
