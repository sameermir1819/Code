"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, MessageSquare, Copy, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutstandingRecord {
  studentName: string;
  studentCode: string;
  admissionNo?: string;
  batchName: string;
  courseName: string;
  parentName?: string | null;
  parentPhone?: string | null;
  studentPhone?: string | null;
  installmentTitle: string;
  dueDate: Date | string;
  remainingAmount: number;
  daysOverdue: number;
  isOverdue: boolean;
}

interface OutstandingToolbarProps {
  records: OutstandingRecord[];
}

export function OutstandingToolbar({ records }: OutstandingToolbarProps) {
  const [copied, setCopied] = useState(false);

  // 1-Click Export CSV
  const handleExportCSV = () => {
    if (!records.length) return;

    const headers = [
      "Student Name",
      "Roll No",
      "Admission No",
      "Batch",
      "Course",
      "Parent Name",
      "Contact Phone",
      "Installment",
      "Due Date",
      "Remaining Amount (INR)",
      "Days Overdue",
      "Status",
    ];

    const rows = records.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentCode}"`,
      `"${r.admissionNo}"`,
      `"${r.batchName}"`,
      `"${r.courseName}"`,
      `"${r.parentName || ""}"`,
      `"${r.parentPhone || r.studentPhone || ""}"`,
      `"${r.installmentTitle}"`,
      new Date(r.dueDate).toLocaleDateString("en-IN"),
      r.remainingAmount,
      r.daysOverdue,
      r.isOverdue ? "OVERDUE" : "PENDING",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Fee_Defaulters_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Broadcast Message Template
  const handleCopyBroadcastTemplate = () => {
    const template =
      "Dear Parent,\nThis is an official fee reminder from Futurex Learning Accounts Desk.\nKindly ensure clearance of the pending fee installment for your ward at the earliest.\n\nTo view or pay online, please visit your student portal or contact the campus accounts division.\nThank you,\nFuturex Learning Finance Team";

    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyBroadcastTemplate}
        className="text-xs gap-1.5 h-9 rounded-xl"
        title="Copy standard broadcast message template"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span>{copied ? "Template Copied!" : "Broadcast Template"}</span>
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleExportCSV}
        className="text-xs gap-1.5 h-9 rounded-xl shadow-xs"
        title="Export full defaulter list to Excel / CSV"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export Defaulters CSV</span>
      </Button>
    </div>
  );
}
