import Link from "next/link";
import { db } from "@/lib/db";
import { getStudentById } from "@/server/actions/students";
import { getBatches } from "@/server/actions/academics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrintButton } from "@/components/ui/print-button";
import { StudentProfileActions } from "@/components/students/student-profile-actions";
import { StudentIdCard } from "@/components/students/student-id-card";
import { StudentDossierPrint } from "@/components/students/student-dossier-print";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  CreditCard,
  CheckSquare,
  Award,
  FileText,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StudentProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { id } = await params;
  const student = await getStudentById(id);
  const [batches, institute] = await Promise.all([
    getBatches({ status: "ACTIVE", campusId: student.instituteId }),
    db.institute.findUnique({ where: { id: student.instituteId } }),
  ]);
  const activeEnrollment = student.enrollments.find((e) => e.status === "ACTIVE") || student.enrollments[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
              <Badge variant="success" className="text-xs">
                {student.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Roll No: <span className="font-semibold text-foreground">{student.studentId}</span> • Admission No: <span className="font-semibold text-foreground">{student.admissionNo}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StudentProfileActions
            student={student}
            activeEnrollment={activeEnrollment}
            availableBatches={batches}
          />
          <PrintButton label="Print Profile" />
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Batch Assigned</p>
              <p className="text-sm font-bold text-foreground">
                {activeEnrollment?.batch?.name || "Unassigned"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              student.attendanceRate < 75
                ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                : student.attendanceRate < 85
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
            }`}>
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Attendance Rate</p>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${
                  student.attendanceRate < 75
                    ? "text-red-600 dark:text-red-400"
                    : student.attendanceRate < 85
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}>{student.attendanceRate}%</p>
                {student.attendanceRate < 75 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400">
                    SHORTAGE
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Fee Balance Due</p>
              <p className="text-sm font-bold text-foreground">
                {formatCurrency(student.feePlans[0]?.balanceAmount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Tests Taken</p>
              <p className="text-sm font-bold text-foreground">{student.marks.length} Assessments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Profile Sections */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="parent">Parent / Guardian</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment History</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Register</TabsTrigger>
          <TabsTrigger value="fees">Fees &amp; Installments</TabsTrigger>
          <TabsTrigger value="exams">Exams &amp; Results</TabsTrigger>
          <TabsTrigger value="idcard">Print Student ID</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Academic Profile</CardTitle>
                <CardDescription>Current curriculum and batch allocation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block">Enrolled Course:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {activeEnrollment?.course?.name || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Batch &amp; Section:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {activeEnrollment?.batch?.name || "-"} ({activeEnrollment?.batch?.code})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Admission Date:</span>
                    <span className="font-semibold text-foreground">
                      {formatDate(student.admissionDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">School / Previous College:</span>
                    <span className="font-semibold text-foreground">
                      {student.schoolCollege || "CBSE Board"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 text-foreground">Recent Test Performance</h4>
                  {student.marks.length === 0 ? (
                    <p className="text-muted-foreground">No examination marks recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.marks.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-foreground block">{m.exam.title}</span>
                            <span className="text-muted-foreground text-[11px]">
                              {m.exam.subject.name} • Max: {m.exam.maxMarks}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-primary">
                              {m.marksObtained} / {m.exam.maxMarks}
                            </span>
                            <Badge variant="success" className="ml-2 text-[10px]">
                              {m.grade}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Contact Particulars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{student.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{student.email || "-"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-foreground">{student.address || "New Delhi, Delhi"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. PERSONAL INFO */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Full Legal Name:</span>
                  <span className="font-semibold text-foreground">{student.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Gender:</span>
                  <span className="font-semibold text-foreground">{student.gender}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date of Birth:</span>
                  <span className="font-semibold text-foreground">{formatDate(student.dob)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Emergency Contact:</span>
                  <span className="font-semibold text-foreground">{student.emergencyContact || student.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">City &amp; State:</span>
                  <span className="font-semibold text-foreground">{student.city}, {student.state}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Grade / Class:</span>
                  <span className="font-semibold text-foreground">{student.gradeClass}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. PARENT / GUARDIAN */}
        <TabsContent value="parent">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Parent &amp; Guardian Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Guardian Name:</span>
                  <span className="font-semibold text-foreground">{student.parent?.name || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Relationship:</span>
                  <span className="font-semibold text-foreground">{student.parent?.relation || "Father"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Phone:</span>
                  <span className="font-semibold text-foreground">{student.parent?.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Email:</span>
                  <span className="font-semibold text-foreground">{student.parent?.email || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Occupation:</span>
                  <span className="font-semibold text-foreground">{student.parent?.occupation || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ENROLLMENT HISTORY */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Enrollment &amp; Transfer History</CardTitle>
              <CardDescription>Audited historical batch transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {student.enrollments.map((enr) => (
                  <div key={enr.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{enr.batch.name}</p>
                      <p className="text-muted-foreground text-[11px]">
                        Course: {enr.course.name} • Enrolled: {formatDate(enr.startDate)}
                      </p>
                    </div>
                    <Badge variant={enr.status === "ACTIVE" ? "success" : "secondary"}>
                      {enr.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. ATTENDANCE */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Attendance Log</CardTitle>
                <CardDescription>Recent daily class presence records &amp; statutory compliance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  student.attendanceRate < 75
                    ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200"
                    : student.attendanceRate < 85
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200"
                }`}>
                  Attendance: {student.attendanceRate}% {student.attendanceRate < 75 ? "(Shortage Alert)" : "(Compliant)"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {student.attendanceRate < 75 && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 text-xs text-red-900 dark:text-red-300 flex items-start gap-3">
                  <span className="p-1 rounded-full bg-red-100 text-red-700 font-bold shrink-0 mt-0.5">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="font-bold">Statutory Attendance Shortage Warning (&lt; 75%)</p>
                    <p className="text-[11px] text-red-800/80 dark:text-red-300/80">
                      This student has attended only {student.attendanceRate}% of scheduled batch lectures. Under academic policy, minimum 75% attendance is required for test series &amp; exam eligibility.
                    </p>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {student.attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{formatDate(a.date)}</td>
                        <td className="p-2.5">{a.batch.name}</td>
                        <td className="p-2.5">
                          <Badge
                            variant={
                              a.status === "PRESENT"
                                ? "success"
                                : a.status === "ABSENT"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px]"
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{a.markedBy || "Faculty"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. FEES & INSTALLMENTS */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Fee Schedule &amp; Account Ledger</CardTitle>
              <CardDescription>Consolidated fee structure, deposits, and pending balance for {student.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Student Fee Summary: Total, Deposited & Pending in ONE place */}
              {(() => {
                const studentTotalFees = student.feePlans.reduce((sum, p) => sum + p.finalAmount, 0);
                const studentTotalPaid = student.feePlans.reduce((sum, p) => sum + p.paidAmount, 0);
                const studentTotalBalance = student.feePlans.reduce((sum, p) => sum + p.balanceAmount, 0);
                const studentPercent = studentTotalFees > 0 ? Math.min(100, Math.round((studentTotalPaid / studentTotalFees) * 100)) : 0;

                return (
                  <div className="p-4 rounded-xl border bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-xs border-b pb-2">
                      <span className="font-semibold text-foreground">Student Financial Summary</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        studentTotalBalance === 0 && studentTotalFees > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : studentTotalPaid > 0
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}>
                        {studentTotalBalance === 0 && studentTotalFees > 0
                          ? "FULLY PAID"
                          : studentTotalPaid > 0
                          ? "PARTIALLY PAID"
                          : "PENDING DUES"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block uppercase font-medium">Total Fees</span>
                        <span className="font-black text-foreground text-base sm:text-lg">{formatCurrency(studentTotalFees)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60">
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block uppercase font-medium">Deposited (Paid)</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg">{formatCurrency(studentTotalPaid)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60">
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 block uppercase font-medium">Pending Balance</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-base sm:text-lg">{formatCurrency(studentTotalBalance)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground text-[11px]">Payment Realization</span>
                        <span className="font-bold text-foreground text-[11px]">{studentPercent}% Paid</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${studentPercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {student.feePlans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-sm">{plan.title}</span>
                    <Badge variant={plan.status === "PAID" ? "success" : "warning"}>
                      {plan.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground block">Total Gross:</span>
                      <span className="font-semibold">{formatCurrency(plan.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Scholarship Discount:</span>
                      <span className="font-semibold text-emerald-600">-{formatCurrency(plan.discountAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Paid to Date:</span>
                      <span className="font-semibold text-primary">{formatCurrency(plan.paidAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Balance Due:</span>
                      <span className="font-bold text-amber-600">{formatCurrency(plan.balanceAmount)}</span>
                    </div>
                  </div>

                  <h5 className="font-semibold text-xs pt-3">Installment Breakdown:</h5>
                  <div className="divide-y text-xs">
                    {plan.installments.map((inst) => (
                      <div key={inst.id} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{inst.title}</span>
                          <span className="text-muted-foreground ml-2">
                            (Due: {formatDate(inst.dueDate)})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(inst.amount)}</span>
                          <Badge variant={inst.status === "PAID" ? "success" : "secondary"}>
                            {inst.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. EXAMS & RESULTS */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Exam Results &amp; Scores</CardTitle>
              <CardDescription>All recorded assessment marks</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                      <th className="p-3">Exam / Test</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {student.marks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No exam records found.
                        </td>
                      </tr>
                    ) : (
                      student.marks.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/20">
                          <td className="p-3 font-medium">{m.exam.title}</td>
                          <td className="p-3 text-muted-foreground">{m.exam.subject.name}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(m.exam.examDate)}</td>
                          <td className="p-3">
                            <span className="font-bold text-primary">{m.marksObtained}</span>
                            <span className="text-muted-foreground">/{m.exam.maxMarks}</span>
                            <span className="ml-1 text-muted-foreground">({m.percentage}%)</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={m.isPassed ? "success" : "destructive"}>{m.grade}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground italic">
                            {m.remarks || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. PRINT STUDENT ID CARD */}
        <TabsContent value="idcard">
          <Card>
            <CardContent className="p-6">
              <StudentIdCard
                student={student}
                activeEnrollment={activeEnrollment}
                institute={institute}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── HIDDEN PRINT-ONLY ACADEMIC DOSSIER & RECORD SHEET ── */}
      <StudentDossierPrint student={student} activeEnrollment={activeEnrollment} />
    </div>
  );
}
