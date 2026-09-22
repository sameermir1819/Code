"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
} from "@/server/actions/announcements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Award,
  Loader2,
  BellOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type NotificationsResult = Awaited<ReturnType<typeof getUserNotifications>>;
type NotificationItem = NotificationsResult["notifications"][number];

// ─── Notification type config ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  FEE_DUE: {
    icon: CreditCard,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    label: "Fee Due",
  },
  PAYMENT_RECEIVED: {
    icon: CheckCircle2,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    label: "Payment",
  },
  ATTENDANCE_WARNING: {
    icon: AlertTriangle,
    color:
      "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    label: "Attendance",
  },
  EXAM_ANNOUNCED: {
    icon: ClipboardList,
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
    label: "Exam",
  },
  RESULT_PUBLISHED: {
    icon: Award,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
    label: "Result",
  },
  GENERAL: {
    icon: Bell,
    color:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    label: "General",
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG["GENERAL"];
}

// ─── Relative time formatter ──────────────────────────────────────────────────
function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationItem;
  onRead: (id: string) => void;
}) {
  const cfg = getTypeConfig(notification.type);
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
      }}
      className={`w-full text-left p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors ${
        !notification.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
      }`}
    >
      {/* Type icon */}
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground text-xs leading-snug truncate">
            {notification.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {relativeTime(notification.createdAt)}
            </span>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <span
          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${cfg.color}`}
        >
          {cfg.label}
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ALL_TYPES = ["ALL", "FEE_DUE", "PAYMENT_RECEIVED", "ATTENDANCE_WARNING", "EXAM_ANNOUNCED", "RESULT_PUBLISHED", "GENERAL"] as const;
type FilterType = (typeof ALL_TYPES)[number];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");

  const [isPendingAll, startMarkAll] = useTransition();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Mark single as read ────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationAsRead(id);
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const handleMarkAllRead = () => {
    startMarkAll(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeTab === "UNREAD" && n.isRead) return false;
    if (typeFilter !== "ALL" && n.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            System alerts, fee reminders, exam announcements, and attendance notices.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPendingAll}
            className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
          >
            {isPendingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark All Read
          </button>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["ALL", "UNREAD"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "UNREAD" ? `Unread (${unreadCount})` : "All"}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FilterType)}
          className="px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-48"
        >
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All Types" : (TYPE_CONFIG[t]?.label ?? t)}
            </option>
          ))}
        </select>
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <BellOff className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "UNREAD"
                  ? "You're all caught up! No unread notifications."
                  : "No notifications match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={handleMarkRead} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
