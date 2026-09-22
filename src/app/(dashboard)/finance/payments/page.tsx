"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  getPayments,
  recordPayment,
  getStudentFeeDetails,
  getStudentFeeAccounts,
} from "@/server/actions/finance";
import { getStudents } from "@/server/actions/students";
import { getBatches } from "@/server/actions/academics";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Receipt,
  Plus,
  X,
  Search,
  Printer,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowDownLeft,
  Users,
  CreditCard,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type PaymentsResult = Awaited<ReturnType<typeof getPayments>>;
type PaymentRow = PaymentsResult["payments"][number];
type StudentSearchResult = Awaited<ReturnType<typeof getStudents>>["students"][number];
type FeePlanDetail = Awaited<ReturnType<typeof getStudentFeeDetails>>[number];
type StudentAccount = Awaited<ReturnType<typeof getStudentFeeAccounts>>[number];

const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── Collect Fee Modal ───────────────────────────────────────────────────────
function CollectFeeModal({
  initialStudent,
  onClose,
  onSuccess,
}: {
  initialStudent?: StudentSearchResult | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Student search
  const [searchQuery, setSearchQuery] = useState(initialStudent?.name ?? "");
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(
    initialStudent ?? null
  );

  // Fee details
  const [feePlans, setFeePlans] = useState<FeePlanDetail[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>("");

  // Payment fields
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [collectedBy, setCollectedBy] = useState("Accounts Desk");
  const [notes, setNotes] = useState("");

  // Result state
  const [resultReceipt, setResultReceipt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load fee plans when student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setFeePlans([]);
      setSelectedPlanId("");
      setSelectedInstallmentId("");
      setAmount("");
      return;
    }
    setLoadingPlans(true);
    getStudentFeeDetails(selectedStudent.id)
      .then((plans) => {
        setFeePlans(plans);
        if (plans.length > 0) {
          const first = plans[0];
          setSelectedPlanId(first.id);
          const firstDue = first.installments.find((i) => i.remainingAmount > 0);
          if (firstDue) {
            setSelectedInstallmentId(firstDue.id);
            setAmount(String(firstDue.remainingAmount));
          } else {
            setSelectedInstallmentId("");
            setAmount(String(first.balanceAmount));
          }
        }
      })
      .catch(() => setFeePlans([]))
      .finally(() => setLoadingPlans(false));
  }, [selectedStudent]);

  // Debounced student search
  useEffect(() => {
    if (!searchQuery.trim() || (selectedStudent && searchQuery === selectedStudent.name)) {
      setStudentResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getStudents({ search: searchQuery, limit: 5 });
        setStudentResults(res.students);
      } catch {
        setStudentResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedStudent]);

  const selectedPlan = feePlans.find((p) => p.id === selectedPlanId);
  const selectedInstallment = selectedPlan?.installments.find(
    (i) => i.id === selectedInstallmentId
  );

  const handleInstallmentChange = (instId: string) => {
    setSelectedInstallmentId(instId);
    if (!instId) {
      if (selectedPlan) setAmount(String(selectedPlan.balanceAmount));
      return;
    }
    const inst = selectedPlan?.installments.find((i) => i.id === instId);
    if (inst) setAmount(String(inst.remainingAmount));
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = feePlans.find((p) => p.id === planId);
    if (plan) {
      const firstDue = plan.installments.find((i) => i.remainingAmount > 0);
      if (firstDue) {
        setSelectedInstallmentId(firstDue.id);
        setAmount(String(firstDue.remainingAmount));
      } else {
        setSelectedInstallmentId("");
        setAmount(String(plan.balanceAmount));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedPlanId) {
      setErrorMsg("Please select a student and fee plan.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than zero.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await recordPayment({
          studentId: selectedStudent.id,
          feePlanId: selectedPlanId,
          installmentId: selectedInstallmentId || undefined,
          amount: parsedAmount,
          paymentMethod,
          referenceNo: referenceNo.trim() || undefined,
          collectedBy: collectedBy.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setResultReceipt(res.payment.receiptNo);
        onSuccess();
        window.dispatchEvent(new CustomEvent("erp-data-refresh"));
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to record payment.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Collect Student Fee</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record fee payment, adjust student balance, and generate official voucher.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {resultReceipt ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Payment Realized Successfully</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Official payment receipt has been generated in Futurex ERP.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border max-w-xs mx-auto space-y-1">
                <p className="text-[11px] text-muted-foreground uppercase font-medium">Receipt Number</p>
                <p className="text-lg font-mono font-black text-primary">{resultReceipt}</p>
                <p className="text-xs text-muted-foreground">Amount: {formatCurrency(parseFloat(amount))}</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href={`/finance/receipts/${resultReceipt}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt (A4)</span>
                </Link>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Student Lookup */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-foreground">
                  Student <span className="text-destructive">*</span>
                </label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-semibold text-xs text-foreground">{selectedStudent.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {selectedStudent.studentId} • Adm: {selectedStudent.admissionNo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setSearchQuery("");
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search student by name, student code, or admission no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {studentResults.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden divide-y text-xs">
                        {studentResults.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedStudent(s);
                              setSearchQuery(s.name);
                              setStudentResults([]);
                            }}
                            className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {s.studentId} • Adm: {s.admissionNo}
                              </p>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {s.enrollments?.[0]?.batch?.name || "Class"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fee Plan Breakdown (Total, Deposited, Pending) */}
              {loadingPlans ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading student fee account...</span>
                </div>
              ) : selectedStudent && feePlans.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                  No active fee plan found for this student. Please configure a Fee Plan first.
                </div>
              ) : selectedStudent && feePlans.length > 0 ? (
                <>
                  {feePlans.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Select Fee Plan</label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
                      >
                        {feePlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (Balance: {formatCurrency(p.balanceAmount)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 3-Pillar Fee Box: Total, Deposited, Pending in ONE place */}
                  {selectedPlan && (
                    <div className="p-3.5 rounded-xl border bg-muted/40 space-y-2">
                      <div className="flex justify-between items-center text-xs border-b pb-2">
                        <span className="font-bold text-foreground">{selectedPlan.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedPlan.balanceAmount === 0
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : selectedPlan.paidAmount > 0
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {selectedPlan.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-background border">
                          <span className="text-[10px] text-muted-foreground block uppercase font-medium">Total Fees</span>
                          <span className="font-black text-foreground">{formatCurrency(selectedPlan.finalAmount)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60">
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block uppercase font-medium">Deposited</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPlan.paidAmount)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60">
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 block uppercase font-medium">Pending Due</span>
                          <span className="font-black text-amber-600 dark:text-amber-400">{formatCurrency(selectedPlan.balanceAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Installment selection */}
                  {selectedPlan && selectedPlan.installments.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Specific Installment (Optional)
                      </label>
                      <select
                        value={selectedInstallmentId}
                        onChange={(e) => handleInstallmentChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
                      >
                        <option value="">General Payment toward Fee Plan Balance</option>
                        {selectedPlan.installments.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.title} — Due {formatDate(inst.dueDate)} — Remaining:{" "}
                            {formatCurrency(inst.remainingAmount)} ({inst.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Amount and Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Amount to Collect (₹) <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">₹</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border bg-background text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground font-medium"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reference and Collected By */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Reference / UTR / Cheque No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI-9988223344"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Collected By</label>
                      <input
                        type="text"
                        value={collectedBy}
                        onChange={(e) => setCollectedBy(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Accounting Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or remarks regarding this fee deposit..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground resize-none"
                    />
                  </div>
                </>
              ) : null}

              {/* Submit buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedStudent || !selectedPlanId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Record Payment &amp; Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Fee & Payments Management Page ──────────────────────────────────────
export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "receipts">("accounts");

  // Accounts state (Student Fee Ledger)
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatus, setStudentStatus] = useState("ALL");
  const [studentBatch, setStudentBatch] = useState("ALL");
  const [batchList, setBatchList] = useState<{ id: string; name: string }[]>([]);

  // Receipts state
  const [receiptsData, setReceiptsData] = useState<PaymentsResult | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [receiptPage, setReceiptPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStudent, setModalStudent] = useState<StudentSearchResult | null>(null);

  // Load Batches
  useEffect(() => {
    getBatches({ status: "ACTIVE" })
      .then((b) => setBatchList(b.map((item) => ({ id: item.id, name: item.name }))))
      .catch(() => {});
  }, []);

  // Fetch Student Fee Accounts
  const fetchStudentAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const data = await getStudentFeeAccounts({
        search: studentSearch || undefined,
        status: studentStatus,
        batchId: studentBatch !== "ALL" ? studentBatch : undefined,
      });
      setAccounts(data);
    } catch {
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [studentSearch, studentStatus, studentBatch]);

  useEffect(() => {
    fetchStudentAccounts();
  }, [fetchStudentAccounts]);

  // Fetch receipts
  const fetchReceipts = useCallback(async () => {
    setReceiptsLoading(true);
    try {
      const result = await getPayments({
        search: receiptSearch || undefined,
        method: methodFilter === "ALL" ? undefined : methodFilter,
        page: receiptPage,
        limit: 20,
      });
      setReceiptsData(result);
    } catch {
      setReceiptsData(null);
    } finally {
      setReceiptsLoading(false);
    }
  }, [receiptSearch, methodFilter, receiptPage]);

  useEffect(() => {
    if (activeTab === "receipts") {
      fetchReceipts();
    }
  }, [activeTab, fetchReceipts]);

  // Reactive auto-refresh when campus or payments mutate
  useEffect(() => {
    const handleReactiveRefresh = () => {
      fetchStudentAccounts();
      if (activeTab === "receipts") {
        fetchReceipts();
      }
    };

    window.addEventListener("erp-campus-changed", handleReactiveRefresh);
    window.addEventListener("erp-data-refresh", handleReactiveRefresh);
    return () => {
      window.removeEventListener("erp-campus-changed", handleReactiveRefresh);
      window.removeEventListener("erp-data-refresh", handleReactiveRefresh);
    };
  }, [fetchStudentAccounts, fetchReceipts, activeTab]);

  // Open modal with pre-selected student
  const handleCollectForStudent = (s: StudentAccount) => {
    setModalStudent({
      id: s.studentId,
      name: s.name,
      studentId: s.studentCode,
      admissionNo: s.admissionNo,
      phone: s.phone,
      enrollments: [],
    } as unknown as StudentSearchResult);
    setShowModal(true);
  };

  const payments: PaymentRow[] = receiptsData?.payments ?? [];
  const totalPages = receiptsData?.totalPages ?? 1;

  const methodBadgeColor: Record<string, string> = {
    CASH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    UPI: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
    BANK_TRANSFER: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-400",
    CARD: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400",
    OTHER: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Collection &amp; Student Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Monitor each student&apos;s individual fee status (Total, Deposited, Pending) and collect payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalStudent(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Collect Fee</span>
          </button>
        </div>
      </div>

      {/* ── Module Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b text-xs font-medium space-x-6">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "accounts"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Student Fee Ledger ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("receipts")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "receipts"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Payment Receipts History</span>
        </button>
      </div>

      {/* ── TAB 1: STUDENT FEE LEDGER (Per-Student Total, Deposit, Pending) ──── */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search student by name, student code, or admission number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={studentBatch}
                    onChange={(e) => setStudentBatch(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
                  >
                    <option value="ALL">All Batches</option>
                    {batchList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PENDING">Pending Dues</option>
                    <option value="PARTIAL">Partially Deposited</option>
                    <option value="PAID">Fully Cleared</option>
                    <option value="NO_PLAN">No Fee Plan</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Cards List */}
          {accountsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Loading student fee records...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center border rounded-xl bg-card space-y-2">
              <UserCheck className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
              <p className="font-semibold text-sm">No students match your filter</p>
              <p className="text-xs text-muted-foreground">
                Try clearing search terms or selecting &quot;All Payment Statuses&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.studentId}
                  className="border rounded-xl p-4 bg-card text-card-foreground space-y-3.5 shadow-xs hover:border-primary/40 transition-colors"
                >
                  {/* Student Header & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/students/${acc.studentId}`}
                          className="font-bold text-sm hover:text-primary transition-colors"
                        >
                          {acc.name}
                        </Link>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            acc.feeStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : acc.feeStatus === "PARTIAL"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                              : acc.feeStatus === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {acc.feeStatus === "PAID"
                            ? "CLEARED"
                            : acc.feeStatus === "PARTIAL"
                            ? "PARTIAL"
                            : acc.feeStatus === "PENDING"
                            ? "PENDING"
                            : "NO PLAN"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        ID: {acc.studentCode} • Adm: {acc.admissionNo} • {acc.batchName}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCollectForStudent(acc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Collect</span>
                    </button>
                  </div>

                  {/* ── 3-PILLAR BOX: TOTAL, DEPOSIT, PENDING IN ONE PLACE ── */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/40 border">
                      <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                        Total Fees
                      </span>
                      <span className="font-black text-foreground text-sm">
                        {formatCurrency(acc.totalFees)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block uppercase font-medium">
                        Deposited
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(acc.totalDeposited)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60">
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 block uppercase font-medium">
                        Pending Due
                      </span>
                      <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                        {formatCurrency(acc.totalPending)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Realization Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Realization</span>
                      <span className="font-semibold text-foreground">{acc.realizationPercent}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${acc.realizationPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PAYMENT RECEIPTS HISTORY ──────────────────────────────────── */}
      {activeTab === "receipts" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Payment Receipts Ledger</CardTitle>
                <CardDescription>
                  Verified deposit transactions, payment modes, and printable vouchers.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search receipt or student..."
                    value={receiptSearch}
                    onChange={(e) => {
                      setReceiptSearch(e.target.value);
                      setReceiptPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <select
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value);
                    setReceiptPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border bg-background text-foreground"
                >
                  <option value="ALL">All Modes</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {receiptsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">Loading transaction history...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                      <th className="p-3 pl-4">Receipt No</th>
                      <th className="p-3">Student Particulars</th>
                      <th className="p-3">Fee Plan / Installment</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Reference / UTR</th>
                      <th className="p-3">Deposit Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 pr-4 text-right">Print Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          No payment receipts found matching your search.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-primary">
                            {p.receiptNo}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground block">{p.student.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {p.student.studentId}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {p.installment?.title ?? p.feePlan.title}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                methodBadgeColor[p.paymentMethod] ?? methodBadgeColor["OTHER"]
                              }`}
                            >
                              {p.paymentMethod.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {p.referenceNo || "—"}
                          </td>
                          <td className="p-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Link
                              href={`/finance/receipts/${p.receiptNo}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold hover:bg-muted transition-colors"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Print</span>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {receiptPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReceiptPage((p) => Math.max(1, p - 1))}
                    disabled={receiptPage === 1}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setReceiptPage((p) => Math.min(totalPages, p + 1))}
                    disabled={receiptPage === totalPages}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Collect Fee Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <CollectFeeModal
          initialStudent={modalStudent}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchStudentAccounts();
            if (activeTab === "receipts") {
              fetchReceipts();
            }
          }}
        />
      )}
    </div>
  );
}
