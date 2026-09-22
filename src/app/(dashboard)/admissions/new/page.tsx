"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { processAdmission } from "@/server/actions/admissions";
import { getCourses, getBatches } from "@/server/actions/academics";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, UserPlus, CreditCard, Layers, Phone } from "lucide-react";
import Link from "next/link";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Courses & Batches list
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "2008-01-01",
    gender: "MALE",
    address: "",
    city: "New Delhi",
    state: "Delhi",
    schoolCollege: "CBSE School",
    gradeClass: "Class 11",
    parentName: "",
    parentPhone: "",
    parentRelation: "Father",
    parentOccupation: "Business / Professional",
    admissionFee: 10000,
    tuitionFee: 120000,
    materialFee: 10000,
    examFee: 5000,
    discountAmount: 10000,
    discountReason: "Merit / Early Bird Scholarship",
    installmentCount: 2,
    initialPaymentAmount: 50000,
    paymentMethod: "UPI",
    referenceNo: "",
    notes: "Admitted after counseling",
  });

  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      const [c, b] = await Promise.all([getCourses(), getBatches({ status: "ACTIVE" })]);
      setCourses(c);
      setBatches(b);
      if (c.length > 0) {
        setSelectedCourseId(c[0].id);
        setFormData((prev) => ({
          ...prev,
          tuitionFee: c[0].standardFee - 25000,
        }));
      }
      if (b.length > 0) {
        setSelectedBatchId(b[0].id);
        if (b[0].courseId) {
          setSelectedCourseId(b[0].courseId);
          const matchedCourse = c.find((course: any) => course.id === b[0].courseId);
          if (matchedCourse) {
            setFormData((prev) => ({
              ...prev,
              tuitionFee: matchedCourse.standardFee - 25000,
            }));
          }
        }
      } else if (c.length > 0) {
        setSelectedCourseId(c[0].id);
        setFormData((prev) => ({
          ...prev,
          tuitionFee: c[0].standardFee - 25000,
        }));
      }
    }
    loadData();
  }, []);

  const handleBatchChange = (bId: string) => {
    setSelectedBatchId(bId);
    const chosenBatch = batches.find((b) => b.id === bId);
    if (chosenBatch) {
      setSelectedCourseId(chosenBatch.courseId);
      const chosenCourse = courses.find((c) => c.id === chosenBatch.courseId);
      if (chosenCourse) {
        setFormData((prev) => ({
          ...prev,
          tuitionFee: chosenCourse.standardFee - 25000,
        }));
      }
    }
  };

  const totalGross =
    Number(formData.admissionFee) +
    Number(formData.tuitionFee) +
    Number(formData.materialFee) +
    Number(formData.examFee);
  const finalFee = Math.max(0, totalGross - Number(formData.discountAmount || 0));
  const remainingBalance = Math.max(0, finalFee - Number(formData.initialPaymentAmount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) return setErrorMsg("Student name is required");
    if (!formData.parentName.trim()) return setErrorMsg("Parent name is required");
    if (!formData.parentPhone.trim()) return setErrorMsg("Parent phone is required");
    if (!selectedCourseId) return setErrorMsg("Please select a course");
    if (!selectedBatchId) return setErrorMsg("Please select a batch");

    startTransition(async () => {
      try {
        const res = await processAdmission({
          ...formData,
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          admissionFee: Number(formData.admissionFee),
          tuitionFee: Number(formData.tuitionFee),
          materialFee: Number(formData.materialFee),
          examFee: Number(formData.examFee),
          discountAmount: Number(formData.discountAmount),
          installmentCount: Number(formData.installmentCount),
          initialPaymentAmount: Number(formData.initialPaymentAmount),
        });

        if (res.success) {
          setResult(res);
          window.dispatchEvent(new CustomEvent("erp-data-refresh"));
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to process admission");
      }
    });
  };

  if (result) {
    return (
      <Card className="max-w-2xl mx-auto text-center p-8 space-y-4">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold">Admission Successfully Completed!</h2>
        <p className="text-sm text-muted-foreground">
          Student has been enrolled, fee schedule established, and receipt generated in the ledger.
        </p>

        <div className="bg-muted p-4 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student ID:</span>
            <span className="font-bold text-foreground">{result.studentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Admission No:</span>
            <span className="font-bold text-foreground">{result.admissionNo}</span>
          </div>
          {result.receiptNo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee Receipt No:</span>
              <span className="font-bold text-primary">{result.receiptNo}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Link
            href={`/students/${result.studentId}`}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
          >
            View Student Profile
          </Link>
          <Link
            href="/students"
            className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-muted"
          >
            Go to Directory
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/students"
          className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Student Admission</h1>
          <p className="text-sm text-muted-foreground">
            Complete the 9-point student enrollment workflow with automated ledger generation.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Student Particulars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>1. Student Particulars</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Full Legal Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aryan Sehgal"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Date of Birth</label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Student Contact Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98..."
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Class / Target Stream</label>
              <Input
                value={formData.gradeClass}
                onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                placeholder="e.g. Class 11"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="font-semibold block mb-1">Permanent Residential Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House / Street, Area, City"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Parent / Guardian Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>2. Parent / Guardian Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Parent / Guardian Name *</label>
              <Input
                required
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Father / Guardian Name"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Relationship</label>
              <select
                value={formData.parentRelation}
                onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Local Guardian</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Parent Mobile Number *</label>
              <Input
                required
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="+91 98..."
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Batch Allocation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>3. Batch Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div>
              <label className="font-semibold block mb-1">Select Batch *</label>
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.capacity} seats) {b.course?.name ? `• ${b.course.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 4. Fee Plan & Initial Collection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>4. Fee Structure & Admission Receipt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-muted-foreground block mb-1">Admission Fee (₹)</label>
                <Input
                  type="number"
                  value={formData.admissionFee}
                  onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Tuition Fee (₹)</label>
                <Input
                  type="number"
                  value={formData.tuitionFee}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Study Material (₹)</label>
                <Input
                  type="number"
                  value={formData.materialFee}
                  onChange={(e) => setFormData({ ...formData, materialFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Exam & Test Series (₹)</label>
                <Input
                  type="number"
                  value={formData.examFee}
                  onChange={(e) => setFormData({ ...formData, examFee: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <label className="font-semibold block mb-1">Scholarship Discount (₹)</label>
                <Input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Installments Count</label>
                <select
                  value={formData.installmentCount}
                  onChange={(e) => setFormData({ ...formData, installmentCount: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value={1}>1 (Full Upfront Payment)</option>
                  <option value={2}>2 (Bi-Annual Installments)</option>
                  <option value={3}>3 (Quarterly Installments)</option>
                  <option value={4}>4 (Four Installments)</option>
                </select>
              </div>
            </div>

            {/* Live Financial Summary */}
            <div className="p-3 rounded-lg bg-muted/40 border grid grid-cols-3 text-center">
              <div>
                <span className="text-muted-foreground block">Total Net Fee:</span>
                <span className="font-bold text-sm text-foreground">{formatCurrency(finalFee)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Paying Today:</span>
                <span className="font-bold text-sm text-primary">{formatCurrency(formData.initialPaymentAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Balance Due:</span>
                <span className="font-bold text-sm text-amber-600">{formatCurrency(remainingBalance)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-semibold block mb-1">Initial Amount Collected (₹)</label>
                <Input
                  type="number"
                  value={formData.initialPaymentAmount}
                  onChange={(e) => setFormData({ ...formData, initialPaymentAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                  <option value="CASH">Cash at Desk</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Transaction Ref / UTR No</label>
                <Input
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  placeholder="Optional UTR / Ref"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link
            href="/students"
            className="px-5 py-2.5 rounded-lg border text-xs font-semibold hover:bg-muted"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isPending} className="px-6 py-2.5 text-xs font-semibold">
            {isPending ? "Processing Admission & Ledger..." : "Confirm & Admit Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}

