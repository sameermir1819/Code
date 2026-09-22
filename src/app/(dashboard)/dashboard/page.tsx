import Link from "next/link";
import { getDashboardStats } from "@/server/actions/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Layers,
  CheckSquare,
  CreditCard,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Clock,
  Award,
  BookOpen,
  FileText,
  UserPlus,
  Bell,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardStats();

  // =========================================================================
  // 1. ADMIN & SUPER ADMIN DASHBOARD
  // =========================================================================
  if (data.isAdmin && data.stats) {
    const { stats, upcomingExams, recentAdmissions, recentPayments, monthlyRevenueData, batchDistribution } = data;

    return (
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="default" className="text-[10px] uppercase font-mono tracking-wider">
                {data.userRole.replace("_", " ")} ACCESS
              </Badge>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Campus Active</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive ERP Hub</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-foreground">{data.userName}</span>. Institute operations, fee collections & student analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Link
              href="/students"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ New Admission</span>
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border bg-card text-foreground text-xs font-semibold shadow-2xs hover:bg-muted/50 transition-all active:scale-95"
            >
              <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark Attendance</span>
            </Link>
          </div>
        </div>

        {/* Executive Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            href="/students"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Admissions
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Register Student</p>
            </div>
          </Link>

          <Link
            href="/attendance"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Attendance
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Daily Check-in</p>
            </div>
          </Link>

          <Link
            href="/finance/payments"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Collect Fee
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Tax Receipts</p>
            </div>
          </Link>

          <Link
            href="/finance/outstanding"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Defaulters
              </p>
              <p className="text-[10px] text-muted-foreground truncate">1-Click CSV Export</p>
            </div>
          </Link>

          <Link
            href="/batches"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Batches
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Rooms & Timetable</p>
            </div>
          </Link>

          <Link
            href="/announcements"
            className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-2xs"
          >
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Broadcast
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Notice Board</p>
            </div>
          </Link>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/students" className="block group">
            <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Students
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    {stats.activeStudents} Active
                  </span>
                  <span>• {stats.newAdmissionsThisMonth} new</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/batches" className="block group">
            <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Batches
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Layers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.activeBatches}</div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>Instructed by</span>
                  <span className="font-semibold text-foreground">{stats.totalTeachers} Faculty</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/finance/payments" className="block group">
            <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today's Collection
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <CreditCard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.todayCollections)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Month Total: <span className="font-medium text-foreground">{formatCurrency(stats.monthCollections)}</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/finance/outstanding" className="block group">
            <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Outstanding Dues
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                  {formatCurrency(stats.totalOutstandingFees)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="text-amber-600 font-medium">Action:</span>
                  <span>View defaulters list</span>
                  <ArrowUpRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts & Distribution Section */}
        {(() => {
          const total6MonthRevenue = monthlyRevenueData?.reduce((acc: number, d: any) => acc + (d.collections || 0), 0) || 0;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Collection Trend */}
              <Card className="lg:col-span-2 rounded-2xl border bg-card/60 shadow-2xs">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Fee Collection Trend</CardTitle>
                      <CardDescription>Monthly realized fee collections (past 6 months)</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-xl">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>6-Mo Total: {formatCurrency(total6MonthRevenue)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end gap-3 pt-6 pb-2 border-b">
                    {monthlyRevenueData?.map((item: any, idx: number) => {
                      const maxVal = Math.max(...monthlyRevenueData.map((d: any) => d.collections), 100000);
                      const heightPercent = item.collections > 0 ? Math.max(6, Math.round((item.collections / maxVal) * 100)) : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                            {formatCurrency(item.collections)}
                          </span>
                          <div
                            className={`w-full transition-all rounded-t-lg relative flex items-end justify-center ${
                              item.collections > 0 ? "bg-primary/20 hover:bg-primary/40" : "bg-muted/30"
                            }`}
                            style={{ height: `${heightPercent}%`, minHeight: item.collections > 0 ? "8px" : "3px" }}
                          >
                            {item.collections > 0 && (
                              <div className="w-full bg-primary h-2 rounded-t-lg opacity-90 shadow-xs" />
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card className="rounded-2xl border bg-card/60 shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Today's Attendance</CardTitle>
                  <CardDescription>Aggregate student presence across active batches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.totalTodayAttendance === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                      <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <CheckSquare className="h-6 w-6 opacity-60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No Attendance Recorded Today</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        Attendance has not been marked for any batch yet today.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center p-4">
                        <div className="relative flex items-center justify-center h-32 w-32">
                          <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                              className="text-primary/20"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="text-primary"
                              strokeDasharray={`${stats.attendanceRate}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="flex flex-col items-center justify-center relative z-10">
                            <span className="text-3xl font-bold">{stats.attendanceRate}%</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Present</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t text-xs">
                        <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Present Today
                          </span>
                          <span className="font-semibold">{stats.presentToday} Students</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            Absent Today
                          </span>
                          <span className="font-semibold">{stats.absentToday} Students</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            Late / Excused
                          </span>
                          <span className="font-semibold">{stats.lateToday} Students</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Batch Distribution & Upcoming Exams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl border bg-card/60 shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Batch Capacity & Distribution</CardTitle>
                  <CardDescription>Enrollment vs room seating capacity per batch</CardDescription>
                </div>
                <Link href="/batches" className="text-xs text-primary font-medium hover:underline">
                  Manage Batches →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchDistribution?.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <p>No classes or batches created yet.</p>
                  <Link href="/batches" className="text-primary font-medium hover:underline mt-1 inline-block">
                    + Create First Class / Batch
                  </Link>
                </div>
              ) : (
                batchDistribution?.map((batch: any, idx: number) => {
                  const percent = Math.min(100, Math.round((batch.students / batch.capacity) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{batch.name}</span>
                        <span className="text-muted-foreground">
                          {batch.students} / {batch.capacity} seats ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 90
                              ? "bg-red-500"
                              : percent >= 75
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card/60 shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming Tests</CardTitle>
                <Link href="/exams" className="text-xs text-primary font-medium hover:underline">
                  View All →
                </Link>
              </div>
              <CardDescription>Scheduled assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingExams?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No upcoming tests scheduled</p>
              ) : (
                upcomingExams?.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl border bg-muted/30 flex items-start justify-between gap-3 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{exam.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {exam.subject.name} • {exam.batch.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(exam.examDate)}</span>
                        <span>• {exam.maxMarks} Marks</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                      {exam.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Admissions & Payments Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl border bg-card/60 shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Admissions</CardTitle>
                  <CardDescription>Newly registered students</CardDescription>
                </div>
                <Link href="/students" className="text-xs text-primary font-medium hover:underline">
                  View Directory →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentAdmissions?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent admissions registered.</p>
              ) : (
                <div className="divide-y text-xs">
                  {recentAdmissions?.map((student: any) => (
                    <div key={student.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {student.studentId} • {student.enrollments?.[0]?.batch?.name || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="text-[10px]">
                          {student.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDate(student.admissionDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card/60 shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
                  <CardDescription>Latest fee collections with receipts</CardDescription>
                </div>
                <Link href="/finance/payments" className="text-xs text-primary font-medium hover:underline">
                  View Ledger →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentPayments?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No payments recorded yet.</p>
              ) : (
                <div className="divide-y text-xs">
                  {recentPayments?.map((p: any) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{p.student.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.receiptNo} • Method: <span className="font-medium text-foreground">{p.paymentMethod}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount)}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDate(p.paymentDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TEACHER DASHBOARD (Academic View Only)
  // =========================================================================
  if (data.userRole === "TEACHER" && data.teacherData) {
    const { assignedBatches, todaySlots, teacherExams } = data.teacherData;

    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <strong className="text-amber-900 dark:text-amber-300">Faculty Academic Mode:</strong>
            <span className="text-amber-800 dark:text-amber-400 ml-1">
              Executive institute revenue, admission records, and financial balances are restricted to Administrators.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{data.userName}</span>. Here are your assigned batches, classes, and exams.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow"
            >
              Mark Class Attendance
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Batches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">My Assigned Batches</CardTitle>
              <CardDescription className="text-xs">Classrooms under your academic instruction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignedBatches.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No batches assigned</p>
              ) : (
                assignedBatches.map((b: any) => (
                  <div key={b.id} className="p-3 rounded-lg border bg-muted/20 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-foreground text-sm">{b.name}</p>
                      <p className="text-muted-foreground text-[11px]">{b.course.name} • Room: {b.room}</p>
                    </div>
                    <Badge variant="outline">
                      {b._count?.enrollments || 0} Students
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Today's Teaching Schedule</CardTitle>
              <CardDescription className="text-xs">Classes scheduled for instruction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No classes scheduled today</p>
              ) : (
                todaySlots.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-foreground">{s.subject.name}</p>
                      <p className="text-muted-foreground text-[11px]">{s.batch.name} • {s.room}</p>
                    </div>
                    <Badge variant="default" className="font-mono">
                      {s.startTime} - {s.endTime}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. STUDENT DASHBOARD (Personal Portal Only)
  // =========================================================================
  if (data.userRole === "STUDENT" && data.studentData) {
    const { student, attendancePercentage, activeEnrollment, feePlan, recentMarks } = data.studentData;

    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <strong className="text-blue-900 dark:text-blue-300">Student Portal View:</strong>
            <span className="text-blue-800 dark:text-blue-400 ml-1">
              Showing personal academic records. Institute administrative stats are protected.
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-semibold text-foreground">{student?.name || data.userName}</span> ({student?.studentId || "Enrolled"}).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">My Batch</span>
            <span className="text-base font-bold text-foreground mt-1 block">
              {activeEnrollment?.batch?.name || "Not Enrolled"}
            </span>
            <span className="text-[11px] text-muted-foreground">{activeEnrollment?.course?.name || "No Course"}</span>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">My Attendance</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {attendancePercentage}%
            </span>
            <span className="text-[11px] text-muted-foreground">Active academic session</span>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">My Fee Balance</span>
            <span className="text-2xl font-bold text-primary mt-1 block">
              {formatCurrency(feePlan?.balanceAmount || 0)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Status: <strong className="text-foreground">{feePlan ? feePlan.status : "No Active Plan"}</strong>
            </span>
          </Card>
        </div>

        {/* Recent Test Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">My Recent Test Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMarks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No test results published yet.</p>
            ) : (
              <div className="divide-y text-xs">
                {recentMarks.map((m: any) => (
                  <div key={m.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{m.exam.title}</p>
                      <p className="text-[11px] text-muted-foreground">{m.exam.subject.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-primary">
                        {m.marksObtained} / {m.exam.maxMarks}
                      </span>
                      <Badge variant={m.isPassed ? "success" : "destructive"}>
                        {m.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // 4. ACCOUNTANT DASHBOARD
  // =========================================================================
  if (data.userRole === "ACCOUNTANT" && data.accountantData) {
    const { todayCollections, monthCollections, totalOutstanding, recentPayments } = data.accountantData;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Accounts Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Realized cash flows, pending student installments, and fee voucher collections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Today's Collection</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {formatCurrency(todayCollections)}
            </span>
          </Card>
          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">This Month's Inflow</span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {formatCurrency(monthCollections)}
            </span>
          </Card>
          <Card className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Total Outstanding Dues</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {formatCurrency(totalOutstanding)}
            </span>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Latest Realized Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-3 pl-4">Receipt</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 pr-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPayments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="p-3 pl-4 font-mono font-semibold text-primary">{p.receiptNo}</td>
                      <td className="p-3 font-semibold">{p.student.name}</td>
                      <td className="p-3"><Badge variant="outline">{p.paymentMethod}</Badge></td>
                      <td className="p-3 pr-4 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
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

  // Fallback / Restricted Access Card
  return (
    <Card className="p-12 text-center max-w-lg mx-auto space-y-4">
      <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto" />
      <h2 className="text-xl font-bold">Restricted View</h2>
      <p className="text-xs text-muted-foreground">
        Executive institute dashboard data (revenue collections, total admission stats, and financial charts) is strictly restricted to Institute Administrators.
      </p>
      <div className="pt-2">
        <Link href="/settings" className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold">
          Go to My Profile
        </Link>
      </div>
    </Card>
  );
}
